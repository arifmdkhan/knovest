const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { z } = require('zod');

function load(file, mocks, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, console: { error() {} }, ...globals, require: name => {
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return exports;
}
const currentUser = { id: 'owner', username: 'old_name', name: 'Before' };
function serverMocks(user = currentUser) {
  return {
    zod: { z },
    '@/lib/safe-action': { safeAction: (schema, handler) => async input => handler(schema.parse(input), { user }) },
    '@/lib/db': { prisma: { user: { findUnique: async () => ({ ...currentUser, username: 'new_name', name: 'After' }), update: async () => ({}) } } },
    '@/features/media/actions/stream.action': { syncStreamUser: async () => ({ status: 'success' }) },
  };
}

test('availability accepts the authenticated owner, rejects another owner and anonymous claims', async () => {
  for (const [actor, ownerId, expected] of [[currentUser, 'owner', 'success'], [currentUser, 'other', 'error'], [undefined, 'owner', 'error']]) {
    const mocks = serverMocks();
    mocks['@/lib/safe-action'] = { safeAction: (schema, handler) => input => handler(schema.parse(input), { user: actor }) };
    mocks['@/lib/db'].prisma.user.findUnique = async ({ where }) => {
      assert.equal(where.username, 'new_name');
      return { id: ownerId };
    };
    const { checkUsernameAvailability } = load('src/features/auth/actions/register.action.ts', mocks);
    assert.equal((await checkUsernameAvailability({ username: 'NEW_NAME' })).status, expected);
  }
});

function profileActions(overrides = {}) {
  const invalidated = [];
  const calls = [];
  const mocks = serverMocks();
  Object.assign(mocks, {
    '@/lib/auth': { auth: { api: {
      updateUser: async input => calls.push(['updateUser', input]),
      getSession: async input => calls.push(['getSession', input]),
      ...overrides,
    } } },
    'next/headers': { headers: async () => 'request-headers' },
    'next/cache': { revalidatePath: path => invalidated.push(path) },
    '@/features/notifications/services/create-notification': {},
    '@/features/user/queries/get-profile': {},
  });
  return { ...load('src/features/user/user.action.ts', mocks), mocks, calls, invalidated };
}

test('account updates return canonical identity, refresh old and new profile routes, and preserve display username', async () => {
  const action = profileActions();
  const result = await action.updateAccountSettings({ name: 'After', username: 'NEW_NAME' });
  assert.equal(result.status, 'success');
  assert.equal(result.data.username, 'new_name');
  assert.equal(action.calls[0][1].body.displayUsername, 'NEW_NAME');
  assert.equal(action.calls[0][1].headers, 'request-headers');
  assert.ok(action.invalidated.includes('/profile/old_name'));
  assert.ok(action.invalidated.includes('/profile/new_name'));
  assert.ok(!action.invalidated.includes('/profile/NEW_NAME'));
});

test('a rejected account update never syncs or invalidates profiles', async () => {
  const action = profileActions({ updateUser: async () => { throw new Error('Username is already taken'); } });
  action.mocks['@/features/media/actions/stream.action'].syncStreamUser = () => assert.fail('must not sync rejected update');
  assert.equal((await action.updateAccountSettings({ name: 'After', username: 'taken' })).status, 'error');
  assert.equal(action.invalidated.length, 0);
});

test('profile edits refresh auth cookies from the saved DB row instead of swallowing cache errors', async () => {
  const action = profileActions();
  let saved = false;
  action.mocks['@/lib/db'].prisma.user.update = async () => { saved = true; };
  const result = await action.updateProfile({ name: 'After', image: 'https://example.com/new.webp' });
  assert.equal(result.status, 'success');
  assert.ok(saved);
  assert.equal(action.calls.length, 1);
  assert.equal(action.calls[0][0], 'getSession');
  assert.equal(action.calls[0][1].query.disableCookieCache, true);
});

function accountHarness() {
  let username = 'pending_name';
  let effect;
  let timer;
  let cleanup;
  let availability;
  let resolveCheck;
  let resetValues;
  let submission;
  const events = [];
  const form = {
    watch: () => username,
    getFieldState: () => ({}), clearErrors() {},
    setError: (...args) => events.push(['error', ...args]),
    handleSubmit: callback => callback,
    reset: values => { resetValues = values; username = values.username; events.push(['reset']); },
  };
  const mocks = {
    react: { useTransition: () => [false, callback => { submission = callback(); }], useState: initial => [initial, value => { if (value && typeof value === 'object' && 'status' in value) availability = value; }], useEffect: callback => { effect = callback; } },
    'react-hook-form': { useForm: () => form },
    '@hookform/resolvers/zod': { zodResolver() {} },
    zod: { ...require('zod') },
    sonner: { toast: { success: () => events.push(['success']), error: message => events.push(['toastError', message]) } },
    'lucide-react': {},
    '@/components/NavigationProvider': { useRouter: () => ({ refresh: () => events.push(['routerRefresh']) }) },
    '@/lib/auth-client': { authClient: { useSession: () => ({ refetch: async options => { assert.equal(options.query.disableCookieCache, true); events.push(['sessionRefresh']); } }) } },
    '@/features/auth/actions/register.action': { checkUsernameAvailability: () => new Promise(resolve => { resolveCheck = resolve; }) },
    '@/features/user/user.action': { updateAccountSettings: async () => ({ status: 'success', data: { name: 'After', username: 'new_name' } }) },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  };
  for (const name of ['button', 'form', 'input', 'card']) mocks[`@/components/ui/${name}`] = {};
  const { AccountForm } = load('src/app/(platform)/settings/_components/AccountForm.tsx', mocks, { setTimeout: callback => { timer = callback; return 1; }, clearTimeout() {} });
  const tree = AccountForm({ user: currentUser });
  function findSubmit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'form') return node.props.onSubmit;
    for (const child of [].concat(node.props?.children || [])) { const result = findSubmit(child); if (result) return result; }
  }
  return {
    events, get availability() { return availability; }, get resetValues() { return resetValues; },
    startCheck: () => { cleanup = effect(); return timer(); },
    resolve: result => resolveCheck(result), cancel: () => cleanup(),
    submit: data => { findSubmit(tree)(data); return submission; },
  };
}

test('outdated availability responses cannot overwrite a newer input or completed save', async () => {
  const h = accountHarness();
  const pending = h.startCheck();
  h.cancel();
  h.resolve({ status: 'error', message: 'Username is already taken' });
  await pending;
  assert.equal(h.events.filter(event => event[0] === 'error').length, 0);
  assert.notEqual(h.availability.status, 'taken');
});

test('successful save resets canonical username and refreshes shared session before success or route refresh', async () => {
  const h = accountHarness();
  await h.submit({ name: 'After', username: 'NEW_NAME' });
  assert.equal(h.resetValues.username, 'new_name');
  assert.deepEqual(h.events.map(event => event[0]), ['reset', 'sessionRefresh', 'success', 'routerRefresh']);
});

test('availability network failure remains retryable and never says username is taken', async () => {
  const h = accountHarness();
  const pending = h.startCheck();
  h.resolve({ status: 'error', message: 'Failed to validate username' });
  await pending;
  assert.equal(h.availability.status, 'error');
  assert.equal(h.events.filter(event => event[0] === 'error').length, 0);
});

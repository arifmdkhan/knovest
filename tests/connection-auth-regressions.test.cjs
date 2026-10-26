const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, ...globals, require: name => {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.css')) return {};
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return exports;
}
const jsx = (type, props) => ({ type, props });
function text(node) {
  if (typeof node === 'string') return node;
  return [].concat(node?.props?.children || []).map(text).join(' ');
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [].concat(node.props?.children || [])) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

function streamHarness(token = 'authorized', initialPath = '/chat') {
  let effect, resolve, reject, disconnected = 0, connected = 0, context, cursor = 0, dirty = false;
  let pathname = initialPath, previousDeps, cleanup;
  const states = [];
  const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
  const Chat = 'Chat';
  const client = { connectUser: () => { connected++; return pending; }, disconnectUser: async () => { disconnected++; } };
  const mocks = {
    react: {
      createContext: () => ({ Provider: 'ConnectionContext' }), useContext: () => context,
      useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], next => { states[index] = next; dirty = true; }]; },
      useEffect: (next, deps) => { if (!previousDeps || deps.some((dep, index) => dep !== previousDeps[index])) { effect = next; previousDeps = deps; } },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/features/media/actions/stream.action': {},
    '@/lib/stream-lifecycle': { registerStreamCleanup: () => () => {} },
    'stream-chat': { StreamChat: function () { return client; } },
    'stream-chat-react': { Chat },
    'next-themes': { useTheme: () => ({ resolvedTheme: 'dark' }) },
    'next/navigation': { usePathname: () => pathname },
    '@/components/PageSkeleton': { PageSkeleton: 'PageSkeleton' },
  };
  const owner = load('src/components/providers/StreamChatConnectionProvider.tsx', mocks, { process: { env: { NEXT_PUBLIC_STREAM_API_KEY: 'test-key' } } });
  mocks['./StreamChatConnectionProvider'] = owner;
  const { StreamChatConnectionProvider } = owner;
  const { StreamChatProvider } = load('src/components/providers/StreamChatProvider.tsx', mocks);
  function render(id = 'user') {
    do {
      cursor = 0; dirty = false;
      context = StreamChatConnectionProvider({ user: { id, name: id }, streamToken: token, children: 'platform content' }).props.value;
    } while (dirty);
    return StreamChatProvider({ children: 'room content', skeleton: pathname.startsWith('/trade-room') ? 'room' : 'chat' });
  }
  function start() {
    if (effect) { cleanup?.(); const next = effect; effect = null; cleanup = next(); }
    return () => cleanup?.();
  }
  return {
    render, start,
    navigate: path => { pathname = path; render(); start(); return render(); },
    resolve: async () => { resolve(); await pending; await Promise.resolve(); },
    reject: async () => { reject(new Error('Network failure')); await pending.catch(() => {}); await Promise.resolve(); },
    get disconnected() { return disconnected; },
    get connected() { return connected; },
  };
}

test('Stream shows the page skeleton until authorization succeeds, without flashing unavailable', async () => {
  const h = streamHarness();
  assert.equal(h.render().type, 'PageSkeleton');
  assert.equal(h.render().props.variant, 'chat');
  assert.doesNotMatch(text(h.render()), /unavailable/);
  const cleanup = h.start();
  assert.equal(h.render().type, 'PageSkeleton');
  await h.resolve();
  assert.equal(h.render().type, 'Chat');
  assert.equal(h.render('different-user').type, 'PageSkeleton');
  cleanup();
});

test('Stream still reports unavailable for a real connection failure or disabled access', async () => {
  const h = streamHarness();
  h.render(); h.start(); await h.reject();
  assert.match(text(h.render()), /Live connections are unavailable/);
  assert.match(text(streamHarness('').render()), /Live connections are unavailable/);
});

test('a connection completing after unmount is disconnected and cannot publish a ready client', async () => {
  const h = streamHarness();
  h.render(); const cleanup = h.start(); cleanup();
  await h.resolve(); await Promise.resolve();
  assert.equal(h.disconnected, 1);
  assert.equal(h.render().type, 'PageSkeleton');
});

test('the shared connection starts lazily and survives Chat, Trade Room and other platform navigation', async () => {
  const h = streamHarness('authorized', '/home');
  h.render(); h.start();
  assert.equal(h.connected, 0);
  assert.equal(h.navigate('/trade-room').props.variant, 'room');
  assert.equal(h.connected, 1);
  await h.resolve();
  for (const path of ['/chat', '/trade-room', '/home', '/chat/group', '/trade-room/audio-room/example']) {
    assert.equal(h.navigate(path).type, 'Chat');
  }
  assert.equal(h.connected, 1);
  assert.equal(h.disconnected, 0);
});

function otpHarness({ response = {}, failNetwork = false, draft = null, profileError = false } = {}) {
  let submission, finish;
  const events = [];
  const request = new Promise(resolve => { finish = resolve; });
  const mocks = {
    react: { useState: initial => [initial === '' ? '123456' : initial, () => {}], useEffect() {}, useTransition: () => [false, next => { submission = next(); }] },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useSearchParams: () => new URLSearchParams('email=test@example.com') },
    '@/components/NavigationProvider': { useRouter: () => ({ push: () => assert.fail('must not reuse client router after sign-in') }) },
    sonner: { toast: { success: () => events.push('success'), error: () => events.push('error') } },
    'lucide-react': {},
    '@/lib/auth-client': { authClient: { signIn: { emailOtp: async () => { await request; if (failNetwork) throw new Error('offline'); events.push('response'); return response; } } } },
    '@/features/auth/actions/register.action': { updateProfileAfterLogin: async () => { events.push('profile'); return { status: profileError ? 'error' : 'success' }; } },
  };
  for (const name of ['button', 'card', 'input-otp']) mocks[`@/components/ui/${name}`] = {};
  const { OTPForm } = load('src/app/(auth)/_components/OTPForm.tsx', mocks, {
    URLSearchParams,
    sessionStorage: { getItem: () => draft, removeItem: () => events.push('clearDraft') },
    window: { location: { replace: path => events.push(path) } },
  });
  return {
    events,
    submit: () => { find(OTPForm(), node => typeof node.props?.onClick === 'function' && node.props.className?.includes('auth-verify')).props.onClick(); return submission; },
    finish: () => finish(),
  };
}

test('OTP waits for sign-in completion, then replaces the document with authenticated home', async () => {
  const h = otpHarness();
  const pending = h.submit();
  assert.deepEqual(h.events, []);
  h.finish(); await pending;
  assert.deepEqual(h.events, ['response', 'success', '/home']);
});

test('invalid OTP and network failures stay on the form', async () => {
  for (const options of [{ response: { error: { message: 'Invalid OTP' } } }, { failNetwork: true }]) {
    const h = otpHarness(options);
    const pending = h.submit(); h.finish(); await pending;
    assert.ok(h.events.includes('error'));
    assert.ok(!h.events.some(event => event.startsWith('/')));
  }
});

test('new-user profile setup completes before navigation, with settings fallback on failure', async () => {
  for (const profileError of [false, true]) {
    const h = otpHarness({ draft: JSON.stringify({ email: 'test@example.com', name: 'Test', username: 'tester' }), profileError });
    const pending = h.submit(); h.finish(); await pending;
    assert.ok(h.events.indexOf('profile') > h.events.indexOf('response'));
    assert.equal(h.events.at(-1), profileError ? '/settings/account?onboarding=1' : '/home');
  }
});

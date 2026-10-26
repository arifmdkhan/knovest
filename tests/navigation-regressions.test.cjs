const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return exports;
}

test('navigation feedback forwards router destinations and options without rewriting history', () => {
  const calls = [];
  let transitions = 0;
  const router = Object.fromEntries(['push', 'replace', 'back', 'forward', 'refresh', 'prefetch'].map(method => [method, (...args) => calls.push({ method, args })]));
  const { useRouter } = load('src/components/NavigationProvider.tsx', {
    react: { createContext: () => ({}), useMemo: factory => factory(), useContext: () => ({ startNavigation: action => { transitions++; action(); } }) },
    'next/navigation': { useRouter: () => router },
    'react/jsx-runtime': {},
  });
  const tracked = useRouter();
  tracked.push('/academy/course/example?chapter=2#curriculum', { scroll: false });
  tracked.replace('/search?q=markets', { scroll: false });
  tracked.back(); tracked.forward(); tracked.refresh();
  assert.equal(transitions, 5);
  assert.equal(calls[0].method, 'push');
  assert.equal(calls[0].args[0], '/academy/course/example?chapter=2#curriculum');
  assert.equal(calls[0].args[1].scroll, false);
  assert.equal(calls[1].args[0], '/search?q=markets');
  assert.equal(tracked.prefetch, router.prefetch);
});

test('tracked links retain native Next Link props and clear pending feedback on interruption', () => {
  let pending = true;
  let cleanup;
  const events = [];
  const NativeLink = () => null;
  const jsx = (type, props) => ({ type, props });
  const { default: AppLink } = load('src/components/AppLink.tsx', {
    react: { useId: () => 'link-1', useEffect: action => { cleanup = action(); } },
    'next/link': { __esModule: true, default: NativeLink, useLinkStatus: () => ({ pending }) },
    '@/components/NavigationProvider': { useNavigationFeedback: () => ({ setLinkPending: (id, active) => events.push([id, active]) }) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
  });
  const click = () => {};
  const ref = {};
  const link = AppLink({ href: '/academy/article/example', prefetch: false, target: '_blank', onClick: click, ref, children: 'Read article' });
  assert.equal(link.type, NativeLink);
  assert.equal(link.props.target, '_blank');
  assert.equal(link.props.prefetch, false);
  assert.equal(link.props.onClick, click);
  assert.equal(link.props.ref, ref);
  const hint = link.props.children[1];
  hint.type();
  assert.deepEqual(events[0], ['link-1', true]);
  cleanup();
  assert.deepEqual(events[1], ['link-1', false]);
  pending = false;
  hint.type();
  assert.deepEqual(events[2], ['link-1', false]);
});

test('loading shells are available before fetching course, article and sidebar destinations', () => {
  const paths = [
    '(platform)', '(platform)/home', '(platform)/search', '(platform)/bookmark',
    '(platform)/notifications', '(platform)/profile/[username]', '(platform)/chat',
    '(platform)/trade-room', '(platform)/academy', '(platform)/settings',
    '(platform)/academy/course/[slug]', '(platform)/academy/article/[slug]',
    '(platform)/academy/enrolled/[slug]', 'admin', '(marketing)', '(auth)',
  ];
  for (const path of paths) {
    const source = fs.readFileSync(`src/app/${path}/loading.tsx`, 'utf8');
    assert.match(source, /PageSkeleton/, path);
    assert.doesNotMatch(source, /await |prisma|requireUser/, path);
  }
});

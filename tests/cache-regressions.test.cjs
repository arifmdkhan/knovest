const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => { if (name in mocks) return mocks[name]; throw Error(`Unexpected dependency ${name}`); },
  });
  return exports;
}
test('home mounts the cached feed without waiting for a server data read', async () => {
  const FeedTabs = () => null;
  const jsx = (type, props) => ({ type, props });
  const never = new Promise(() => {});
  const mocks = {
    react: { Suspense: 'suspense' }, 'react/jsx-runtime': { jsx, jsxs: jsx },
    './_components/FeedTabs': { FeedTabs },
    './_components/right-sidebar/FollowSuggestionsContainer': { FollowSuggestionsContainer: () => null },
    './_components/right-sidebar/FollowSuggestions': {},
    './_components/Feed': {}, '@/lib/metadata': { createMetadata: value => value },
    '@/features/posts/queries/get-posts': { getFeedPosts: () => never },
    '@/lib/get-sessions': { getServerSession: async () => ({ user: { id: 'owner' } }) },
    '@/features/courses/queries/get-recent-course': { getRecentPublicCourse: () => never },
    '@/app/(platform)/academy/course/_components/PublicCourseCard': {},
    './_components/RecentCourse': { RecentCourse: () => null },
  };
  const { default: Home } = load('src/app/(platform)/home/page.tsx', mocks);
  async function findFeed(node) {
    if (!node || typeof node !== 'object') return false;
    if (node.type === FeedTabs) return true;
    if (typeof node.type === 'function') return findFeed(await node.type(node.props));
    for (const child of [].concat(node.props?.children || [])) if (await findFeed(child)) return true;
    return false;
  }
  const found = await Promise.race([findFeed(await Home()), new Promise(resolve => setTimeout(() => resolve(false), 30))]);
  assert.equal(found, true, 'server feed read hides the browser cache behind Suspense');
});

const queryLibrary = require('@tanstack/react-query');
const { createQueryClient } = load('src/lib/query-client.ts', { '@tanstack/react-query': queryLibrary });

test('a return visit shows cached content synchronously while checking for new content', async () => {
  const client = createQueryClient();
  try {
    const key = ['courses', { category: 'markets' }];
    await client.fetchQuery({ queryKey: key, queryFn: async () => ['old course'] });
    let finish;
    const observer = new queryLibrary.QueryObserver(client, { queryKey: key, queryFn: () => new Promise(resolve => { finish = resolve; }) });
    const unsubscribe = observer.subscribe(() => {});
    try {
      assert.deepEqual(observer.getCurrentResult().data, ['old course']);
      assert.equal(observer.getCurrentResult().isPending, false);
      assert.equal(observer.getCurrentResult().isFetching, true);
      finish(['new course', 'old course']);
      await new Promise(setImmediate);
      assert.deepEqual(observer.getCurrentResult().data, ['new course', 'old course']);
    } finally { unsubscribe(); }
  } finally { client.clear(); }
});

test('failed background refresh retains cached data and exposes a retryable error', async () => {
  const client = createQueryClient();
  try {
    const key = ['articles', 'catalogue'];
    client.setQueryData(key, ['last loaded article']);
    const observer = new queryLibrary.QueryObserver(client, { queryKey: key, retry: false, queryFn: async () => { throw Error('offline'); } });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await new Promise(setImmediate);
      assert.equal(observer.getCurrentResult().isError, true);
      assert.deepEqual(observer.getCurrentResult().data, ['last loaded article']);
      assert.equal(observer.getCurrentResult().isPending, false);
      observer.setOptions({ queryKey: key, queryFn: async () => ['fresh article'] });
      await observer.refetch();
      assert.deepEqual(observer.getCurrentResult().data, ['fresh article']);
    } finally { unsubscribe(); }
  } finally { client.clear(); }
});

test('simultaneous readers deduplicate their refresh and user caches stay separate', async () => {
  const firstUser = createQueryClient();
  const secondUser = createQueryClient();
  try {
    let requests = 0;
    let finish;
    const options = { queryKey: ['posts', 'feed'], queryFn: () => { requests++; return new Promise(resolve => { finish = resolve; }); } };
    const first = new queryLibrary.QueryObserver(firstUser, options);
    const second = new queryLibrary.QueryObserver(firstUser, options);
    const stopFirst = first.subscribe(() => {});
    const stopSecond = second.subscribe(() => {});
    try {
      assert.equal(requests, 1);
      finish(['private first-user post']);
      await new Promise(setImmediate);
      assert.equal(secondUser.getQueryData(options.queryKey), undefined);
    } finally { stopFirst(); stopSecond(); }
    firstUser.clear();
    assert.equal(firstUser.getQueryData(options.queryKey), undefined);
  } finally { firstUser.clear(); secondUser.clear(); }
});

test('successful mutations invalidate browser queries as well as server paths', async () => {
  const client = createQueryClient();
  try {
    client.setQueryData(['courses'], ['old']);
    const mutation = new queryLibrary.MutationObserver(client, { mutationFn: async () => 'saved' });
    await mutation.mutate();
    assert.equal(client.getQueryState(['courses']).isInvalidated, true);
    assert.ok(client.getDefaultOptions().queries.gcTime >= 30 * 60_000);
  } finally { client.clear(); }
});

test('infinite feeds rebuild cursors when new content shifts page boundaries', async () => {
  const client = createQueryClient();
  try {
    let updated = false;
    const cursors = [];
    const options = {
      queryKey: ['posts', 'feed'], initialPageParam: undefined,
      queryFn: async ({ pageParam }) => {
        cursors.push(pageParam);
        if (pageParam === undefined) return updated ? { posts: ['new', 'a'], nextCursor: 'a' } : { posts: ['a', 'b'], nextCursor: 'b' };
        return pageParam === 'a' ? { posts: ['b', 'c'] } : { posts: ['c', 'd'] };
      },
      getNextPageParam: page => page.nextCursor,
    };
    const observer = new queryLibrary.InfiniteQueryObserver(client, options);
    const unsubscribe = observer.subscribe(() => {});
    try {
      await observer.refetch();
      await observer.fetchNextPage();
      updated = true;
      await observer.refetch();
      assert.deepEqual(observer.getCurrentResult().data.pages.flatMap(page => page.posts), ['new', 'a', 'b', 'c']);
      assert.deepEqual(cursors.slice(-2), [undefined, 'a']);
    } finally { unsubscribe(); }
  } finally { client.clear(); }
});

test('the feed keeps rendered cards when its background refresh fails', () => {
  const jsx = (type, props) => ({ type, props });
  const Card = () => null;
  const { InfiniteFeed } = load('src/app/(platform)/home/_components/Feed.tsx', {
    react: { useMemo: action => action(), useEffect() {} },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': {}, './FeedCard': { FeedCard: Card }, '@/components/ui/skeleton': {},
    '@/hooks/use-post': { useGetPosts: () => ({ data: { pages: [{ posts: [{ id: 'cached-post' }] }] }, status: 'error', isFetching: false }) },
    './EmptyFeedState': {}, 'react-intersection-observer': { useInView: () => ({ inView: false }) },
    '@/components/QueryFeedback': { QueryFeedback: () => null },
  });
  const tree = InfiniteFeed({});
  const cards = tree.props.children.flat(Infinity).filter(child => child?.type === Card);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].props.post.id, 'cached-post');
});

test('content reads use the authenticated user and validate filters before database reads', async () => {
  const calls = [];
  const mocks = Object.fromEntries([...fs.readFileSync('src/features/content/read-actions.ts', 'utf8').matchAll(/from "([^"]+)"/g)].map(match => [match[1], {}]));
  mocks.zod = { z: require('zod').z };
  mocks['@/features/courses/schemas'] = { courseLevels: ['Beginner', 'Intermediate', 'Advanced'] };
  mocks['@/features/user/queries/require-user'] = { requireUser: async () => ({ id: 'signed-in-user' }) };
  mocks['@/features/courses/queries/get-all-courses'] = { getAllCourses: async (...args) => { calls.push(args); return []; } };
  const reads = load('src/features/content/read-actions.ts', mocks);
  await reads.readCourses({ category: 'markets', userId: 'forged-user' });
  assert.equal(calls[0][2], 'signed-in-user');
  assert.equal(calls[0][1], 'markets');
  await assert.rejects(reads.readCourses({ query: 'x'.repeat(201) }));
  assert.equal(calls.length, 1);
  mocks['@/features/user/queries/require-user'].requireUser = async () => { throw Error('Unauthorized'); };
  await assert.rejects(reads.readCourses(), /Unauthorized/);
  assert.equal(calls.length, 1);
});

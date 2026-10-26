const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { z } = require('zod');

function load(file, mocks = {}, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, URL, BigInt, Uint8Array, console: { error() {}, log() {} }, process: { env }, require(name) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (name === 'zod') return { z };
    if (name.startsWith('node:')) return require(name);
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return exports;
}

const assets = load('src/lib/storage/asset-keys.ts');
test('asset capabilities bind author, post, course, lesson and canonical paths', () => {
  assert.equal(assets.isPostAssetKey('users/a/posts/p/images/a.png', 'a', 'p'), true);
  for (const key of ['users/b/posts/p/images/a.png', 'users/a/posts/other/images/a.png', 'users/a/posts/p/../x.png', 'users/a/posts/p/%2e%2e/x.png', 'users/a/posts/p/\\x.png']) {
    assert.equal(assets.isPostAssetKey(key, 'a', 'p'), false);
  }
  assert.equal(assets.isLessonAssetKey('courses/a/lessons/l/resources/a.pdf', 'a', 'l', 'resources'), true);
  assert.equal(assets.isLessonAssetKey('courses/b/lessons/l/resources/a.pdf', 'a', 'l', 'resources'), false);
  assert.equal(assets.isLessonAssetKey('courses/a/lessons/other/video/raw/a.mp4', 'a', 'l', 'video'), false);
});

test('content IDs cannot create nested storage namespaces or cleanup prefixes', () => {
  const { createPostSchema } = load('src/features/posts/schemas.ts');
  for (const id of ['victim/images', '../victim', 'victim\\images', '%2e%2e', '']) {
    assert.equal(createPostSchema.safeParse({ id, content: 'text', visibility: 'PUBLIC' }).success, false);
  }
  const { enqueueCleanup } = load('src/lib/storage/cleanup-jobs.ts');
  assert.throws(() => enqueueCleanup({ cleanupJob: { create: () => assert.fail('must not enqueue') } }, 'POST', 'victim/images', []), /Invalid/);
});

test('file validation checks bytes as well as declared content type', () => {
  const { matchesFileSignature } = load('src/lib/storage/file-signature.ts');
  assert.equal(matchesFileSignature('application/pdf', Buffer.from('%PDF-1.7')), true);
  assert.equal(matchesFileSignature('image/png', Buffer.from('<svg onload=alert(1)>')), false);
  assert.equal(matchesFileSignature('video/mp4', Buffer.from([0,0,0,24,102,116,121,112,105,115,111,109])), true);
  assert.equal(matchesFileSignature('image/webp', Buffer.from('RIFF1234WEBP')), true);
  assert.equal(matchesFileSignature('image/webp', Buffer.from('RIFF1234WAVE')), false);
});

test('lesson authorization binds the lesson to the requested course and active enrollment', async () => {
  let received;
  const { getAuthorizedLesson } = load('src/features/courses/queries/authorized-lesson.ts', {
    '@/lib/db': { prisma: { lesson: { findFirst: async args => { received = args; return null; } } } },
  });
  assert.equal(await getAuthorizedLesson('course-a', 'lesson-b', 'reader'), null);
  assert.equal(received.where.id, 'lesson-b');
  assert.equal(received.where.chapter.courseId, 'course-a');
  assert.equal(received.where.chapter.course.OR[1].enrollment.some.status, 'Active');
  assert.equal(received.where.chapter.course.deletedAt, null);
});

test('post visibility includes deletion, follower/subscriber membership and original visibility', async () => {
  let query;
  const access = load('src/features/posts/access.ts', { '@/lib/db': { prisma: { post: { findFirst: async args => { query = args; return null; } } } } });
  const anon = access.postVisibilityWhere();
  assert.equal(anon.deletedAt, null);
  assert.equal(anon.author.deletedAt, null);
  assert.equal(anon.OR.length, 1);
  assert.equal(anon.OR[0].visibility, 'PUBLIC');
  const viewer = access.postVisibilityWhere('reader');
  assert.equal(viewer.OR[2].author.followedBy.some.followerId, 'reader');
  assert.equal(viewer.OR[3].author.subscribers.some.status, 'ACTIVE');
  await assert.rejects(access.requireVisiblePost('private-post', 'reader'), /unavailable/);
  assert.equal(query.where.id, 'private-post');
  assert.equal(query.where.AND[1].OR[1].Post.is.deletedAt, null);
});

function streamActions({ owner = 'other', env = {}, user = { id: 'viewer', role: 'USER' } } = {}) {
  const writes = [];
  const channel = { query: async () => ({ channel: { created_by: { id: owner } }, members: [{ user_id: user.id }] }), addMembers: async ids => writes.push(ids) };
  const mocks = {
    '@/lib/db': { prisma: { user: { findUnique: async () => ({ id: user.id, name: 'Canonical', expertVerificationType: null, accountVerificationType: null }) } } },
    '@/lib/get-sessions': { getServerSession: async () => ({ user }) },
    '@/lib/safe-action': { safeAction: (schema, handler) => async input => handler(schema.parse(input), { user }) },
    'stream-chat': { StreamChat: { getInstance: () => ({ channel: () => channel, upsertUser: async data => writes.push(data), createToken: (...args) => { writes.push({ token: args }); return new (require('stream-chat').StreamChat)('test-key', 'test-secret').createToken(...args); } }) } },
    '@stream-io/node-sdk': { StreamClient: class { video = { call: (type, id) => ({ get: async () => ({ call: { created_by: { id: owner } } }) }), deleteCall: async () => writes.push('delete') }; } },
  };
  return { ...load('src/features/media/actions/stream.action.ts', mocks, env), writes };
}
test('ordinary channel members cannot add people and subscription groups reject owner-side additions', async () => {
  const ordinary = streamActions();
  assert.equal((await ordinary.addMembersToChannel({ channelId: 'group', userIds: ['stranger'] })).status, 'error');
  assert.equal(ordinary.writes.length, 0);
  const subscription = streamActions({ owner: 'viewer' });
  assert.equal((await subscription.addMembersToChannel({ channelId: 'subscription-group-viewer', userIds: ['stranger'] })).status, 'error');
  assert.equal(subscription.writes.length, 0);
});
test('Stream sync ignores forged verification badges and stream deletion requires an owner', async () => {
  const actions = streamActions();
  assert.equal((await actions.syncStreamUser('viewer', { name: 'Forged', expertVerificationType: 'SEBI' })).status, 'success');
  assert.equal(actions.writes[0].name, 'Canonical');
  assert.equal(actions.writes[0].expertVerificationType, null);
  assert.equal((await actions.deleteStream({ type: 'audio_room', id: 'other-call' })).status, 'error');
  assert.equal(actions.writes.includes('delete'), false);
});
test('production Stream token issuance stays closed until provider permissions are verified', async () => {
  const actions = streamActions({ env: { NODE_ENV: 'production' } });
  assert.equal((await actions.getStreamToken({})).status, 'error');
  assert.equal(actions.writes.length, 0);
});

test('Stream tokens tolerate clock skew while preserving identity, revocation and four-hour expiry', async () => {
  const before = Math.floor(Date.now() / 1000);
  const actions = streamActions({ env: { NODE_ENV: 'production', STREAM_PERMISSIONS_VERIFIED: 'true' } });
  const result = await actions.getStreamToken({});
  const after = Math.floor(Date.now() / 1000);
  assert.equal(result.status, 'success');
  const claims = JSON.parse(Buffer.from(result.data.split('.')[1], 'base64url').toString());
  assert.equal(claims.user_id, 'viewer');
  assert.ok(claims.iat >= before - 60 && claims.iat <= after - 60);
  assert.ok(claims.iat <= before - 2, 'a provider two seconds behind must accept the issued-at claim');
  assert.ok(claims.exp >= before + 4 * 60 * 60 && claims.exp <= after + 4 * 60 * 60);
});

test('production does not accept lesson uploads without a qualified video worker', async () => {
  const types = load('src/lib/storage/types.ts');
  const actions = load('src/features/media/actions/video-upload.action.ts', {
    '@/lib/storage/types': types, '@/lib/storage/storage-service': {}, '@/lib/db': {}, 'next/cache': {}, '@/lib/rate-limit': {},
    '@/lib/safe-action': { safeAction: (schema, handler) => async input => handler(schema.parse(input), { user: { id: 'owner' } }) },
  }, { NODE_ENV: 'production' });
  assert.equal((await actions.initiateMultipartUploadAction({ lessonId: 'lesson', fileName: 'video.mp4', contentType: 'video/mp4', size: 1024 })).status, 'error');
  assert.equal((await actions.getMultipartUploadUrlsAction({ lessonId: 'lesson', uploadId: 'upload', key: 'key', partNumbers: [1] })).status, 'error');
});

test('public profile DTO excludes private account and application fields', async () => {
  const { getProfileByUsername } = load('src/features/user/queries/get-profile.ts', {
    react: { cache: fn => fn }, '@/lib/get-sessions': { getServerSession: async () => null },
    '@/lib/db': { prisma: { user: { findUnique: async () => ({ id: 'u', name: 'Public', email: 'private@example.test', role: 'SUPER_ADMIN', banned: true, banReason: 'private', verificationApplication: { status: 'DRAFT', panNumber: 'PRIVATE' }, _count: { followedBy: 1, following: 2, posts: 3 }, followedBy: [] }) }, subscription: { count: async () => 0 } } },
  });
  const result = await getProfileByUsername('public');
  for (const field of ['email', 'role', 'banned', 'banReason', 'panNumber']) assert.equal(field in result, false);
  assert.equal(result.verificationApplication, null);
});

test('session authorization observes deleted accounts and current ban expiry', async () => {
  let user = { id: 'u', role: 'USER', banned: true, banExpires: new Date(Date.now() + 60000) };
  const { getServerSession } = load('src/lib/get-sessions.ts', {
    react: { cache: fn => fn }, 'next/headers': { headers: async () => ({}) },
    './auth': { auth: { api: { getSession: async ({ query }) => { assert.equal(query.disableCookieCache, true); return { user }; } } } },
  });
  assert.equal(await getServerSession(), null);
  user = { ...user, banExpires: new Date(0) };
  assert.equal((await getServerSession()).user.banned, false);
  user = { ...user, banned: false, deletedAt: new Date() };
  assert.equal(await getServerSession(), null);
});

test('verification documents are owner-scoped, reviewed drafts are immutable and client approval is ignored', async () => {
  let existing = null;
  let write;
  const { saveApplicationDraft } = load('src/features/verification/actions/verification.action.ts', {
    '@/lib/get-sessions': { getServerSession: async () => ({ user: { id: 'owner' } }) },
    '@/lib/db': { prisma: { verificationApplication: { findUnique: async () => existing, upsert: async args => { write = args; return { id: 'app', status: 'DRAFT' }; } } } },
    '@/lib/rate-limit': { enforceRateLimit: async () => {} }, '@/lib/storage/asset-keys': assets,
    'next/cache': { revalidatePath() {} },
  });
  assert.equal((await saveApplicationDraft({ sebiCertUrl: 'documents/users/other/verification/a.pdf' })).status, 'error');
  assert.equal(write, undefined);
  assert.equal((await saveApplicationDraft({ fullName: 'Owner', pnlVerified: true, sebiCertUrl: 'documents/users/owner/verification/a.pdf' })).status, 'success');
  assert.equal('pnlVerified' in write.create, false);
  assert.equal(write.where.status, 'DRAFT');
  write = undefined;
  existing = { status: 'APPROVED' };
  assert.equal((await saveApplicationDraft({ fullName: 'Changed' })).status, 'error');
  assert.equal(write, undefined);
});

test('lesson media denies missing authorization before signing and refreshes signatures per segment', async () => {
  let lesson = null;
  let signed = 0;
  const { lessonMediaResponse } = load('src/features/courses/media-response.ts', {
    'next/server': require('next/server'), '@aws-sdk/client-s3': {}, '@/lib/s3-client': {},
    '@/lib/storage/storage-service': { StorageService: { getPresignedDownloadUrl: async (key, ttl) => { signed++; assert.equal(ttl, 300); return 'https://private.example.test/short-lived'; } } },
    '@/lib/storage/asset-keys': assets,
    '@/lib/get-sessions': { getServerSession: async () => ({ user: { id: 'reader' } }) },
    './queries/authorized-lesson': { getAuthorizedLesson: async () => lesson },
  });
  assert.equal((await lessonMediaResponse('course', 'lesson', 'master.m3u8')).status, 404);
  assert.equal(signed, 0);
  lesson = { videoKey: 'courses/course/lessons/lesson/video/hls/job/master.m3u8' };
  assert.equal((await lessonMediaResponse('course', 'lesson', '../other.ts')).status, 404);
  assert.equal((await lessonMediaResponse('course', 'lesson', 'stream_00.ts')).status, 307);
  assert.equal((await lessonMediaResponse('course', 'lesson', 'stream_00.ts')).status, 307);
  assert.equal(signed, 2);
});

test('database limiter uses one atomic shared counter and denies exhausted or oversized quotas', async () => {
  let calls = 0;
  const { enforceRateLimit, RateLimitError } = load('src/lib/rate-limit.ts', { './db': { prisma: { $queryRaw: async (strings, ...values) => { calls++; assert.ok(strings.join('').includes('ON CONFLICT')); return []; } } } });
  await assert.rejects(enforceRateLimit('actor'), RateLimitError);
  await assert.rejects(enforceRateLimit('actor', 10, 60, 11), RateLimitError);
  assert.equal(calls, 1);
});

test('PostgreSQL limiter admits exactly the configured number under concurrency', { skip: process.env.CI_DATABASE_TESTS !== 'true' }, async () => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 });
  const key = `ci-test:${require('node:crypto').randomUUID()}`;
  const { enforceRateLimit } = load('src/lib/rate-limit.ts', { './db': { prisma: { $queryRaw: async (strings, ...values) => {
    const sql = strings.reduce((text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''), '');
    return (await pool.query(sql, values)).rows;
  } } } });
  try {
    const attempts = await Promise.allSettled(Array.from({ length: 10 }, () => enforceRateLimit(key, 3)));
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 3);
    assert.equal(attempts.filter(result => result.status === 'rejected').length, 7);
    assert.equal((await pool.query('SELECT count FROM rate_limit WHERE key = $1', [key])).rows[0].count, 3);
    await pool.query('UPDATE rate_limit SET "lastRequest" = 0 WHERE key = $1', [key]);
    await enforceRateLimit(key, 3, 60, 2);
    await assert.rejects(enforceRateLimit(key, 3, 60, 2));
    assert.equal((await pool.query('SELECT count FROM rate_limit WHERE key = $1', [key])).rows[0].count, 2);
  } finally { await pool.query('DELETE FROM rate_limit WHERE key = $1', [key]); await pool.end(); }
});

test('cleanup refuses completion when storage returns object-level deletion errors', async () => {
  class List { constructor(input) { this.input = input; } }
  class Delete { constructor(input) { this.input = input; } }
  const { deleteStoragePrefix } = load('src/lib/storage/run-cleanup.ts', {
    '@/lib/db': {}, './asset-keys': assets,
    '@aws-sdk/client-s3': { ListObjectsV2Command: List, DeleteObjectsCommand: Delete },
    '@/lib/s3-client': { s3Client: { send: async command => command instanceof List ? { Contents: [{ Key: 'users/u/a.png' }] } : { Errors: [{ Key: 'users/u/a.png', Code: 'AccessDenied' }] } } },
  });
  await assert.rejects(deleteStoragePrefix('bucket', 'users/u/'), /incomplete/);
  await assert.rejects(deleteStoragePrefix('bucket', '../'), /Invalid/);
});

test('Better Auth HTTP handler denies ADMIN escalation, protected targets and identity management', async () => {
  const { betterAuth } = await import('better-auth/minimal');
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  const access = await import('better-auth/plugins/access');
  const adminAccess = await import('better-auth/plugins/admin/access');
  const plugins = await import('better-auth/plugins');
  const api = await import('better-auth/api');
  const roles = load('src/lib/access-control.ts', { 'better-auth/plugins/access': access, 'better-auth/plugins/admin/access': adminAccess });
  const data = { user: [], account: [], session: [], verification: [] };
  const prisma = { user: { findUnique: async ({ where }) => data.user.find(user => user.id === where.id) }, session: { findUnique: async () => null } };
  let appConfig;
  const { auth } = load('src/lib/auth.ts', {
    'better-auth/minimal': { betterAuth: config => { appConfig = config; return betterAuth({ ...config, secret: 'synthetic-test-secret-no-production-usage-2026', emailAndPassword: { enabled: true }, logger: { disabled: true }, rateLimit: { enabled: false } }); } },
    'better-auth/api': api, 'better-auth/next-js': { nextCookies: () => ({ id: 'test-next-cookies' }) },
    'better-auth/adapters/prisma': { prismaAdapter: () => memoryAdapter(data) }, './db': { prisma },
    'better-auth/plugins': { ...plugins, emailOTP: () => ({ id: 'test-otp' }), username: () => ({ id: 'test-username' }), multiSession: () => ({ id: 'test-sessions' }) },
    './access-control': roles, './email/resend': {}, './email/otp-email': {},
    '@/features/notifications/services/create-notification': { createNotification: async () => {} },
    '@/lib/storage/account-cleanup': {},
  }, { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' });
  assert.equal(appConfig.emailAndPassword.enabled, false);
  assert.equal(appConfig.session.cookieCache.enabled, false);
  for (const [index, role] of ['ADMIN', 'SUPER_ADMIN', 'USER'].entries()) {
    await auth.api.signUpEmail({ body: { name: role, email: `role${index}@example.test`, password: 'synthetic-password-2026-only' } });
    data.user[index].role = role;
  }
  const response = await auth.api.signInEmail({ body: { email: 'role0@example.test', password: 'synthetic-password-2026-only' }, asResponse: true });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const request = async (path, body) => auth.handler(new Request(`http://localhost:3000/api/auth${path}`, {
    method: 'POST', headers: { cookie, origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));
  assert.equal((await request('/admin/set-role', { userId: data.user[0].id, role: 'SUPER_ADMIN' })).status, 403);
  assert.equal(data.user[0].role, 'ADMIN');
  assert.equal((await request('/admin/ban-user', { userId: data.user[1].id, banReason: 'test' })).status, 403);
  assert.equal((await request('/admin/update-user', { userId: data.user[2].id, data: { email: 'changed@example.test' } })).status, 403);
  assert.equal((await request('/admin/ban-user', { userId: data.user[2].id, banReason: 'test' })).status, 200);
});

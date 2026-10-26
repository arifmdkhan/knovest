const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}, env = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    ...globals, exports, process: { env }, console: { error() {} }, Date, URL,
    require(name) {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
  }, { filename: file });
  return exports;
}

test('public asset URLs escape object keys', () => {
  const { constructUrl } = load('src/lib/construct-url.ts', {}, {
    NEXT_PUBLIC_S3_PUBLIC_URL: 'https://assets.example.com/images',
  });
  assert.equal(constructUrl('posts/a photo#1.png'), 'https://assets.example.com/images/posts/a%20photo%231.png');
  assert.equal(constructUrl('https://example.com/avatar.png'), 'https://example.com/avatar.png');
  assert.equal(constructUrl(null), '');
});

test('public asset URLs handle trailing slashes', () => {
  const { constructUrl } = load('src/lib/construct-url.ts', {}, { NEXT_PUBLIC_S3_PUBLIC_URL: 'https://assets.example.com/' });
  assert.equal(constructUrl('/image.png'), 'https://assets.example.com/image.png');
});

test('Neon public URLs preserve the branch endpoint and bucket path', () => {
  const { constructUrl } = load('src/lib/construct-url.ts', {}, { NEXT_PUBLIC_S3_PUBLIC_URL: 'https://branch.storage.example.com/knovest-public' });
  assert.equal(constructUrl('users/avatar.png'), 'https://branch.storage.example.com/knovest-public/users/avatar.png');
});

test('temporary uploads are scoped to their authenticated owner', () => {
  const { KeyFactory } = load('src/lib/storage/key-factory.ts', {
    uuid: { v4: () => 'unique-id' }, './types': {},
  });
  assert.equal(KeyFactory.getTemporaryKey('PNG', 'owner'), 'uploads/tmp/owner/unique-id.png');
  assert.throws(() => KeyFactory.getTemporaryKey('png', '../other-owner'));
});

test('media deletion rejects another user and a course owned by someone else', async () => {
  const { canDeleteStorageKey } = load('src/lib/storage/ownership.ts', {
    'server-only': {}, '@/lib/db': { prisma: { course: { findFirst: async ({ where }) => {
      assert.equal(where.userId, 'owner'); return null;
    } } } },
  });
  assert.equal(await canDeleteStorageKey('users/other/avatar/p.png', 'owner'), false);
  assert.equal(await canDeleteStorageKey('users/owner/avatar/p.png', 'owner'), true);
  assert.equal(await canDeleteStorageKey('courses/other/thumbnail/p.png', 'owner'), false);
  assert.equal(await canDeleteStorageKey('uploads/tmp/someone/p.png', 'owner'), false);
});

test('scheduled cleanup removes only expired temporary uploads', async () => {
  class List { constructor(input) { this.input = input; } }
  class Delete { constructor(input) { this.input = input; } }
  let deleted;
  const { cleanupTemporaryUploads } = load('src/lib/storage/temporary-cleanup.ts', {
    'server-only': {},
    '@aws-sdk/client-s3': { ListObjectsV2Command: List, DeleteObjectsCommand: Delete },
    '@/lib/s3-client': { s3Client: { send: async command => {
      if (command instanceof List) {
        assert.equal(command.input.Prefix, 'uploads/tmp/');
        return { Contents: [
          { Key: 'uploads/tmp/old.png', LastModified: new Date('2026-10-15T00:00:00Z') },
          { Key: 'uploads/tmp/recent.png', LastModified: new Date('2026-10-17T00:00:00Z') },
        ] };
      }
      deleted = command.input.Delete.Objects.map(item => item.Key);
      return {};
    } } },
  }, { NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES: 'private' });
  assert.equal(await cleanupTemporaryUploads(new Date('2026-10-17T01:00:00Z')), 1);
  assert.equal(deleted.join(','), 'uploads/tmp/old.png');
});

for (const operation of ['reorderLessons', 'reorderChapters', 'createChapter']) {
  test(`${operation} rejects a different creator's course`, async () => {
    const actions = load('src/features/courses/actions/edit-course.ts', {
      '@/features/creator/queries/require-creator': { requireCreator: async () => ({ user: { id: 'creator-a' } }) },
      '@/lib/db': { prisma: { course: { findFirst: async ({ where }) => { assert.equal(where.userId, 'creator-a'); return null; } } } },
      '@/features/courses/schemas': { chapterSchema: { safeParse: () => ({ success: true, data: { courseId: 'other-course' } }) } },
      'next/cache': { revalidatePath() { throw new Error('Must not revalidate'); } },
    });
    const result = operation === 'reorderLessons'
      ? await actions[operation]('chapter', [{ id: 'lesson', position: 1 }], 'other-course')
      : operation === 'reorderChapters'
        ? await actions[operation]('other-course', [{ id: 'chapter', position: 1 }])
        : await actions[operation]({ name: 'Chapter', courseId: 'other-course' });
    assert.equal(result.status, 'error');
  });
}

for (const amount of [100, 0]) {
  test(`enrollment with amount ${amount} ${amount ? 'requires payment verification' : 'activates a free course'}`, async () => {
    let writes = 0;
    const { confirmEnrollment } = load('src/features/courses/actions/confirm-enrollment.ts', {
      '@/features/user/queries/require-user': { requireUser: async () => ({ id: 'buyer' }) },
      '@/lib/db': { prisma: { enrollment: {
        findUnique: async () => ({ id: 'enrollment', userId: 'buyer', amount, status: 'Pending', course: { price: amount, slug: 'course' } }),
        update: async () => { writes++; },
      } } },
      'next/cache': { revalidatePath() {} },
    });
    assert.equal((await confirmEnrollment('enrollment')).status, amount ? 'error' : 'success');
    assert.equal(writes, amount ? 0 : 1);
  });
}

test('stream access cannot be purchased without a payment provider', async () => {
  const { purchaseStreamAccess } = load('src/features/media/actions/stream-access.action.ts', {
    '@/lib/get-sessions': { getServerSession: async () => ({ user: { id: 'buyer' } }) },
    '@/lib/db': { prisma: { streamAccess: { findUnique: async () => null } } },
    'next/cache': {},
  });
  assert.equal((await purchaseStreamAccess('stream')).status, 'error');
});

test('paid subscriptions cannot be activated by a client confirmation', async () => {
  const { confirmSubscription } = load('src/features/subscriptions/actions/confirm-subscription.action.ts', {
    '@/features/user/queries/require-user': { requireUser: async () => ({ id: 'buyer' }) },
    '@/lib/db': { prisma: { subscription: { findUnique: async () => ({ status: 'PENDING', subscribedTo: { isSubscriptionEnabled: true, subscriptionPrice: 100 } }) } } },
  });
  assert.equal((await confirmSubscription('creator')).status, 'error');
});

test('notification filters preserve recipient ownership and paginate raw rows without overlap', async () => {
  const rows = Array.from({ length: 4 }, (_, index) => ({ id: `n${index}`, type: 'LIKE', entityId: 'post', createdAt: new Date('2026-10-17'), isRead: false, actor: { id: `a${index}`, name: 'Actor' } }));
  let received;
  const { getNotifications } = load('src/features/notifications/actions/notifications.action.ts', {
    '@/lib/get-sessions': { getServerSession: async () => ({ user: { id: 'recipient' } }) },
    '@/lib/db': { prisma: { notification: { findMany: async args => { received = args; return rows; }, count: async () => 4 } } },
    'next/cache': { revalidatePath() {} },
  });
  const response = await getNotifications(2, 3, 'mentions');
  assert.equal(received.where.recipientId, 'recipient');
  assert.equal(received.where.type, 'MENTION');
  assert.equal(received.take, 4);
  assert.equal(received.skip, 3);
  assert.equal(response.data.data.length, 1);
  assert.equal(response.data.data[0].count, 3);
  assert.equal(response.data.hasMore, true);
});

test('article saves reject unpublished articles and scope removal to the authenticated user', async () => {
  let deleted;
  let upserted = false;
  const { setArticleSaved } = load('src/features/articles/actions/saved-articles.action.ts', {
    zod: require('zod'),
    '@/features/user/queries/require-user': { requireUser: async () => ({ id: 'reader' }) },
    '@/lib/safe-action': { safeAction: (_, handler) => input => handler(input, { user: { id: 'reader' } }) },
    '@/lib/db': { prisma: {
      article: { findFirst: async ({ where }) => { assert.equal(where.status, 'PUBLISHED'); assert.equal(where.deletedAt, null); return null; } },
      savedArticle: { upsert: async () => { upserted = true; }, deleteMany: async args => { deleted = args; } },
    } },
  });
  assert.equal((await setArticleSaved({ articleId: 'article', saved: true })).status, 'error');
  assert.equal(upserted, false);
  assert.equal((await setArticleSaved({ articleId: 'article', saved: false })).status, 'success');
  assert.equal(deleted.where.userId, 'reader');
  assert.equal(deleted.where.articleId, 'article');
});

test('course catalogue filters search and level while excluding unpublished courses', async () => {
  let received;
  const { getAllCourses } = load('src/features/courses/queries/get-all-courses.ts', {
    'server-only': {}, '@/lib/db': { prisma: { course: { findMany: async args => { received = args; return []; } } } },
  });
  await getAllCourses(undefined, 'Equities', 'reader', { query: '  investing  ', level: 'Beginner', sort: 'price' });
  assert.equal(received.where.status, 'Published');
  assert.equal(received.where.deletedAt, null);
  assert.equal(received.where.title.contains, 'investing');
  assert.equal(received.where.title.mode, 'insensitive');
  assert.equal(received.where.level, 'Beginner');
  assert.equal(received.where.category, 'Equities');
  assert.equal(received.orderBy[0].price, 'asc');
});

test('new post attachments remain owned before the post exists', async () => {
  const { UploadIntent } = load('src/lib/storage/types.ts');
  const { KeyFactory } = load('src/lib/storage/key-factory.ts', { './types': { UploadIntent }, uuid: { v4: () => 'asset' } });
  const key = KeyFactory.getPayload(UploadIntent.POST_MEDIA, { userId: 'owner', postId: 'draft' }, 'png');
  assert.equal(key, 'users/owner/posts/draft/images/asset.png');
  const { canDeleteStorageKey } = load('src/lib/storage/ownership.ts', { 'server-only': {}, '@/lib/db': { prisma: {} } });
  assert.equal(await canDeleteStorageKey(key, 'owner'), true);
  assert.equal(await canDeleteStorageKey(key, 'someone-else'), false);
  assert.throws(() => KeyFactory.getPayload(UploadIntent.POST_MEDIA, { postId: 'draft' }, 'png'));
});

test('post creation accepts a real attachment URL and rejects an empty preview URL', async () => {
  const { createPostSchema } = load('src/features/posts/schemas.ts', { zod: require('zod') });
  let created;
  const paths = [];
  const author = { id: 'owner', username: 'owner' };
  const { createPost } = load('src/features/posts/actions/create-post.ts', {
    '@/lib/get-sessions': { getServerSession: async () => ({ user: author }) },
    '@/lib/db': { prisma: { post: { create: async ({ data }) => { created = data; return { ...data, author, media: data.media.create, _count: {} }; } } } },
    'next/cache': { revalidatePath: path => paths.push(path) },
    '@/features/posts/schemas': { createPostSchema },
    '@/lib/rate-limit': { enforceRateLimit: async () => {} },
    '@/lib/storage/asset-keys': load('src/lib/storage/asset-keys.ts'),
    '@/features/posts/access': { postMediaUrl: (postId, mediaId) => `/api/posts/${postId}/media/${mediaId}` },
  });
  const data = { id: 'post', visibility: 'PUBLIC', media: [{ url: '', type: 'IMAGE' }] };
  assert.equal((await createPost(data)).status, 'error');
  assert.equal(created, undefined);
  data.media[0].url = 'https://branch.example.com/knovest-public/users/owner/posts/post/images/image.png';
  data.media[0].key = 'users/owner/posts/post/images/image.png';
  assert.equal((await createPost(data)).status, 'success');
  assert.equal(created.media.create[0].url, data.media[0].key);
  assert.ok(paths.includes('/home'));
  assert.ok(paths.includes('/profile/owner'));
});

test('Neon endpoint and public bucket provide the browser asset URL when the override is empty', () => {
  const { default: config } = load('next.config.ts', {}, { AWS_ENDPOINT_URL_S3: 'https://branch.example.com/', NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: 'knovest-public' });
  assert.equal(config.env.NEXT_PUBLIC_S3_PUBLIC_URL, 'https://branch.example.com/knovest-public');
  assert.equal(config.images.remotePatterns[0].href, 'https://branch.example.com/knovest-public/**');
});

test('public uploads fail before writing when no readable asset URL can be constructed', async () => {
  const types = load('src/lib/storage/types.ts');
  const { StorageService } = load('src/lib/storage/storage-service.ts', {
    '@aws-sdk/client-s3': {}, '@aws-sdk/s3-request-presigner': {}, '@/lib/s3-client': {}, './types': types, './key-factory': {}, './file-signature': {}, '@/lib/construct-url': { constructUrl: () => '' },
  });
  await assert.rejects(StorageService.getPresignedUploadUrl(types.UploadIntent.USER_AVATAR, { userId: 'owner' }, 'image/png', 100), /Public storage URL/);
});

test('upload previews never pass an empty src to the image component', () => {
  const React = require('react');
  const jsx = require('react/jsx-runtime');
  const { renderToStaticMarkup } = require('react-dom/server');
  const icon = () => React.createElement('span');
  const common = {
    react: React, 'react/jsx-runtime': jsx,
    '@/lib/utils': { cn: (...items) => items.filter(item => typeof item === 'string').join(' ') },
    'next/image': { default: props => { assert.ok(props.src, 'An empty image src was rendered'); return React.createElement('img', { src: props.src, alt: props.alt }); } },
    'lucide-react': { ImageOff: icon, X: icon, UploadCloud: icon, Loader2: icon, FileText: icon, ImagePlus: icon, Video: icon },
  };
  const safeImage = load('src/components/ui/safe-image.tsx', common);
  const div = ({ children, ...props }) => React.createElement('div', props, children);
  const { MediaUploader } = load('src/components/handle-media/media-uploader.tsx', {
    ...common,
    'react-dropzone': { useDropzone: () => ({ getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false, open() {}, inputRef: { current: null } }) },
    sonner: { toast: {} }, uuid: {}, '@/components/ui/button': { Button: div }, '@/components/ui/card': { Card: div, CardContent: div },
    '@/lib/image-compression': {}, '@/lib/construct-url': {},
    '@/hooks/use-media-upload': { useMediaUpload: () => ({ progress: 0 }) },
    '@/lib/storage/types': load('src/lib/storage/types.ts'),
    '@/hooks/use-chunked-upload': { useChunkedUpload: () => ({ progress: 0 }) },
    '@/components/ui/safe-image': safeImage,
  });
  const html = renderToStaticMarkup(React.createElement(MediaUploader, { onChange() {}, existingMedia: [{ url: '', type: 'IMAGE' }] }));
  assert.ok(html.includes('role="img"'));
  assert.equal(html.includes('src=""'), false);
});

test('post upload confirmation returns a private preview with its canonical storage key', async () => {
  const types = load('src/lib/storage/types.ts');
  const env = { NEXT_PUBLIC_S3_PUBLIC_URL: 'https://branch.example.com/knovest-public' };
  const urls = load('src/lib/construct-url.ts', {}, env);
  const key = 'users/owner/posts/draft/images/photo.webp';
  const { confirmUploadAction } = load('src/features/media/actions/upload.action.ts', {
    zod: require('zod'), '@/lib/storage/types': types,
    '@/lib/storage/storage-service': { StorageService: { getPresignedDownloadUrl: async () => 'https://storage.example.com/signed-private-preview', confirmUpload: async (_, intent, params) => { assert.equal(params.userId, 'owner'); assert.equal(intent, types.UploadIntent.POST_MEDIA); return key; } } },
    '@/lib/rate-limit': { enforceUploadQuota: async () => {} },
    '@/lib/db': { prisma: { post: { findUnique: async () => null } } },
    'next/cache': { revalidatePath() {} },
    '@/lib/safe-action': { safeAction: (_, handler) => input => handler(input, { user: { id: 'owner' } }) },
    '@/lib/construct-url': urls,
  }, env);
  const result = await confirmUploadAction({ tempKey: 'uploads/tmp/owner/file.webp', intent: types.UploadIntent.POST_MEDIA, params: { postId: 'draft', userId: 'someone-else' } });
  assert.equal(result.status, 'success');
  assert.equal(result.data.key, key);
  assert.equal(types.UPLOAD_CONFIGS.POST_MEDIA.bucket, types.BucketType.PRIVATE);
  assert.equal(result.data.url, 'https://storage.example.com/signed-private-preview');
});

test('browser upload flow forwards the confirmed image URL instead of rebuilding an empty URL', async () => {
  const url = 'https://branch.example.com/knovest-public/users/owner/posts/draft/images/photo.webp';
  let callback;
  class XHR {
    status = 204;
    upload = {};
    open(method, target) { assert.equal(method, 'PUT'); assert.equal(target, 'https://storage.example.com/signed-upload'); }
    setRequestHeader(name, value) { assert.equal(name, 'Content-Type'); assert.equal(value, 'image/webp'); }
    send() { this.onload(); }
  }
  const { useMediaUpload } = load('src/hooks/use-media-upload.ts', {
    react: { useState: () => [false, () => {}] }, sonner: { toast: { error() {} } }, '@/lib/storage/types': {},
    '@/features/media/actions/upload.action': {
      getPresignedUploadUrlAction: async () => ({ status: 'success', data: { url: 'https://storage.example.com/signed-upload', tempKey: 'temp' } }),
      confirmUploadAction: async () => ({ status: 'success', data: { key: 'key', url } }),
    },
  }, {}, { XMLHttpRequest: XHR });
  const { uploadFile } = useMediaUpload({ intent: 'POST_MEDIA', onUploadComplete: (key, imageUrl) => { callback = { key, imageUrl }; } });
  const result = await uploadFile({ type: 'image/webp', size: 32 });
  assert.equal(result.url, url);
  assert.equal(result.key, 'key');
  assert.equal(callback.imageUrl, url);
});


test('email sender requires a full address instead of a bare domain', () => {
  const mocks = { resend: { Resend: class {} }, zod: require('zod') };
  for (const sender of ['', 'Knovest <knovest.example.com>', 'Knovest <bad>']) {
    const { getEmailSender } = load('src/lib/email/resend.ts', mocks, { EMAIL_FROM: sender });
    assert.throws(getEmailSender, /full email address/);
  }
  for (const sender of ['Knovest <noreply@knovest.example.com>', 'noreply@knovest.example.com']) {
    const { getEmailSender } = load('src/lib/email/resend.ts', mocks, { EMAIL_FROM: sender });
    assert.equal(getEmailSender(), sender);
  }
});

test('email transport rejects a missing API key before sending', () => {
  const { getResend } = load('src/lib/email/resend.ts', { resend: { Resend: class {} }, zod: require('zod') });
  assert.throws(getResend, /RESEND_API_KEY/);
});

async function otpTestAuth(send, sender = 'Knovest <noreply@knovest.example.com>') {
  const { betterAuth } = await import('better-auth/minimal');
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  const { emailOTP } = await import('better-auth/plugins');
  const api = await import('better-auth/api');
  const mail = load('src/lib/email/resend.ts', {
    resend: { Resend: class { emails = { send }; } }, zod: require('zod'),
  }, { RESEND_API_KEY: 're_test_not_a_live_key', EMAIL_FROM: sender });
  return load('src/lib/auth.ts', {
    'better-auth/minimal': { betterAuth: config => betterAuth({ ...config, secret: 'knovest-synthetic-test-secret-2026-only', logger: { disabled: true }, rateLimit: { enabled: false } }) },
    'better-auth/api': api,
    'better-auth/next-js': { nextCookies: () => ({ id: 'next-cookies' }) },
    'better-auth/adapters/prisma': { prismaAdapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [] }) },
    './db': { prisma: {} },
    'better-auth/plugins': { emailOTP, admin: () => ({ id: 'admin-test' }), username: () => ({ id: 'username-test' }), multiSession: () => ({ id: 'sessions-test' }) },
    './email/resend': mail, './access-control': {}, './email/otp-email': { default: () => null },
    '@/features/notifications/services/create-notification': {},
    '@/lib/storage/account-cleanup': {},
  }, { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' }).auth;
}

function otpTestRequest() {
  return new Request('http://localhost:3000/api/auth/email-otp/send-verification-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify({ email: 'synthetic@example.test', type: 'sign-in' }),
  });
}

test('hashed OTP configuration completes sign-in and exhausts incorrect attempts', async () => {
  let deliveredCode;
  const auth = await otpTestAuth(async payload => {
    deliveredCode = payload.text.match(/code is (\d{6})/)[1];
    return { data: { id: 'accepted-test-email' }, error: null };
  });
  const signIn = otp => auth.handler(new Request('http://localhost:3000/api/auth/sign-in/email-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify({ email: 'synthetic@example.test', otp }),
  }));
  assert.equal((await auth.handler(otpTestRequest())).status, 200);
  assert.equal((await signIn(deliveredCode)).status, 200);
  assert.equal((await auth.handler(otpTestRequest())).status, 200);
  const wrong = deliveredCode === '000000' ? '999999' : '000000';
  for (let attempt = 0; attempt < 3; attempt++) assert.ok((await signIn(wrong)).status >= 400);
  assert.ok((await signIn(deliveredCode)).status >= 400);
});

test('OTP endpoint returns a failure when Resend rejects delivery', async () => {
  const auth = await otpTestAuth(async () => ({ data: null, error: { name: 'validation_error', statusCode: 422 } }));
  const response = await auth.handler(otpTestRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'EMAIL_DELIVERY_FAILED');
});

test('OTP endpoint rejects invalid sender configuration without calling Resend', async () => {
  let called = false;
  const auth = await otpTestAuth(async () => { called = true; }, 'Knovest <knovest.example.com>');
  const response = await auth.handler(otpTestRequest());
  assert.equal(response.status, 503);
  assert.equal(called, false);
});

test('OTP endpoint succeeds only after the mail provider accepts the message', async () => {
  let sent = false;
  const auth = await otpTestAuth(async payload => {
    assert.equal(payload.from, 'Knovest <noreply@knovest.example.com>');
    assert.ok(payload.text.includes('expires in 10 minutes'));
    sent = true;
    return { data: { id: 'synthetic-email-id' }, error: null };
  });
  const response = await auth.handler(otpTestRequest());
  assert.equal(response.status, 200);
  assert.equal(sent, true);
  assert.equal((await response.json()).success, true);
});

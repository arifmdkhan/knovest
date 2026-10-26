# Knovest

Financial learning and community app built with Next.js, React, Prisma, and Better Auth. Uses Neon PostgreSQL and Object Storage, Stream Chat/Video, Resend, and Google OAuth. Arcjet is not used.

Production status and remaining gates: [remediation status](docs/REMEDIATION-STATUS-2026-10-18.md), [release runbook](docs/RELEASE-RUNBOOK.md), [audit](docs/AUDIT-2026-10-17.md), and [budget model](docs/BUDGET-2026-10-17.md). Payments remain disabled for this release.

## Local setup

Use pnpm 12.5.1. pnpm install downloads the project's pinned Node 24.19.0 runtime; project scripts use it automatically. No global Node upgrade is needed.

~~~powershell
pnpm install
Copy-Item .env.example .env.local
# Fill in your service credentials in .env.local, then:
pnpm db:generate
pnpm db:migrate
pnpm dev
~~~

Open http://localhost:3000. Do not overwrite an existing .env.local. Prisma reads .env.local first, then .env.

## What to put in .env.local

| Variables | Value/source |
| --- | --- |
| DATABASE_URL | Neon Connect panel: pooled Postgres connection string, including TLS settings |
| DIRECT_URL | Optional direct Neon connection string for migrations; leave blank otherwise |
| NEXT_PUBLIC_APP_URL | http://localhost:3000 locally; your HTTPS app origin in production |
| BETTER_AUTH_SECRET | Random secret generated with the command in .env.example |
| GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | Google Cloud OAuth web application credentials |
| RESEND_API_KEY | Resend API key |
| EMAIL_FROM | Knovest <you@your-verified-domain>; use your actual verified sender |
| NEXT_PUBLIC_STREAM_API_KEY, STREAM_API_SECRET | API key and secret from the same Stream app |
| AWS_REGION, AWS_ENDPOINT_URL_S3 | Exact region and storage endpoint returned by Neon Object Storage |
| AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY | Neon storage credential token_id and s3_secret_access_key; not your Neon account API key |
| NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES | Public-read bucket name; example: knovest-public |
| NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES | Private bucket name; example: knovest-private |
| NEXT_PUBLIC_S3_PUBLIC_URL | Optional custom public asset URL; defaults to AWS_ENDPOINT_URL_S3 plus your public bucket |
| CRON_SECRET | A separate generated random secret for scheduled cleanup/transcoding |
| NEXT_PUBLIC_SUPPORT_EMAIL | Real support email; required before public launch |
| STREAM_PERMISSIONS_VERIFIED | Keep false until server/provider authorization repair and negative tests pass |
| VIDEO_PROCESSING_ENABLED | Keep false until persistent isolated worker qualification passes |
| UPLOAD_DAILY_MIB_LIMIT | Global daily upload reservation cap; default 10240 MiB, zero blocks uploads |

## Services

- **Neon PostgreSQL:** set DATABASE_URL to the pooled Postgres connection URL with TLS enabled. Optionally set DIRECT_URL to a direct connection for migrations. The 14 migrations include verification, saved content, notifications, lesson resources/progress, video processing, cleanup jobs, shared rate limiting and processing leases/indexes. Legacy verification flags are preserved. The retired CREATOR role becomes USER; creator access now requires expert verification or an admin role.
- **Authentication:** generate a random BETTER_AUTH_SECRET of at least 32 characters. Set NEXT_PUBLIC_APP_URL to your app's origin. Google OAuth needs the callback <app origin>/api/auth/callback/google and an authorized JavaScript origin matching the app. Configure local and production URLs separately.
- **Resend:** set RESEND_API_KEY and EMAIL_FROM on your verified domain. EMAIL_FROM must be a complete address, for example Knovest <noreply@mail.your-domain.com>, on a domain verified in Resend. A bare domain inside angle brackets is invalid. OTPs expire after ten minutes; email delivery errors are returned to the authentication flow.
- **Stream:** set NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET from the same Stream app. Production connections are gated until the authorization work in the release runbook passes; credentials alone do not satisfy that gate.
- **Contact:** set NEXT_PUBLIC_SUPPORT_EMAIL to a real support address before publishing.

## Neon Object Storage

Use a project in a supported region. Singapore (aws-ap-southeast-1) is supported as of October 17, 2026. Create knovest-public with public_read access for public images and knovest-private with private access for all post media, lesson videos, resources, and verification documents. Post media is delivered through an authorized application route; keep its source objects private.

Copy the exact endpoint, region, access key, and secret from Neon into the AWS_* variables. Path-style addressing is configured in code. The public URL is derived from AWS_ENDPOINT_URL_S3 and NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES. Set NEXT_PUBLIC_S3_PUBLIC_URL only to override it, for example with a CDN. Public URLs include the branch endpoint and bucket path. Keep private buckets private; access uses signed URLs and server authorization. Restart Next.js after changing public environment variables.

Configure CORS on both buckets for your actual app origins:

~~~json
{
  "CORSRules": [{
    "AllowedOrigins": ["http://localhost:3000", "https://YOUR_APP_DOMAIN"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }]
}
~~~

ETag must be exposed for multipart video uploads. Neon does not currently enforce lifecycle expiration. After reviewing the release runbook, schedule /api/cron/cleanup with Authorization: Bearer <CRON_SECRET> to process leased deletion jobs, expired temporary uploads and a bounded stale multipart scan. Complete inventory/retention reconciliation is still required. Schedule /api/cron/transcode only after qualifying the isolated persistent worker and enabling its production flag. Both endpoints reject requests if the secret is missing. Transcoding requires FFmpeg, sufficient CPU/disk, isolation and execution time.

Sources: [Neon setup](https://neon.com/docs/storage/get-started), [S3 compatibility and limitations](https://neon.com/docs/storage/s3-compatibility).

## Validation and production

~~~powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm start
~~~

TypeScript remains strict. Lint reports existing any types, effect refactors, and unused code as warnings; hook correctness and other lint errors remain blocking. Prisma stays on stable version 7 rather than the Prisma 8 release candidate. Major upgrades with unrelated API changes are deferred.

Paid course enrollment, subscriptions, and stream purchases are unavailable until a real payment provider verifies transactions server-side. Client confirmations cannot grant paid entitlements. Free enrollment/subscription flows remain supported. Contact opens your email app using the configured support address. Landing-page photography and product imagery are AI-generated illustrations. They do not depict named educators or customer endorsements. Optimized WebP assets are stored in public/images/landing; only the hero image is preloaded.


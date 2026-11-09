# Knovest release runbook

Deployment requirements for this codebase. This document does not authorize deployment, provider changes, token revocation or destructive maintenance.

## Supported release configuration

Payments are disabled for this release. Keep `STREAM_PERMISSIONS_VERIFIED=false` and `VIDEO_PROCESSING_ENABLED=false` until the gates below pass. Missing flags fail closed in production. They do not disable the local development SDK by default.

Use Node 24.19.0 and pnpm 12.5.1. Install from the lockfile. Keep production secrets in the hosting secret store; do not copy them into tracked files, browser variables, logs or reports. `NEXT_PUBLIC_*` values are public and may be compiled into the browser bundle.

Set the deployed HTTPS origin, Google callback/origin, verified Resend sender, real support email, database TLS connection, distinct public/private storage buckets, storage CORS and a strong separate cron secret. The generated local cron secret is not a deployed scheduler configuration. Set `UPLOAD_DAILY_MIB_LIMIT` to the approved conservative reservation budget. This control does not cap provider invoices or egress.

## Build and schema gate

Run from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm db:generate
pnpm test
pnpm typecheck
pnpm lint --max-warnings 174
pnpm audit --prod --audit-level high
pnpm build
```

The GitHub workflow adds a fresh PostgreSQL 17 service, migration deployment/drift checks, concurrency regression, and production HTTP smoke. Verify the workflow actually runs and passes on the target branch; its presence is not evidence of a successful remote run.

Before migrations, identify the target database and record a recoverable backup/restore point. Review SQL and lock/size impact. For an approved environment:

```powershell
pnpm db:migrate
pnpm exec prisma migrate status
pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Do not reset an existing database. Prefer a forward fix over deleting schema during rollback. A code rollback may retain the additive tables/columns; it must retain the private-media policy and routes.

## Private post media migration

The script defaults to a dry run, reports counts only, rejects unrelated key namespaces, and requires `--apply` for changes:

```powershell
pnpm exec node scripts/migrate-post-media.mjs
# Only against an approved target, with an object inventory and DB backup:
pnpm exec node scripts/migrate-post-media.mjs --apply
pnpm exec node scripts/migrate-post-media.mjs
```

It copies/verifies, conditionally commits the media row, then deletes the public source. On error, investigate before retrying. An unsupported count is a blocker requiring manual review. Copies cached or downloaded before migration are not revocable through this script. Apply private-aware application code alongside the migration; older code can lose image delivery and must not be repaired by republishing private objects.

## Stream authorization gate

**Do not enable the production flag until provider authorization has passed the checks below.** Required work includes:

1. Move call creation, metadata/ACL updates, and join authorization behind server-side session and entitlement checks. Derive creator identity from the session. Reject paid creation while payments are off. Bound group/user lists and scheduling input.
2. Make provider roles deny ordinary/anonymous outsider joins, unauthorized membership changes, and client updates to trusted verification metadata. Authorize the specific call through scoped tokens/capabilities rather than relying on hidden UI. Validate messaging/subscription group membership and cancellation/revocation at the provider too.
3. Invalidate previously issued long-lived tokens using supported Stream mechanisms. Verify both Chat and Video behavior and connected-user revocation. Do not assume a new four-hour expiration retroactively affects old tokens.
4. Test owner, invited member, active subscriber, cancelled subscriber, outsider, anonymous, banned, deleted, expired/revoked token, same ID across call types, and direct SDK/API access. Confirm owners cannot turn client metadata into trusted payment/verification state.
5. Verify reconnect, multi-tab/sign-out cleanup, failed synchronization and retry, concurrent room costs, account tier and alert delivery. Only then approve and enable connections.

References: [Stream authentication](https://getstream.io/docs/platform/authentication/), [server-side Video API](https://getstream.io/video/docs/api/), [permissions](https://getstream.io/video/docs/javascript/guides/permissions-and-moderation/). Membership can expand capabilities; it does not automatically deny nonmembers.

## Transcode and cleanup gate

The video API route is not a portable serverless worker. Before setting `VIDEO_PROCESSING_ENABLED=true`, qualify a persistent isolated Node/FFmpeg worker with read-only application secrets minimized to what it needs, bounded CPU/memory/disk, a suitable filesystem, execution time, queue backpressure and operational ownership. The current FFmpeg timeout is three minutes; large/long uploads can exceed it. Measure representative video durations, silent/audio inputs, portrait/landscape, malformed containers, failure/lease recovery, concurrent invocations and partial upload cleanup on the actual Linux host.

Schedule approved cron invocations with `Authorization: Bearer <CRON_SECRET>` over HTTPS. Do not put secrets in query strings. Cleanup processes both public/private entity prefixes and old temporary objects; it also attempts a bounded stale multipart scan. Confirm actual provider support for list/abort/delete/CORS and a full abandoned-object inventory process. Monitor failed/exhausted jobs and manual requeue procedures. Never run a bulk deletion job as a casual health check.

Complete Stream account/message removal, subscription membership outbox/reconciliation and documented sensitive-data/backup retention before claiming deletion is comprehensive. Test restore into an isolated environment, including private object references and queued jobs.

## Health, security and browser gate

- `/api/health` is public liveness. `/api/health?ready=1` requires the cron bearer token and runs a database probe. Expect 200 when the database is ready, 503 on failure and 401 without the token. It does not certify mail, Stream, storage or worker readiness.
- Public/auth responses must include nosniff/frame/referrer/permissions headers. The script CSP remains report-only. Collect and review its inline/eval reports, then implement nonce/hash-compatible script restrictions with Next/Google/Stream/player testing. Do not enforce the current report-only script policy verbatim; it would break framework scripts.
- Real sign-in checks: accepted and rejected OTP delivery, three bad attempts, resend/exhaustion, Google consent/callback, logout/revocation, multiple sessions, ban/role changes, missing/malformed registration draft, and profile completion retry. Add privileged MFA or equivalent verified access protection.
- Cross-account checks: private/follower/subscriber/deleted posts and media; saved/reposted originals; comments/replies; wrong course/lesson/resource; deleted enrollments; reviewer documents; browser cache/sign-out behavior. Use synthetic staging accounts and avoid real user impersonation.
- Test full-length playback beyond URL lifetimes, delayed seeking, expired authorization, network recovery and native/HLS.js playback. Synthetic half-second FFmpeg clips prove format handling only.
- Verify mobile/desktop light/dark layouts, keyboard-only navigation, screen reader announcements, error focus, form validation, content creation and disabled paid controls. Automated accessibility scores do not cover all these flows.

## Budget and rollback decision

Approve provider tiers, credits, alerts and spending limits using actual account and usage evidence. Do not assume free plans or future revenue cover operating costs. Test mobile performance on the final deployment and representative user geography, and record results against the agreed performance budget.

Record the release owner, enabled feature set, remaining accepted risks, restore point, deployment identifier and rollback procedure. No automatic payment activation or live-service expansion is authorized by a passing build.

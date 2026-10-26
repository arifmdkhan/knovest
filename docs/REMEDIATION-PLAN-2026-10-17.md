# Knovest remediation and release plan

Companion: [audit report](AUDIT-2026-10-17.md) and [budget model](BUDGET-2026-10-17.md). This is the October 17 baseline plan. Implementation and approved connected-database/storage work are now recorded in the [October 18 remediation status](REMEDIATION-STATUS-2026-10-18.md); use that document for current completion and remaining gates. No application deployment has been performed.

Effort estimates are rough engineering days for someone familiar with this codebase, excluding account approvals, legal review and provider delays. They are not fixed commitments. Add a staging environment before integration tests that mutate provider/database state.

## Phase 0 — Establish the release boundary

Owner: product owner + engineer. Estimate: 0.5-1 day.

- Select free beta scope: community/text courses versus chat, restricted rooms, uploads and paid features. Disabled features must be disabled at server/provider boundaries too.
- Keep paid entitlements fail-closed. Decide the actual deployment host and whether video processing will use a worker or managed service.
- Confirm the provider accounts, regions, staging resources, support contact and budget ceiling. Do not send credentials in chat.
- Record the existing migrations, backup/restore and rollback strategy. Do not reset a production database to make migration status pass.

**Exit:** written feature scope, staging destination and cost envelope; reachable staging DB with verified migration status. F19/F20/F30 scope established.

## Phase 1 — Close authorization and disclosure defects

Owner: backend/auth engineer. Estimate: 4-7 days, with integrations and asset migration additional.

| Order | Findings | Concrete implementation | Required acceptance evidence |
| --- | --- | --- | --- |
| 1 | F01 | Separate ADMIN/SUPER_ADMIN permissions; enforce actor/target policies across exposed Better Auth endpoints; consistent uppercase roles; remove DB fallback on auth failure | Direct plugin HTTP tests deny ADMIN self-promotion, unauthorized role/password/email/impersonation/deletion operations; permitted SUPER_ADMIN actions succeed |
| 2 | F10 | Shared authoritative active-user/admin/creator guards for sensitive operations; explicit ban policy | Existing session loses privilege immediately on demotion/revoke/ban; expired bans follow the chosen semantics |
| 3 | F02/F03/F09 | Internal server-only Stream/notification services; thin validated public actions; derive actor, badge fields and membership from canonical DB facts | Anonymous, unrelated user and spoofed-ID calls cannot reach provider mutations; cancellation/self-removal and legitimate notifications still work |
| 4 | F04/F07 | Shared lesson/course/asset ownership authorization; server-created asset IDs; canonical prefixes; constrained playlists | Enrolled-in-A cannot request B's HLS; creator cannot attach/sign another course or identity-document key; legitimate playback/download succeeds |
| 5 | F05/F08 | Shared post visibility policy; public profile DTO whitelist; approved verification publication policy | USER/anonymous/author/follower/subscriber matrix across detail, feed, repost, comments, likes/saves; no email/ban/internal fields in public responses |
| 6 | F06 | Private restricted-post assets; visibility transitions; migration/deletion of existing public copies | Leaked old public URL fails after migration; membership revocation denies new grants; public posts still work |

Use one focused change per boundary so reviewers can assess the policy and negative tests. Do not blanket-restrict all helpers and break legitimate subscription synchronization. Keep internal service functions out of `"use server"` action export modules.

**Exit:** no open F01-F10 failure for enabled features; the six mocked boundary reproductions and direct in-memory admin escalation converted into denial regression tests; action manifest and serialized DTOs reviewed again. Investigate whether earlier deployed data/provider state requires reconciliation. Local fixes alone cannot recall already-issued public URLs or long-lived tokens.

## Phase 2 — Prove identity and provider access

Owner: integration engineer. Estimate: 2-4 days, provider access required.

- F11: export/version Stream channel/call capabilities; validate room creation, restricted join, remove/revoke and host controls by calling the SDK directly as an unentitled user. Verify exact type/ID deletion binding.
- F13/F22: choose supported login methods; hash OTP storage; shared rate limiter; privileged MFA/step-up; token expiry and renewal; one SDK owner per identity; disconnect/leave/cache clear on logout and account switch.
- F14: common response headers; CSP report-only observations against real OAuth, Stream and storage destinations, then enforce a tested policy.
- F19: live synthetic OTP success/failure/resend, expired/reused code, Google linking/callback, session refresh, multi-session, revoke, demotion and ban tests. Verify DNS/sender setup through real provider evidence.

**Exit:** recorded staging integration results, no client-only access controls, no stale identity after account switch, no session/OTP secrets in logs. Do not infer provider ACL correctness from the visual room page.

## Phase 3 — Make uploads, video and deletion reliable

Owner: backend/infrastructure engineer. Estimate: 4-7 days for self-managed processing; re-estimate if using a managed media provider.

- F12: persisted upload sessions with owner/intent/size/type/quota; enforce actual object metadata; constrain parts/batches; abort stale multipart work; throttling and quota UI.
- F15: separate bounded job execution from request lifecycle; writable OS temp space; atomic claims/leases; unique attempt directories; retry/backoff/timeout; input probing; silent/portrait/low-resolution handling; raw retention.
- F16: transactional cleanup enqueueing, canonical asset prefixes, per-object error handling, retry/recovery, inventory reconciliation and user removal across storage/Stream/DB.
- F17: lesson exceeding 30 minutes, delayed seek beyond five minutes, network interruption/recovery, Safari/iOS and CORS tests; clean up native media listeners.

Failure scenarios required: duplicate cron, crash after upload/before DB commit, worker kill during FFmpeg, duplicate completion, partial S3 deletion failure, expired presign, failed Stream membership sync and database unavailability. Validate result accuracy: a rejected per-object deletion must not mark a job completed.

**Exit:** a synthetic upload moves through queued/processing/ready, survives a worker restart, plays fully and deletes all generated/raw objects according to retention. Production Linux artifact and FFmpeg execution tested on the chosen host. If these gates are deferred, disable the corresponding media capability in beta.

## Phase 4 — Performance, accessibility and onboarding

Owner: frontend engineer. Estimate: 2-4 days, then authenticated profiling after staging access works.

1. F23: inspect root execution-heavy chunk, CSS/font/provider scope and hero priority. Capture three before/after Lighthouse samples without simultaneous builds. Target mobile public/auth score >=90, no CLS regression and <=200 KiB initial public-route script transfer as a working target.
2. F24: fix color-only footer link; page headings, form errors, target spacing, keyboard/focus, OTP paste/autofill, zoom, light/dark themes, dialogs and media controls. Test screen-reader navigation manually. Accessible drag reordering needs a keyboard alternative.
3. F25: canonical onboarding state bound to verified account; retry failed profile save, malformed/missing draft storage, missing verification email and username collisions. Align username policy across UI/auth/server.
4. F27: noindex private/auth/payment/admin routes, real public canonical/OG/sitemap policy. Verify the deployed origin rather than a local build default.

**Exit:** reproducible browser measurements and screenshot review at 390px/desktop, keyboard flows pass, onboarding failures recover without false success, search policy matches product scope. Real-user INP still requires field monitoring.

## Phase 5 — Operational and paid release gates

Owner: engineer + product/operator. Estimate: 2-4 days for operational gates; **payment integration is a separate scoped project**.

- F18/F19: frozen-lockfile CI, appropriate Node runtime, staging migration/build, error boundaries, uptime/readiness, sanitized exception telemetry, job/OTP/DB/Stream alerts, backup restoration and rollback rehearsal.
- F21: bounded lists and DTOs; staging data/performance test; query-plan-backed indexes; deterministic pagination; connection cap per app replica.
- F26: truthful privacy/support/processor/retention disclosures, sensitive-verification access and expiry policy, operating entity/contact details, appropriate legal assessment of the actual offering.
- F28/F29: compatible patch updates, deprecated email package replacement, dev advisory tracking, warning budget and typed boundary contracts. Do not combine a security fix with unneeded major framework migrations.
- F30: real provider quotes/limits, usage dashboard, spend alerts and per-user quotas; approve costs before expanding access.

**Free beta exit:** enabled-feature security/reliability gates pass; live synthetic integration evidence; migration/deployment/restore proof; real support route; monitoring and budget controls; unsupported paid features clearly unavailable.

**Paid exit:** additionally implement provider checkout, canonical amount/currency, verified idempotent webhooks, entitlement grant/revoke, refunds, disputes, cancellation, replay protection and settlement reconciliation. Test every lifecycle, including duplicate/out-of-order events and failed provider callbacks. No revenue readiness claim until actual provider behavior is verified.

## Minimum verification matrix

| Boundary | Personas / cases |
| --- | --- |
| Authentication | Anonymous, valid OTP/Google, unverified password account if supported, expired/reused OTP, revoked session, banned/expired-ban account |
| Privilege | USER, creator, ADMIN, SUPER_ADMIN; direct plugin endpoint versus app action; self/other/super-admin targets |
| Content | Author, unrelated viewer, follower, subscriber, cancelled subscriber, deleted author/content, private original/public repost |
| Media | Owner A versus B, enrolled in another course, forged key, missing/expired upload, wrong size/type, traversal and long playback |
| Provider state | Direct SDK bypass, removed membership, DB/provider divergence, logout/account switch, token expiry and renewal |
| Jobs | Duplicate claim, partial failure, retry, stuck lease, crash/restart, timeout, cleanup after account deletion |
| Release | Fresh install, migration upgrade/rollback path, production Linux build/start, restore drill, quota exhaustion and alert delivery |

Each test must state expected denial/success and verify that a denied request performs **no database/provider mutation**. Retain the existing 42 regressions; add boundary tests around the repaired cause, not superficial snapshots that merely reproduce implementation syntax.

## Completion record

- Audit, cost model and remediation plan created.
- Confirmed dead schemas/action/exports and unused theme code removed; no speculative whole-file deletion.
- Security, payment, infrastructure and UI remediation above remains proposed, not implemented by this audit.
- Live migration status blocked by database reachability; authenticated end-to-end and provider configuration evidence still required.

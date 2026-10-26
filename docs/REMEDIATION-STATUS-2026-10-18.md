# Knovest remediation status

18 October 2026. Follow-up to the [audit](AUDIT-2026-10-17.md), [remediation plan](REMEDIATION-PLAN-2026-10-17.md), and [budget model](BUDGET-2026-10-17.md).

**Verdict: substantial security remediation completed; unrestricted production launch is still blocked.** Payments stay disabled by the owner's explicit release decision. Stream connections and production transcoding default to disabled until their separate release gates pass. Local checks, actual connected-service work, and outstanding deployment evidence are distinguished below. No application deployment was performed.

## Changes verified against connected services

- Applied `20261018000000_production_boundaries` to the configured Neon database after explicit approval. All 14 migrations are applied. Prisma's read-only database-to-schema diff reports **no difference**.
- Migrated the two existing post attachments after explicit approval. Each public object was copied into private storage, checked for matching nonzero size, committed to its media record with a compare-and-set update, then removed from the public bucket. A subsequent dry run reported **2 already private, 0 candidates, 0 unsupported**. Anonymous requests to both private source objects returned **403**. This does not revoke copies previously downloaded or cached elsewhere.
- Read Stream's actual call-type and messaging permissions without modifying them. Both live call types grant `join-call` to ordinary users; livestream also grants it to anonymous users. This confirms the provider boundary is unsafe for restricted rooms. New production token issuance is blocked unless `STREAM_PERMISSIONS_VERIFIED=true`; **leave that flag false**. Existing previously issued tokens require provider-side invalidation before release.
- Generated a missing local `CRON_SECRET` without printing it. This local secret has not been installed on a hosted environment or scheduler. No cleanup/transcode cron was invoked against existing user content.

## Finding-by-finding disposition

“Code fixed” means the reproduced path has been changed and checked locally. It does not imply hosted end-to-end certification.

| Finding | Current disposition | Evidence / remaining work |
| --- | --- | --- |
| F01 Admin escalation | Code fixed | Restricted ADMIN capabilities and authoritative Better Auth hook protect all plugin admin routes. The installed HTTP handler with an isolated memory adapter now rejects ADMIN self-promotion, identity editing, and management of another administrator. Normal-user moderation remains allowed. |
| F02 Arbitrary membership actions | Code fixed | Subscription membership helpers moved out of `use server` modules. Public additions require ordinary-group creation ownership and membership; subscription groups reject this path. Provider permissions and durable entitlement synchronization remain part of F11/F16. |
| F03 Forged verification metadata | Code fixed | Stream sync ignores caller-supplied identity/badge values and reads canonical database fields. Provider-side direct user update permissions must also be included in the F11 release review. |
| F04 Cross-course HLS | Code fixed | One lesson authorization query binds lesson, course, deletion state and active enrollment/ownership. Both playback routes use it. Negative authorization and per-segment signing regressions pass. |
| F05 Post visibility | Code fixed | Shared public/owner/follower/active-subscriber policy covers feeds, direct reads, bookmarks, originals, media and interactions. Replies must belong to the same post. Private originals cannot be redistributed via reposts. |
| F06 Public restricted attachments | Known inventory migrated | All new post media is private. Authorized media routes return short-lived redirects with private/no-store caching. The two known legacy attachments were migrated. Private images bypass the public Next image optimizer cache. |
| F07 Private-object signer | Code fixed | Canonical asset keys must match the actual course, lesson and asset type before attachment or signing. New lessons cannot attach pre-existing assets. Related chapter/course ownership checks were strengthened. |
| F08 Public profile disclosure | Code fixed | Explicit database projection and return DTO omit email, roles, bans and private application documents. Only approved public verification metadata is exposed. |
| F09 Public notification utility | Code fixed | Notification creation is a `server-only` service, no longer a public server action. |
| F10 Stale sessions/bans | Code fixed | Cookie session cache disabled; shared session lookup fetches current state and rejects deleted/currently banned accounts. Expired bans no longer block ordinary application authorization. |
| F11 Restricted room enforcement | **Blocked; production connections gated** | Actual unsafe provider grants confirmed. Implement server-owned call creation/update/join authorization, appropriate call-scoped capabilities, entitlement revocation and negative direct-SDK tests. Restrict both Chat and Video provider grants, then invalidate old tokens. A client UI check or setting the flag alone does not fix this finding. |
| F12 Upload/abuse controls | Partially fixed | Shared atomic DB counters; actual object size/type plus file-signature checks; bounded parts/batches; account and global upload reservations; cancellation and stale multipart aborts. Persisted upload intent/session records, trusted-edge IP limits, orphan inventory sweeps, exhaustive cancellation races, and provider abuse controls remain. The stale multipart scan is bounded to 100 uploads per cron run and is not a replacement for a full inventory reconciliation. |
| F13 Auth hardening | Partially fixed | Unused password sign-up/sign-in disabled; hashed OTPs, three failed attempts and production database rate limiting configured. Installed-handler tests cover accepted sign-in, failed attempts, and mail rejection. Privileged-account MFA/access policy and real Google/Resend delivery flows remain launch gates. |
| F14 Browser headers | Partially fixed | Security headers now include auth endpoints. Enforced CSP covers base/object/frame/form restrictions; strict script policy is report-only. Inline/eval policy reports are expected. Nonce/hash integration and staging compatibility tests are required before script enforcement. This is not a complete XSS policy. |
| F15 Transcoding | Hardened, production disabled | Atomic leases, attempt caps, timeouts, OS scratch directories, download error propagation, silent audio handling, aspect preservation, stale-job compare-and-set and output/raw cleanup jobs added. Real FFmpeg tests pass for silent portrait and audio landscape clips. Long-video throughput, sandbox isolation, scratch/CPU capacity and persistent Linux worker hosting remain unqualified. |
| F16 Retention/deletion | Partially fixed | Post/article/course deletion and cleanup enqueue are transactional; lesson/chapter deletion queues scoped prefixes; account deletion preserves ownership inventory before cascade. Worker claims leases, checks per-object deletion errors and retries. Malformed IDs/jobs are rejected before deletion. Stream account/message deletion, durable provider membership outbox, final retention periods, backup expiry and restore/reconciliation remain. |
| F17 Playback expiry/recovery | Code fixed for HLS | Every segment is authorized and signed when requested, rather than embedding expiring URLs in a long-lived playlist. Player recovery is bounded and native listeners are cleaned up. Full-length playback/seek and interruption tests on the deployed player remain required; small FFmpeg clips do not prove long-session delivery. |
| F18 Release/operations | Partially fixed | Frozen-lockfile CI with PostgreSQL migration/drift checks, tests, typecheck, warning cap, production advisory scan, build and HTTP smoke added. Error boundaries, sanitized request-error logging, liveness and operator-only DB readiness added. Remote CI, hosted deployment, alert delivery, scheduler and restore drill have not run. |
| F19 Integrations/configuration | Partially verified | Neon migration/drift and actual private-storage migration succeeded. Stream grants were read. Real OAuth, email, authenticated upload/playback, cross-account browser flows and hosted integration checks remain. |
| F20 Payments | Disabled for this release | Server-side paid entitlement denials retained. Course prices/offers and subscription prices above zero are rejected; paid room controls disabled. Free flows remain. No payment provider was added or purchased. |
| F21 Query workloads | Partially fixed | Feed/comment/catalog/search bounds and compound indexes added; feed pagination orders by timestamp and ID. Catalog/admin screens cap results. Database query plans, large datasets, general keyset pagination and capacity/load testing remain. |
| F22 Stream lifecycle | Code fixed; provider gated | Four-hour expiring tokens with refresh providers; browser clients disconnect on unmount/sign-out and user changes. Application query providers are keyed by account so session switching resets cached private data and child SDK state. Actual provider reconnect, multi-tab and revocation tests are still required before enabling connections. |
| F23 Mobile performance | Improved; budget still missed | Public font preloads reduced and React Query moved into application layouts. Three repeat mobile measurements: performance 78/78/81, median LCP 4.41s, TBT 213ms, CLS 0. Further image paint/main-thread work is required. |
| F24 Accessibility | Improved; partial coverage | Lighthouse landing accessibility 100 in all three samples. Headings, form error associations, footer link affordances and media close label corrected. Mobile login/registration/recovery/landing inspected. Full keyboard/screen-reader, contrast, authenticated room and content-creation coverage remains. |
| F25 Recovery/verification | Partially fixed | Missing-email recovery, email-bound registration draft, malformed storage handling, surfaced profile failures and aligned username limits. Verification validates runtime input/document ownership, ignores client approval flags, rejects reviewed edits and requires valid identity/terms before submission. Draft writes/submission include state predicates. Reapplication/appeal policy and complete authenticated onboarding still require product/operations decisions and E2E proof. |
| F26 Public claims/support | Partially fixed | Privacy copy names actual data categories/providers and disabled payments; unsupported analytics/monitoring guarantees removed. Verification copy describes manual review rather than live broker validation or guaranteed continuing registration. Real operating entity, contact/grievance information, retention schedule and legal review remain owner-supplied release blockers. |
| F27 SEO/metadata | Code fixed | Public canonicals/sitemap/robots, application/auth noindex and actual social image. Duplicate title suffix removed. Public courses/articles remain behind the existing application access model and are excluded from the public sitemap. Verify deployed origin and crawler responses before indexing. |
| F28 Quality/tests | Improved; debt remains | New exploit, DTO, ban, upload signature, cleanup, namespace and real FFmpeg regressions. Warning count reduced from 191 after initial audit cleanup to 174, with no lint errors. CI prevents warning growth. Large room components and remaining any/effect warnings need incremental refactoring. |
| F29 Dependencies | Compatible patches applied | Next/ESLint 16.4.2, Prisma client/adapter/CLI 7.10.1, Stream React Video 1.44.0, DOMPurify wrapper 4.6.0 and Resend 6.34.1. Unsupported React Email component package removed; email now uses native HTML JSX. No known production advisories; one high development-only `braces` advisory remains without a supported upstream fix. Stream Node minor-line migration deferred for a dedicated compatibility review. |
| F30 Operating budget | Controls added; approval pending | Upload reservation ceilings and disabled production live/transcode gates reduce exposure. The cost model still requires actual provider plan/usage verification, an approved spending ceiling, alerts, retention limits and capacity testing. Application quotas are not provider billing hard caps. |

## Verification record

| Check | Result |
| --- | --- |
| Regression suite | 62 discovered: 61 pass, one PostgreSQL concurrency test reserved for the isolated CI database; zero failures |
| TypeScript / Next route generation | Pass |
| ESLint | Zero errors, 174 warnings; CI ceiling 174 |
| Optimized Next production build | Pass on Windows/Node 24.19.0; hosted Linux CI still unrun |
| Database | 14 migrations applied; read-only Prisma schema diff empty |
| Known legacy media | Two migrated; anonymous source access returns 403, authorized signed delivery returns 200/image-webp for both; subsequent inventory reports both private |
| Runtime dependency audit | Zero reported advisories |
| Full dependency audit | One high development-only advisory |
| Production HTTP smoke | Public/auth pages, robots/sitemap/liveness and anonymous get-session return 200; authorized database readiness returns 200; unauthenticated readiness and both cron endpoints return 401; known public post media routes return private/no-store 307 redirects. Auth noindex and public page title/canonical behavior checked. |
| Browser | Mobile login, registration required-field handling, missing-email recovery, landing; no console errors observed, report-only CSP messages and a CSS preload warning remain |

Local raw logs and screenshots live under ignored `output/remediation/` and `output/playwright/`. They are supplementary evidence, not public artifacts. No real OTP email, real user impersonation, user banning, provider permission change, or content cleanup cron was used to produce these results.

## Performance comparison

Lighthouse 13.5.0, local optimized production server, mobile simulation. The original audit had one baseline run; follow-up has three browser-cold runs against the same local server. These are lab results, not real-user percentiles or an India network benchmark. Minor metadata/server-only hardening followed the UI measurements and did not change the measured page layout.

| Metric | Audit baseline | Follow-up |
| --- | ---: | ---: |
| Performance score | 67 | 78 / 78 / 81 (median 78) |
| LCP | 5.43s | 4.13 / 4.52 / 4.41s (median 4.41s) |
| TBT | 458ms | 257 / 213 / 133ms (median 213ms) |
| CLS | 0 | 0 in all runs |
| Accessibility | 96 | 100 in all runs |
| Transfer size | About 552 KiB | About 488 KiB median |

The hero image remains the LCP element; paint delay/main-thread work remains significant. The proposed LCP <=2.5s and mobile score >=90 goals are **not met**. Do not label this performance work complete based on the improvement alone.

## Budget controls now implemented

- Auth: Better Auth's shared database rate limiter in production, including its endpoint-specific OTP rules.
- Authenticated `safeAction`: 120 requests per 60-second fixed window per account. Direct post creation, like/save/repost and comment mutations: 60 per minute. Verification draft: 20 per minute. This is not complete coverage of every raw action; remaining direct actions and trusted-edge IP controls require review.
- Uploads: 1,024 MiB reservation window per account per 24 hours; 10,240 MiB globally by default, configurable with `UPLOAD_DAILY_MIB_LIMIT` (zero blocks uploads). Costs use the intent maximum, not a client-understated size. Standard presigning and confirmation both reserve capacity; failed attempts are not refunded. Multipart initiation reserves its maximum. These are conservative issuance/copy budgets, not exact stored-byte accounting or protection against all signed-URL replay/network charges.
- Database pool: maximum five connections per process, with connection/idle timeouts. Total connections still depend on host instance count.
- Transcoding: one candidate per cron invocation, leased attempts and three-attempt cap; production worker disabled pending qualification. Cleanup: ten leased jobs per invocation with five-attempt cap.
- Stream: production connections disabled pending permission repair and budget sign-off. Previously issued credentials/tokens are outside this application's new issuance gate.

## Remaining release sequence

1. Review and deploy this branch to staging, preserving the additive schema. **Do not roll back to a media-publication build:** private media keys now require the authorized handler. Never restore public copies to repair an old client.
2. Complete F11 server/provider authorization together; invalidate older tokens and prove direct-SDK denial for outsiders. Keep connections disabled until all checks pass.
3. Publish real support/entity/privacy-retention details; establish privileged MFA/access, scheduler, monitoring and tested backup restoration. Complete real OAuth/email and cross-account browser flows.
4. Qualify isolated persistent video processing and long playback before enabling production transcoding. Finish provider deletion/synchronization and upload inventory reconciliation.
5. Meet or explicitly revise the measured performance budgets, approve actual vendor costs, and run capacity tests. Then make a documented release decision for the enabled feature set.

See the [release runbook](RELEASE-RUNBOOK.md) for operational checks. This status document supersedes the baseline plan's statement that only initial cleanup had been implemented.

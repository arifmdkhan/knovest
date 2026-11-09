# Dynamic content caching

Platform content uses the existing TanStack Query provider, keyed by the authenticated user in the platform layout. The query client remains mounted across platform navigation. Nothing is stored in localStorage, a service worker, or a shared server cache. Sign-out clears the client; a different user receives a different provider instance.

## Return visits and freshness

- Inactive query data stays in memory for 30 minutes. Hard reloads and closing the tab start a new cache.
- A query mounts with cached data immediately and always checks the server in the background. Window focus and reconnect refresh stale data (30-second stale time).
- Visible content refreshes every 60 seconds. Room listings refresh every 30 seconds and retain their SDK objects for five minutes, without JSON structural sharing. Hidden tabs do not poll.
- Successful TanStack mutations invalidate browser queries. The tracked router's explicit refresh also invalidates queries, covering existing profile and creator edits.
- Loading skeletons appear only without data. Background refresh failures preserve loaded content; new content views show retry feedback. Feed pagination waits for background refreshes and rebuilds cursors using the existing infinite-query behavior.
- Next's experimental `staleTimes.dynamic` is 30 seconds, allowing return navigation to reuse route shells. Query-backed content has its own freshness checks. Server-rendered forms, payment pages, and lesson access retain their existing server checks; no shared caching was added to those reads.

## Coverage

Home feed and sidebar, Academy overview and catalogues, enrolled courses, profiles and their tabs, Search and discovery, Dashboard, post/course/article details, and Trade Room listings use the browser cache. Existing bookmarks, comments, notifications, and hover-card queries share the longer retention and refresh defaults. Their existing mutation updates remain in place.

Authenticated read actions derive the viewer from the server session and validate client filters. Article authors and review authors use explicit public field selections. Existing lesson/media access endpoints and payment actions remain authoritative for access.

## Verification

`tests/cache-regressions.test.cjs` covers the Home server gate, immediate cached rendering, fresh replacements, refresh failures and retries, deduplicated requests, separate user caches, mutation invalidation, pagination cursors, retained feed cards, and authenticated filter handling. `tests/navigation-regressions.test.cjs` covers explicit route refresh invalidation.

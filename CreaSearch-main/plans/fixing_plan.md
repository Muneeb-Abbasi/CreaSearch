# Creasearch Consolidated Fixing Plan

**Date:** March 15, 2026  
**Sources:** `functional_issues.txt` (backend logs & observed behavior) + `security_performance_analysis.md`  
**Status:** Ready for review

---

## Current State Assessment

Several items from the security/performance analysis are **already implemented**:

| Item | Status |
|------|--------|
| Admin role verification (`requireAdmin` middleware) | ✅ Done |
| Rate limiting (custom in-memory, API + auth + sensitive tiers) | ✅ Done |
| Structured logger (replaces `console.log`) | ✅ Done |
| Security headers (X-Content-Type, X-Frame, XSS, Referrer) | ✅ Done |
| Input validation middleware (`validation.ts`) | ✅ Done |
| JSON body size limit (`10mb`) | ✅ Done |
| Notification bell polling (30s interval) | ✅ Done (but needs tuning) |

---

## Phase 1 — Critical Functional Fixes

These are bugs causing real failures observed in production logs.

### Fix 1: Admin Verify-Instagram/Facebook-Now Returns 400

**Problem:** `POST /api/admin/verify-instagram-now/:id` and `verify-facebook-now/:id` fail with *"Profile has no Instagram/Facebook link"* because they look up `social_accounts` records, but if the user only saved a social link in `profiles.social_links` (and never triggered a verification), no `social_accounts` row exists.

**Files:** `backend/src/routes.ts` (lines 670–756)

**Fix:** When no `social_accounts` row exists, fall back to reading the URL from `profiles.social_links.instagram` / `profiles.social_links.facebook`. If neither source has a URL, then return the 400.

---

### Fix 2: Missing Verification Completion Notification (YouTube)

**Problem:** When YouTube verification completes (both user-initiated via `/api/verify/youtube` and cron refresh), no notification is sent to the user.

**Files:** `backend/src/routes.ts` (line ~458–475), `backend/src/services/cron.ts` (line ~31–47)

**Fix:** After successful YouTube verification, call `notificationService.create()` with type `verification_complete` to notify the profile owner.

---

### Fix 3: Missing Verification Notification (Instagram & Facebook)

**Problem:** When queued/immediate Instagram/Facebook verifications complete, no user notification is dispatched.

**Files:** `backend/src/routes.ts` (lines 538–563, 616–635), `backend/src/services/verification-queue.ts`

**Fix:** Add notification dispatch after successful verification for both platforms, in both immediate and queue-processed paths.

---

### Fix 4: Concurrent Social Verification Trigger Pattern

**Problem:** After profile update, YouTube/Instagram/Facebook verifications fire near-simultaneously, triggering rate-limit (429) responses.

**Files:** Frontend verification trigger code (likely in profile edit/create components)

**Fix:** Add sequential verification with delays: stagger verification requests (e.g., YouTube → wait 2s → Instagram → wait 2s → Facebook). Alternatively, batch into a single `/api/verify/all` endpoint that handles ordering server-side.

---

## Phase 2 — Performance & Observability Fixes

### Fix 5: Excessive Frontend Polling

**Problem:** `/api/notifications/unread-count`, `/api/profiles`, `/api/featured-profiles`, `/api/admin/pending`, and `/api/categories` called at 1–3 second intervals per the logs, despite `NotificationBell.tsx` being set at 30s.

**Files:** Frontend components making repeated API calls (search page, admin panel, etc.)

**Fix:**
- Audit all `useEffect` hooks with API calls for missing dependency arrays or overly broad dependencies causing re-fetch loops
- Add `staleTime` / caching via a simple fetch cache or React Query
- Ensure admin endpoints (`/api/admin/pending`) only poll when the admin panel tab is active (use `document.visibilityState`)

---

### Fix 6: Slow Endpoint Response Times

**Problem:** Observed high latency:
- `/api/upload/photo` → ~3131 ms
- `/api/admin/pending` → ~1287 ms  
- `/api/notifications/unread-count` → ~1750 ms  
- `/api/profiles` → ~1024 ms  
- `/api/admin/approve` → ~2753 ms  

**Files:** `backend/src/services/database.ts`, `backend/src/routes.ts`

**Fix:**
- **Add database indexes** for common queries: `profiles(status, creasearch_score)`, `notifications(user_id, is_read)`, `social_accounts(profile_id, platform)`
- **Add response caching** for public endpoints (`/api/profiles`, `/api/featured-profiles`, `/api/categories`) using in-memory cache with 60–300s TTL
- **Fire-and-forget email sending** — don't `await` email in approve/reject handlers; catch errors asynchronously

---

### Fix 7: High Latency on 304 Responses

**Problem:** Even `304 Not Modified` responses take 500–1000+ ms, suggesting processing overhead before the cache-hit check.

**Files:** `backend/src/index.ts`, `backend/src/routes.ts`

**Fix:**
- Move ETag/conditional request handling **before** database queries using proper `Cache-Control` and `ETag` headers
- Add `compression` middleware for response compression
- Consider adding `express.static` caching for any static assets served by the backend

---

### Fix 8: Verification Queue Timing Not Logged

**Problem:** No structured log entries for when profiles are queued, when queue executions are scheduled, or when verifications complete.

**Files:** `backend/src/services/verification-queue.ts`, `backend/src/services/cron.ts`

**Fix:** Add structured log entries:
- `[Queue] Profile {profileId} queued for {platform} verification at {timestamp}, estimated processing: {nextCronTime}`
- `[Queue] Verification completed for {profileId}/{platform} at {timestamp}`
- `[Queue] Verification failed for {profileId}/{platform} at {timestamp}: {reason}`

---

## Phase 3 — Security Hardening

### Fix 9: CORS — Overly Permissive `.vercel.app` Wildcard

**Problem:** Any `*.vercel.app` subdomain is allowed (`origin.endsWith('.vercel.app')`).

**File:** `backend/src/index.ts` (line 21)

**Fix:** Replace wildcard with explicit allowed Vercel deployment URLs, or at minimum match only the project-specific subdomain pattern (e.g., `creasearch*.vercel.app`).

---

### Fix 10: File Upload Security

**Problem:** No file content validation (only mimetype check), no filename sanitization, 50MB limit is excessive.

**File:** `backend/src/routes.ts` (upload routes)

**Fix:**
- Validate file magic bytes (using `file-type` package) after receiving the buffer
- Sanitize filenames to remove special characters
- Reduce upload limit to 10MB for photos, 25MB for videos

---

### Fix 11: Search Query Injection Risk

**Problem:** Search filter uses unescaped string interpolation in `.or()` Supabase calls.

**File:** `backend/src/services/database.ts`

**Fix:** Escape `%` and `_` characters in search input before passing to `.ilike()` queries.

---

### Fix 12: Missing CSRF Protection

**Problem:** No CSRF tokens for state-changing operations.

**Fix:** Implement CSRF tokens via `csurf` or custom double-submit cookie pattern for POST/PUT/DELETE endpoints.

> [!WARNING]  
> CSRF protection may require frontend changes to include tokens in all mutating API calls. Test thoroughly.

---

## Phase 4 — Optimizations (Lower Priority)

### Fix 13: Backend Pagination for Profile Listing

**Problem:** `getAll()` loads all profiles; no server-side pagination.

**Fix:** Add `page` and `limit` query parameters with `range()` on Supabase query. Return `{ data, total, page, limit }`.

---

### Fix 14: Response Compression

**Problem:** No gzip/brotli compression on API responses.

**Fix:** Add `compression` middleware to `index.ts`.

---

### Fix 15: Frontend Image Lazy Loading

**Problem:** All images load eagerly.

**Fix:** Add `loading="lazy"` and `decoding="async"` to profile images.

---

### Fix 16: Repeated Profile Resource Access

**Problem:** Same profile IDs fetched multiple times in tight time windows (detail + reviews + collaborations as separate calls).

**Fix:** Create a combined endpoint `/api/profiles/:id/full` that returns profile data with reviews and collaborations in a single query, or implement client-side caching to deduplicate requests.

---

## Implementation Priority

| Priority | Fixes | Estimated Effort |
|----------|-------|-----------------|
| **P0 — Fix Now** | Fix 1 (admin verify 400s), Fix 2 & 3 (verification notifications) | ~2–3 hours |
| **P1 — This Week** | Fix 4 (concurrent triggers), Fix 5 (excessive polling), Fix 8 (queue logging) | ~3–4 hours |
| **P2 — Next Sprint** | Fix 6 (slow endpoints), Fix 7 (304 latency), Fix 9 (CORS), Fix 10 (uploads) | ~4–6 hours |
| **P3 — Backlog** | Fix 11–16 (pagination, compression, lazy loading, CSRF, etc.) | ~6–8 hours |

---

## Verification Plan

### Automated
- After Fix 1: Call `POST /api/admin/verify-instagram-now/:id` for a profile that has an Instagram link in `social_links` but no `social_accounts` row — should succeed instead of returning 400
- After Fix 2 & 3: Verify new notification appears in the `notifications` table after each platform verification completes
- After Fix 5: Monitor backend logs after deploying — verify reduced request frequency to polled endpoints

### Manual
- **Fix 1:** As admin, try to verify a newly-created profile's Instagram/Facebook from the admin panel. It should work even if the user hasn't previously triggered verification themselves
- **Fix 2 & 3:** Complete a YouTube/Instagram/Facebook verification and check the notification bell for a new notification
- **Fix 5:** Open the app with browser DevTools Network tab → verify no endpoint is called more than once per 30s
- **Fix 6:** Compare response times before/after for `/api/profiles` and `/api/admin/pending` — target <500ms

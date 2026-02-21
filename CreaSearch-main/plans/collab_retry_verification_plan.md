# Collaboration Count, Admin Non-Platform Collab Approval & Retry Mechanism — Verification Plan

> **Created**: 2026-02-21  
> **Status**: Verification & Gap Analysis  
> **Scope**: Collaboration count system, admin approval for non-CreaSearch collabs, retry mechanisms

---

## 1. Collaboration Count System

### 1.1 What Exists ✅

The collaboration count system is **largely implemented** across all layers:

| Layer | File | Status |
|-------|------|--------|
| **DB Migration** | `supabase/migrations/007_add_collaborations.sql` | ✅ Complete |
| **DB Table** | `collaborations` (id, requester_profile_id, partner_profile_id, description, proof_url, status, admin_notes, approved_by, approved_at, timestamps) | ✅ Complete |
| **DB Column** | `profiles.collaboration_count INTEGER DEFAULT 0` | ✅ Added in migration 007 |
| **DB RPC** | `increment_collab_count(profile_id_param UUID)` — atomically increments count | ✅ Complete |
| **DB RLS** | View approved collabs (public), view own collabs (auth), create collabs (auth), service role full access | ✅ Complete |
| **Backend Service** | `collaborationService` in `backend/src/services/database.ts` (L965–1067) — create, getById, getByProfileId, getPending, approve, reject | ✅ Complete |
| **Backend Routes** | `POST /api/collaborations`, `GET /api/collaborations/profile/:id`, `GET /api/admin/collaborations/pending`, `PUT /api/admin/collaborations/:id/approve`, `PUT /api/admin/collaborations/:id/reject` | ✅ Complete |
| **Scoring** | `scoringService.calculateScore()` includes collaboration bonus (max 10 pts, 2 pts per collab) | ✅ Complete |
| **Email** | `sendCollaborationApprovedEmail`, `sendCollaborationRejectedEmail`, `sendNewCollaborationRequestEmail` | ✅ Complete |
| **Frontend API** | `collaborationApi` in `frontend/src/lib/api.ts` (L542–587) — create, getByProfileId, getPending, approve, reject | ✅ Complete |
| **Admin UI** | `AdminDashboardPage.tsx` — Collaborations tab with pending list, approve/reject buttons, proof_url display | ✅ Complete |

### 1.2 What's Missing ❌

| Gap | Description | Impact |
|-----|-------------|--------|
| **No user-facing collab submission form** | No UI on `CreatorProfilePage.tsx` or elsewhere for a user to submit a collaboration request. The API exists (`POST /api/collaborations`) but there's no frontend form to call it. | Users cannot submit collab requests through the app |
| **No partner approval flow** | Currently, the requester submits and it goes directly to admin for review. The partner (other user) has no way to confirm/approve the collab before admin review. | Only one-sided proof verification |
| **No collab history on profile** | No UI showing past approved collaborations on a user's public profile. The API exists (`GET /api/collaborations/profile/:id`) but isn't consumed in the profile view. | Users can't showcase their collab history |
| **Admin dashboard shows only profile IDs** | The admin collab view shows truncated UUIDs (`collab.requester_profile_id.slice(0,8)`) instead of profile names. | Poor admin UX |
| **No validation schema for collab creation** | The `validation.ts` middleware has no validation for collaboration request body fields. | Input validation gap |

### 1.3 Recommendations

#### Priority 1: User-Facing Collab Submission Form
- Add a "Submit Collaboration" button on `CreatorProfilePage.tsx`
- Create a modal/dialog with fields: partner selection (search existing profiles), description, proof upload (image/link)
- Wire to `collaborationApi.create()`

#### Priority 2: Partner Confirmation Flow
- Add a `partner_status` column to `collaborations` table (`pending_partner` → `confirmed` → `pending_admin`)
- Notify the partner when a collab is submitted against them
- Partner can confirm/deny before it reaches admin
- Only admin-approve collabs that both parties have confirmed

#### Priority 3: Display Collabs on Profile
- Add a "Collaborations" section on `CreatorProfilePage.tsx`
- Fetch and display approved collaborations with partner names
- Show `collaboration_count` badge on profile header

---

## 2. Admin Approve Collab for Non-CreaSearch Users

### 2.1 What Exists ✅

The current admin approval flow works when **both** the requester and partner are registered CreaSearch users with profiles:

- Route: `PUT /api/admin/collaborations/:id/approve`
- On approval: increments `collaboration_count` for BOTH `requester_profile_id` and `partner_profile_id`
- Recalculates Creasearch scores for BOTH profiles
- Sends email notifications to BOTH profiles

### 2.2 What's Missing ❌

| Gap | Description | Impact |
|-----|-------------|--------|
| **No support for external partners** | The `collaborations` table requires `partner_profile_id UUID NOT NULL REFERENCES profiles(id)`. Collabs with non-CreaSearch users (brands, creators not on the platform) can't be recorded. | Users who collaborate with external entities can't count those collabs |
| **No external collab proof mechanism** | No way for admin to manually add/approve a collab for one user where the partner doesn't exist on platform | Admin can't credit users for real external work |
| **No admin-initiated collab creation** | Admin can only approve/reject user-submitted collabs, not create one from scratch | Limited admin capability |

### 2.3 Recommendations

#### Option A: Allow Nullable Partner Profile (Simpler)
- Make `partner_profile_id` nullable in the `collaborations` table
- Add `external_partner_name TEXT` and `external_partner_url TEXT` columns
- When `partner_profile_id` is NULL, treat as external collab
- On approval, only increment count for the requester
- Admin can view proof and approve for the single user

**Migration:**
```sql
ALTER TABLE collaborations ALTER COLUMN partner_profile_id DROP NOT NULL;
ALTER TABLE collaborations DROP CONSTRAINT no_self_collab;
ALTER TABLE collaborations ADD COLUMN external_partner_name TEXT;
ALTER TABLE collaborations ADD COLUMN external_partner_url TEXT;
-- Re-add self-collab check only when both are internal
ALTER TABLE collaborations ADD CONSTRAINT no_self_collab 
  CHECK (partner_profile_id IS NULL OR requester_profile_id != partner_profile_id);
```

#### Option B: Separate `external_collaborations` Table (Cleaner separation)
- New table for external collabs with different validation rules
- Keep internal collab table unchanged
- Admin has a separate UI for external collab management

**Recommendation: Option A** — simpler, fewer code changes, reuses existing admin UI.

#### Additional Backend Changes Needed:
- Update `collaborationService.create()` to accept optional external partner fields
- Update `collaborationService.approve()` to only increment the requester's count when partner is external
- Add admin route `POST /api/admin/collaborations` for admin-initiated collab creation
- Update admin dashboard UI to show external partner info and allow admin submission

---

## 3. Retry Mechanism for Verification Tasks

### 3.1 What Exists ✅

| Component | Current Behavior |
|-----------|-----------------|
| **YouTube Verification** | Single attempt via Google API. On failure: returns `FAILED` status. No retry. |
| **Instagram Verification** | Primary Apify actor with fallback to secondary actor. `queueInstagramVerification()` is a **stub** that returns `{ queued: true }` without actually queuing. |
| **Cron Service** | Weekly YouTube refresh for all verified accounts. On individual failure: logs error, moves to next. No retry of failed accounts. |
| **Frontend** | React Query configured with `retry: false`. |

### 3.2 What's Missing ❌

| Gap | Description | Impact |
|-----|-------------|--------|
| **No `verification_queue` table** | The existing plan (`verify_insta_Yt_followers_subs.md`) proposed a queue table but it was never created | Background verification is non-functional |
| **Instagram queue is a stub** | `queueInstagramVerification()` returns immediately without any actual queuing | Instagram verifications marked as PENDING are never processed |
| **No retry count tracking** | No field tracks how many times verification was attempted | Can't implement smart retry policies |
| **No failure backoff** | Failed verifications are not retried after a delay | Users stuck in FAILED/PENDING state permanently |
| **No cron for Instagram queue** | Cron only handles YouTube weekly refresh. No scheduled job picks up PENDING Instagram verifications | Instagram queue never drains |
| **YouTube refresh skips failed accounts** | If a YouTube refresh fails, the account is skipped forever until the next weekly run | Temporary API failures cause week-long gaps |

### 3.3 Recommendations

#### New Migration: `verification_queue` Table
```sql
CREATE TABLE IF NOT EXISTS verification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  platform_url TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('initial', 'refresh', 'retry')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, platform, task_type)
);

CREATE INDEX idx_vq_status ON verification_queue(status);
CREATE INDEX idx_vq_next_attempt ON verification_queue(next_attempt_at);
```

#### Retry Logic Implementation

1. **Backend Service: `verification-queue.ts`**
   - `enqueue(profileId, platform, url, taskType)` — add to queue
   - `processNext(platform)` — pick oldest queued item, attempt verification
   - `markFailed(id, error)` — increment retry_count, set next_attempt_at with exponential backoff
   - `markCompleted(id)` — mark done, update social_accounts

2. **Retry Policy:**
   | Retry # | Delay |
   |---------|-------|
   | 1st | 1 hour |
   | 2nd | 6 hours |
   | 3rd | 24 hours |
   | Final failure | Mark as `failed`, notify admin |

3. **Cron Updates (`cron.ts`):**
   - Add Instagram queue processor: every 4 hours, process 1–2 PENDING items
   - Add retry processor: every hour, pick up items where `next_attempt_at <= NOW()` and `status = 'failed'` and `retry_count < max_retries`
   - YouTube weekly refresh: on failure, enqueue retry instead of silently skipping

4. **Frontend Retry UX:**
   - Show "Retry" button when verification status is `FAILED`
   - Display retry count and next attempt time
   - Change React Query `retry` from `false` to `1` for verification endpoints only

5. **Admin Visibility:**
   - Add "Verification Queue" tab in admin dashboard
   - Show queued/processing/failed items with error messages
   - Allow admin to manually retry or force-verify

---

## Summary of Gaps by Feature

```
┌──────────────────────────────────┬──────────────┬────────────────────────┐
│ Feature                          │ Backend      │ Frontend               │
├──────────────────────────────────┼──────────────┼────────────────────────┤
│ 1. Collab Count System           │ ✅ Complete   │ ❌ No submission form  │
│                                  │              │ ❌ No profile display  │
│                                  │              │ ⚠️ Admin shows IDs only│
├──────────────────────────────────┼──────────────┼────────────────────────┤
│ 2. Non-CreaSearch User Collabs   │ ❌ Not built  │ ❌ Not built           │
│                                  │ (DB enforces │                        │
│                                  │  both FK)    │                        │
├──────────────────────────────────┼──────────────┼────────────────────────┤
│ 3. Retry Mechanism               │ ❌ No queue   │ ❌ retry: false        │
│                                  │ ❌ No retry   │ ❌ No retry button     │
│                                  │ ❌ Stub queue │                        │
└──────────────────────────────────┴──────────────┴────────────────────────┘
```

---

## Implementation Priority (Suggested)

1. **Retry Mechanism** — Critical for platform reliability, verification is currently broken for Instagram background processing
2. **Non-CreaSearch Collab Approval** — High value for users with external partnerships
3. **Collab Submission UI** — Enables the existing backend to actually be used by end users
4. **Partner Confirmation Flow** — Nice-to-have, adds trust to the collab system

---

## Verification Plan

### For Collaboration System
1. Check migration 007 is applied in Supabase (query `collaborations` table exists)
2. Test `POST /api/collaborations` with valid requester + partner → should create pending collab
3. Test `GET /api/collaborations/profile/:id` → returns collabs for that profile
4. Test `PUT /api/admin/collaborations/:id/approve` → status changes, collab_count increments, score updates
5. Verify email sends for approve/reject actions

### For Retry Mechanism (Once Built)
1. Trigger Instagram verification → check it appears in `verification_queue`
2. Simulate API failure → verify retry_count increments and next_attempt_at is set
3. Run cron processor → verify it picks up and processes queue items
4. After 3 failures → verify item status is `failed` and admin is notified

### For Non-CreaSearch Collabs (Once Built)
1. Create collab with `partner_profile_id = null` + `external_partner_name` → should succeed
2. Admin approve external collab → only requester's count increments
3. Verify scoring only updates for the internal user

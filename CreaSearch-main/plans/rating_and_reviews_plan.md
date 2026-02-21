# Rating and Reviews Plan

## Overview

**Phase 1**: Bug Fixes (Admin profile view, social media URL validation, profile submission restriction)  
**Phase 2**: Reviews & Ratings Feature (verified brands/creators only)

---

## Phase 1: Bug Fixes

### 1.1 Admin Full Profile View

**Problem**: `ProfileDetailModal.tsx` missing phone, industry, and niche fields.

#### [MODIFY] [ProfileDetailModal.tsx](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/components/ProfileDetailModal.tsx)

Add missing fields to the modal grid: phone, industry, niche.

---

### 1.2 Social Media URL Validation

**Problem**: Social link inputs accept any text; should only accept valid platform URLs.

#### [MODIFY] [validation.ts](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/utils/validation.ts)

Add platform-specific validators:
- `validateInstagramUrl()` - instagram.com URLs only
- `validateYouTubeUrl()` - youtube.com URLs only  
- `validateLinkedInUrl()` - linkedin.com URLs only
- `validateTwitterUrl()` - twitter.com or x.com URLs only

#### [MODIFY] [ProfileCreationPage.tsx](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/pages/ProfileCreationPage.tsx)

Apply validation on social link inputs (Step 3), display inline errors.

#### [MODIFY] [BrandProfileCreationPage.tsx](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/pages/BrandProfileCreationPage.tsx)

Same validation pattern as above.

---

### 1.3 Profile Submission Restriction

**Problem**: Users should not be able to resubmit profile while pending approval.

**Current behavior** (already correct): `ProfileCreationPage.tsx` lines 294-384 already handle this:
- If `existingProfile.status === 'pending'` → Shows "Profile Under Review" message
- If `existingProfile.status === 'approved'` → Shows "Profile Approved" with "View My Profile" link
- If `existingProfile.status === 'rejected'` → Shows "Edit Profile" button to allow resubmission

> [!NOTE]
> This is already implemented correctly. Users cannot submit a new profile if one exists. Rejected users can edit and resubmit. Approved users can view their profile (edit functionality can be added later).

---

## Phase 2: Reviews & Ratings Feature

### User Requirement

Only **verified brands and creators** can submit reviews. Users must have an approved profile to leave reviews.

---

### 2.1 Backend API

#### [MODIFY] [routes.ts](file:///c:/Users/creasearch/CreasearchMarket/backend/src/routes.ts)

Add routes:
- `GET /api/reviews/:profileId` - Fetch reviews for a profile (public)
- `POST /api/reviews` - Create review (requires auth + approved profile)

The POST route will verify the reviewer has an approved profile before allowing review submission.

---

### 2.2 Frontend API Client

#### [MODIFY] [api.ts](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/lib/api.ts)

Add `reviewsApi` object with `getByProfileId()` and `create()` methods.

---

### 2.3 Review Components

#### [NEW] [ReviewForm.tsx](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/components/ReviewForm.tsx)

- Star rating selector (1-5 stars)
- Comment textarea
- Only visible if user has approved profile and is not viewing own profile

#### [NEW] [ReviewList.tsx](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/components/ReviewList.tsx)

- Displays reviews with star rating, comment, reviewer name, date
- Empty state handling

---

### 2.4 Profile Page Integration

#### [MODIFY] [CreatorProfilePage.tsx](file:///c:/Users/creasearch/CreasearchMarket/frontend/src/pages/CreatorProfilePage.tsx)

- Import and render `ReviewList` and `ReviewForm` in Reviews tab
- Fetch reviews on page load
- Update profile rating after new review

---

## Verification Plan

| Test | Steps |
|------|-------|
| Admin View | Login as admin → View pending profile → Verify phone/industry/niche visible |
| URL Validation | Enter "google.com" in Instagram field → Expect error message |
| Profile Restriction | Submit profile → Try creating another → Should see "Under Review" page |
| Reviews (verified user) | Login as approved creator → Leave review on another profile → Success |
| Reviews (unverified) | Login without profile → Try leaving review → Should be blocked |

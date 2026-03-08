# Implementation Plan: Profile, Verification, and Admin Updates

This plan covers the 12 specific feature requests and fixes for the Creasearch Market platform.

## Proposed Changes

### 1. Database & Verification (Facebook & YouTube)
- **Facebook Field in DB & Forms**: The database `social_accounts` table already supports the `facebook` platform. I will update [frontend/src/pages/ProfileCreationPage.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/pages/ProfileCreationPage.tsx) and the update forms to explicitly include a Facebook Profile URL input, effectively **replacing the Twitter field with Facebook**.
- **Facebook Follower Verification**: I will integrate Facebook page follower count verification using Apify (mapping to `backend/src/services/facebook.ts`).
- **YouTube Verification Fix**: I will debug and repair the YouTube verification flow in `backend/src/services/youtube.ts` and [verification-queue.ts](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/backend/src/services/verification-queue.ts) which is currently failing.
- **Combined Follower Count**: I will update the logic that calculates the `follower_total` so that it is strictly the sum of verified followers from **Instagram, Facebook, and YouTube**. This likely involves updating `scoringService.calculateScore` or a separate `updateFollowerTotal` function in the backend.

### 2. Frontend / Profile UI
- **Replace Twitter with Facebook**: I will find all instances of Twitter (icons, input fields, labels) and replace them with Facebook.
- **Remove "Completed Gigs" section**: I will remove the standalone "Completed Gigs" UI sections from [frontend/src/pages/CreatorProfilePage.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/pages/CreatorProfilePage.tsx) and related components.
- **Replace 'Completed Gigs' near Follower count**: In [frontend/src/components/ProfileHeader.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/components/ProfileHeader.tsx), I will replace "Completed Gigs" with "Verified Collabs" and bind it to the verified collaboration count.
- **Remove LinkedIn icon**: I will remove the LinkedIn icon from the profile title in [ProfileHeader.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/components/ProfileHeader.tsx).
- **Remove duplicated "Social Media" section**: I will remove the bottom social media section in [CreatorProfilePage.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/pages/CreatorProfilePage.tsx) to avoid duplication with the header.
- **City Dropdown & Country Dependency**: In [ProfileCreationPage.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/pages/ProfileCreationPage.tsx), I will change the city input from a radio/text format to a dynamic dropdown that checks if a `country` has been selected first. I will use a predefined list of major cities in Pakistan for the dropdown, assuming the primary focus is Pakistan.

### 3. Admin Panel Updates
- **Fix 2 Collab Approval Options**: I will investigate [frontend/src/pages/AdminDashboardPage.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/pages/AdminDashboardPage.tsx) to remove the redundant collaboration approval option, leaving only one clear approval action.
- **Remove Action Log**: I will remove the Action Log view/tab from the Admin Panel ([AdminDashboardPage.tsx](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/frontend/src/pages/AdminDashboardPage.tsx)).

### 4. Notifications & Emails
- **Fix Notification Loading Issue**: I will fix the infinite loading skeleton in the Notifications popover/list.
- **Verify Resend Email & Trigger Points**: 
  - I will verify that [server/services/email.ts](file:///c:/Users/creasearch/CreasearchMarket/CreaSearch-main/server/services/email.ts) properly uses the Resend API.
  - I will update `backend/src/routes.ts` (or relevant controllers) to trigger emails on important events: Profile submitted to admin, Profile approved, Profile rejected.

---

## Verification Plan

### Automated / Manual Verification
1. **Facebook Verification & Follower Sum**: Manually submit a profile with valid Facebook, Instagram, and YouTube URLs. Verify that the total follower count on the profile exactly matches the sum of the verified counts from those three platforms.
2. **YouTube Verification**: Submit a YouTube URL and run the verification cron/API. Verify the follower count updates correctly without errors.
3. **UI Checks**: 
   - Confirm Facebook has replaced Twitter on the forms.
   - Open a Creator's profile page and confirm: LinkedIn icon is gone, "Social Media" section at the bottom is gone, and "Verified Collabs" shows up correctly.
   - Try selecting a city without a country (should prompt selection).
4. **Admin Checks**: Log in as admin and ensure the Action Log is removed, and there is only 1 "Approve" button for pending collaborations.
5. **Notification System**: Trigger a notification and open the bell icon to ensure it loads immediately.
6. **Email Testing**: Verify email delivery when a profile changes states (submitted, approved).

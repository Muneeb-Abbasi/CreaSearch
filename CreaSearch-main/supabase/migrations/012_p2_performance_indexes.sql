-- Migration 012: Phase 2 Performance Indexes
-- Adds indexes to optimize slow endpoints, particularly targeting:
-- /api/profiles, /api/admin/pending, and /api/notifications/unread-count

-- 1. Profiles table optimizations
-- Used in: /api/profiles, /api/admin/pending, /api/featured-profiles
-- Helps: Fetching approved profiles, matching by score, fetching pending status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_creasearch_score ON profiles(creasearch_score DESC);

-- Composite index for /api/profiles list queries (approved + ordered by score)
CREATE INDEX IF NOT EXISTS idx_profiles_status_score ON profiles(status, creasearch_score DESC);

-- 2. Notifications table optimization
-- Used in: /api/notifications/unread-count (which is polled frequently)
-- Helps: Counting unread notifications by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 3. Social Accounts table optimizations
-- Used in: Verification checks, frontend profile views
-- Helps: Fast lookup of a specific platform account for a profile
CREATE INDEX IF NOT EXISTS idx_social_accounts_profile_platform on social_accounts(profile_id, platform);

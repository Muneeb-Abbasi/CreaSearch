-- ============================================
-- Phase 3: Notifications & Admin Features
-- Migration: 004_phase3_notifications_admin.sql
-- ============================================

-- ============================================
-- 3.1 — NOTIFICATIONS TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'profile_approved', 'profile_rejected',
    'new_inquiry', 'new_review',
    'verification_complete', 'admin_announcement',
    'profile_featured'
  )),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- 3.2 — ADMIN ACTION LOG TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN (
    'approve_profile', 'reject_profile', 'delete_profile',
    'feature_profile', 'unfeature_profile',
    'add_category', 'edit_category', 'delete_category',
    'add_niche', 'edit_niche', 'delete_niche',
    'ban_user', 'unban_user'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'user', 'review', 'category', 'niche')),
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_log_admin ON admin_action_log(admin_user_id);
CREATE INDEX idx_admin_log_target ON admin_action_log(target_type, target_id);
CREATE INDEX idx_admin_log_date ON admin_action_log(created_at DESC);

-- ============================================
-- 3.3 — FEATURED PROFILES TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS featured_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  featured_by UUID NOT NULL REFERENCES users(id),
  sort_order INTEGER DEFAULT 0,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_featured_profile ON featured_profiles(profile_id);

-- ============================================
-- 3.4 — RLS POLICIES
-- ============================================

-- Notifications: users read/update own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Admin Action Log: admin only
ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read action log" ON admin_action_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Featured Profiles: public read
ALTER TABLE featured_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read featured profiles" ON featured_profiles
  FOR SELECT USING (true);

-- ============================================
-- DONE
-- ============================================

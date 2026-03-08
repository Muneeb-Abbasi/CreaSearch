-- Migration: Collaboration Verification System
-- Adds partner confirmation flow, new metadata fields, duplicate detection,
-- and expands status values to support the full verification workflow.

-- ============================================
-- 1. NEW COLUMNS
-- ============================================

-- Metadata fields
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS campaign_name TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS date_range TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS proof_urls TEXT[] DEFAULT '{}';

-- Partner confirmation fields
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS partner_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS partner_confirmed_at TIMESTAMPTZ;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS requester_confirmed BOOLEAN DEFAULT TRUE;

-- ============================================
-- 2. EXPAND STATUS CHECK CONSTRAINT
-- ============================================

-- Drop old constraint and add expanded one
ALTER TABLE collaborations DROP CONSTRAINT IF EXISTS collaborations_status_check;
-- Also try the auto-generated name pattern
DO $$
BEGIN
  ALTER TABLE collaborations DROP CONSTRAINT IF EXISTS collaborations_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE collaborations ADD CONSTRAINT collaborations_status_check
  CHECK (status IN ('pending_confirmation', 'pending_admin', 'approved', 'rejected'));

-- Migrate existing 'pending' rows to 'pending_admin' (they were submitted without the confirmation step)
UPDATE collaborations SET status = 'pending_admin' WHERE status = 'pending';

-- ============================================
-- 3. DUPLICATE DETECTION INDEX
-- ============================================

-- Prevent duplicate submissions: same requester + partner + campaign_name (only for non-rejected)
CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_no_duplicate
  ON collaborations (requester_profile_id, COALESCE(partner_profile_id, '00000000-0000-0000-0000-000000000000'), COALESCE(campaign_name, ''))
  WHERE status != 'rejected';

-- ============================================
-- 4. ADDITIONAL RLS POLICY FOR PARTNER CONFIRMATION
-- ============================================

-- Partners can update their confirmation on collaboration records
CREATE POLICY "Partners can update confirmation" ON collaborations FOR UPDATE
  USING (
    partner_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    partner_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- 5. HELPER FUNCTION: DECREMENT COLLAB COUNT
-- ============================================

CREATE OR REPLACE FUNCTION decrement_collab_count(profile_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET collaboration_count = GREATEST(COALESCE(collaboration_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = profile_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. UPDATE ADMIN ACTION LOG CONSTRAINTS
-- ============================================

-- Expand the action constraint to include new collaboration actions
DO $$
BEGIN
    ALTER TABLE admin_action_log DROP CONSTRAINT IF EXISTS admin_action_log_action_check;
    ALTER TABLE admin_action_log ADD CONSTRAINT admin_action_log_action_check
        CHECK (action IN (
            'approve_profile', 'reject_profile', 'delete_profile',
            'feature_profile', 'unfeature_profile',
            'add_category', 'edit_category', 'delete_category',
            'create_category', 'update_category', 'delete_category',
            'create_niche', 'update_niche', 'delete_niche',
            'add_niche', 'edit_niche', 'delete_niche',
            'ban_user', 'unban_user',
            'approve_collaboration', 'reject_collaboration', 'admin_create_collaboration'
        ));
END $$;

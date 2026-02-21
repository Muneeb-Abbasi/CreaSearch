-- Migration: Add Collaborations System
-- This creates the collaborations table for tracking collaboration requests
-- and adds a collaboration_count column to profiles for scoring integration.

-- Collaborations table
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_collab CHECK (requester_profile_id != partner_profile_id)
);

-- Add collaboration_count to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS collaboration_count INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaborations_requester ON collaborations(requester_profile_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_partner ON collaborations(partner_profile_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);

-- Enable Row Level Security
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read approved collaborations
CREATE POLICY "Anyone can view approved collaborations"
  ON collaborations FOR SELECT
  USING (status = 'approved');

-- Authenticated users can view their own collaborations (any status)
CREATE POLICY "Users can view own collaborations"
  ON collaborations FOR SELECT
  USING (
    requester_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR partner_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated users can create collaboration requests
CREATE POLICY "Users can create collaborations"
  ON collaborations FOR INSERT
  WITH CHECK (
    requester_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Service role can do everything (used by backend)
CREATE POLICY "Service role full access collaborations"
  ON collaborations FOR ALL
  USING (true)
  WITH CHECK (true);

-- RPC function to atomically increment collaboration_count
CREATE OR REPLACE FUNCTION increment_collab_count(profile_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET collaboration_count = COALESCE(collaboration_count, 0) + 1,
      updated_at = NOW()
  WHERE id = profile_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

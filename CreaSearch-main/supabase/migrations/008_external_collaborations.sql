-- Migration: Support External Collaborations (Non-CreaSearch Users)
-- This allows admin to approve collaborations where one party is not on the platform.

-- Make partner_profile_id nullable for external collabs
ALTER TABLE collaborations ALTER COLUMN partner_profile_id DROP NOT NULL;

-- Drop the original no_self_collab constraint and re-add a conditional one
ALTER TABLE collaborations DROP CONSTRAINT IF EXISTS no_self_collab;
ALTER TABLE collaborations ADD CONSTRAINT no_self_collab 
  CHECK (partner_profile_id IS NULL OR requester_profile_id != partner_profile_id);

-- Add external partner columns
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS external_partner_name TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS external_partner_url TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE;

-- Add check: external collabs must have external_partner_name
ALTER TABLE collaborations ADD CONSTRAINT external_collab_has_name
  CHECK (
    (is_external = FALSE) OR 
    (is_external = TRUE AND external_partner_name IS NOT NULL AND external_partner_name != '')
  );

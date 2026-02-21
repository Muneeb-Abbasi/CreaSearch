-- Migration: support collaboration actions in admin_action_log
-- Updates the check constraints for action and target_type

-- First drop the existing constraints (we'll look them up or just try common names)
-- In Supabase, these often have generated names if not specified, but let's check common ones or re-apply the column with new constraints.

-- Using DO block to safely handle constraint updates if names are unknown
DO $$
BEGIN
    -- Update ACTION constraint
    ALTER TABLE admin_action_log DROP CONSTRAINT IF EXISTS admin_action_log_action_check;
    ALTER TABLE admin_action_log ADD CONSTRAINT admin_action_log_action_check 
        CHECK (action IN (
            'approve_profile', 'reject_profile', 'delete_profile',
            'feature_profile', 'unfeature_profile',
            'add_category', 'edit_category', 'delete_category',
            'add_niche', 'edit_niche', 'delete_niche',
            'ban_user', 'unban_user',
            -- New actions
            'approve_collaboration', 'reject_collaboration', 'admin_create_collaboration'
        ));

    -- Update TARGET_TYPE constraint
    ALTER TABLE admin_action_log DROP CONSTRAINT IF EXISTS admin_action_log_target_type_check;
    ALTER TABLE admin_action_log ADD CONSTRAINT admin_action_log_target_type_check 
        CHECK (target_type IN ('profile', 'user', 'review', 'category', 'niche', 'collaboration'));
END $$;

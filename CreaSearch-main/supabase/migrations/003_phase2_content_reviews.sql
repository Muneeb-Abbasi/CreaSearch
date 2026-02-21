-- ============================================
-- Phase 2: Content & Reviews Cleanup
-- Migration: 003_phase2_content_reviews.sql
-- ============================================

-- ============================================
-- 2.1 — PORTFOLIO ITEMS UPDATES
-- ============================================

-- Add media_type column
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'
    CHECK (media_type IN ('image', 'video', 'link'));

-- Add sort_order column
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Rename image_url → media_url
ALTER TABLE portfolio_items
  RENAME COLUMN image_url TO media_url;

-- ============================================
-- 2.2 — REVIEWS TABLE UPDATES
-- ============================================

-- Rename from_user_id → reviewer_user_id
ALTER TABLE reviews
  RENAME COLUMN from_user_id TO reviewer_user_id;

-- Drop existing FK to auth.users if it exists, then add FK to users table
-- (The column already references auth.users which shares the same IDs as users table)
-- We add an explicit FK to our app-level users table
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'reviews'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%from_user_id%'
  ) THEN
    ALTER TABLE reviews DROP CONSTRAINT reviews_from_user_id_fkey;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Constraint might have a different name, try alternate
  NULL;
END $$;

-- Add FK to users table
ALTER TABLE reviews
  ADD CONSTRAINT fk_reviews_reviewer
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id);

-- Add index on reviewer
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_user_id);

-- ============================================
-- 2.3 — REVIEW COUNT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_review_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET review_count = (
    SELECT COUNT(*) FROM reviews
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
  )
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before recreating
DROP TRIGGER IF EXISTS trg_update_review_count ON reviews;

CREATE TRIGGER trg_update_review_count
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_count();

-- ============================================
-- DONE
-- ============================================

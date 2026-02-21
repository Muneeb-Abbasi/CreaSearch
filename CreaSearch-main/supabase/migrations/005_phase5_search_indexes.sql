-- ============================================
-- Phase 5: Search & Discovery Enhancements
-- Migration: 005_phase5_search_indexes.sql
-- ============================================

-- Composite index for main search query (status + type + category + score)
CREATE INDEX IF NOT EXISTS idx_profiles_search_composite
  ON profiles(status, profile_type, category_id, creasearch_score DESC);

-- Location-based search
CREATE INDEX IF NOT EXISTS idx_profiles_location_search
  ON profiles(status, country, city);

-- Full-text search on name, title, bio
CREATE INDEX IF NOT EXISTS idx_profiles_text_search
  ON profiles USING gin(
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(title, '') || ' ' || COALESCE(bio, ''))
  );

-- ============================================
-- DONE
-- ============================================

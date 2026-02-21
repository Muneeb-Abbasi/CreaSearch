-- ============================================
-- Migration: 006_search_function.sql
-- Description: RPC function for full-text search
-- ============================================

-- Function: search_profiles
-- Description: Searches profiles using full-text search on name, title, and bio
-- Returns: SETOF profiles (allows chaining filters)
CREATE OR REPLACE FUNCTION search_profiles(query_text text)
RETURNS SETOF profiles
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM profiles
  WHERE to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(title, '') || ' ' || COALESCE(bio, '')) @@ plainto_tsquery('english', query_text);
$$;

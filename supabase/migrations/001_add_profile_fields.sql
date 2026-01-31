-- ============================================
-- MIGRATION: Add Industry, Niche, City, Country, Phone columns
-- Run this in Supabase SQL Editor
-- Date: January 30, 2026
-- ============================================

-- Add new columns with defaults for existing data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS niche TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_niche ON profiles(niche);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_city_country ON profiles(city, country);
CREATE INDEX IF NOT EXISTS idx_profiles_industry_niche ON profiles(industry, niche);

-- Migrate existing location data
-- Split "City, Country" format into separate fields
UPDATE profiles 
SET 
  city = TRIM(SPLIT_PART(location, ',', 1)),
  country = TRIM(SPLIT_PART(location, ',', 2))
WHERE location IS NOT NULL AND location LIKE '%,%' AND city = '';

-- For locations without comma, assume it's a city in Pakistan
UPDATE profiles 
SET 
  city = TRIM(location),
  country = 'Pakistan'
WHERE location IS NOT NULL AND location NOT LIKE '%,%' AND city = '' AND location != '';

-- Verify migration
SELECT id, name, location, city, country, industry, niche, phone 
FROM profiles 
LIMIT 10;

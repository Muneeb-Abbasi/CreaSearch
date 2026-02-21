-- ============================================
-- MIGRATION 002: Database Redesign Phase 1 - Core Foundation
-- Run this in Supabase SQL Editor
-- Date: February 11, 2026
-- ============================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1.1 USERS TABLE (NEW)
-- App-level user data, syncs with auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Populate users table from existing auth.users
INSERT INTO users (id, email, full_name, avatar_url, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''),
  COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', ''),
  'user',
  au.created_at
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- Auto-create user record on signup via trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 1.2 CATEGORIES TABLE (NEW)
-- Predefined industries managed by admin
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Technology', 'technology', 1),
  ('Fashion & Beauty', 'fashion-beauty', 2),
  ('Food & Cooking', 'food-cooking', 3),
  ('Gaming', 'gaming', 4),
  ('Education & Learning', 'education-learning', 5),
  ('Entertainment & Comedy', 'entertainment-comedy', 6),
  ('Health & Fitness', 'health-fitness', 7),
  ('Travel & Adventure', 'travel-adventure', 8),
  ('Music & Dance', 'music-dance', 9),
  ('Photography & Videography', 'photography-videography', 10),
  ('Business & Finance', 'business-finance', 11),
  ('Lifestyle & Vlogs', 'lifestyle-vlogs', 12),
  ('Sports & Athletics', 'sports-athletics', 13),
  ('Auto & Vehicles', 'auto-vehicles', 14),
  ('Art & Design', 'art-design', 15),
  ('Parenting & Family', 'parenting-family', 16),
  ('Motivation & Self-Help', 'motivation-self-help', 17),
  ('News & Current Affairs', 'news-current-affairs', 18),
  ('Real Estate & Property', 'real-estate-property', 19),
  ('DIY & Crafts', 'diy-crafts', 20),
  ('Pets & Animals', 'pets-animals', 21),
  ('Islamic & Religious Content', 'islamic-religious', 22),
  ('Reviews & Unboxing', 'reviews-unboxing', 23),
  ('Digital Marketing & Social Media', 'digital-marketing', 24),
  ('Freelancing & Career', 'freelancing-career', 25),
  ('Other', 'other', 99)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 1.3 NICHES TABLE (NEW)
-- Sub-categories linked to parent category
-- ============================================
CREATE TABLE IF NOT EXISTS niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_niches_category ON niches(category_id);

-- Technology
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Software Reviews', 'software-reviews', 1 FROM categories WHERE slug = 'technology'
UNION ALL SELECT id, 'AI & Machine Learning', 'ai-ml', 2 FROM categories WHERE slug = 'technology'
UNION ALL SELECT id, 'Web Development', 'web-development', 3 FROM categories WHERE slug = 'technology'
UNION ALL SELECT id, 'Mobile Apps', 'mobile-apps', 4 FROM categories WHERE slug = 'technology'
UNION ALL SELECT id, 'Gadget Reviews', 'gadget-reviews', 5 FROM categories WHERE slug = 'technology'
UNION ALL SELECT id, 'Coding Tutorials', 'coding-tutorials', 6 FROM categories WHERE slug = 'technology'
UNION ALL SELECT id, 'Cybersecurity', 'cybersecurity', 7 FROM categories WHERE slug = 'technology'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Fashion & Beauty
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Makeup & Skincare', 'makeup-skincare', 1 FROM categories WHERE slug = 'fashion-beauty'
UNION ALL SELECT id, 'Street Fashion', 'street-fashion', 2 FROM categories WHERE slug = 'fashion-beauty'
UNION ALL SELECT id, 'Luxury Brands', 'luxury-brands', 3 FROM categories WHERE slug = 'fashion-beauty'
UNION ALL SELECT id, 'Hijab & Modest Fashion', 'hijab-modest-fashion', 4 FROM categories WHERE slug = 'fashion-beauty'
UNION ALL SELECT id, 'Nail Art', 'nail-art', 5 FROM categories WHERE slug = 'fashion-beauty'
UNION ALL SELECT id, 'Hair Care & Styling', 'hair-care-styling', 6 FROM categories WHERE slug = 'fashion-beauty'
UNION ALL SELECT id, 'Men''s Grooming', 'mens-grooming', 7 FROM categories WHERE slug = 'fashion-beauty'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Food & Cooking
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Pakistani Recipes', 'pakistani-recipes', 1 FROM categories WHERE slug = 'food-cooking'
UNION ALL SELECT id, 'Street Food Reviews', 'street-food-reviews', 2 FROM categories WHERE slug = 'food-cooking'
UNION ALL SELECT id, 'Baking & Desserts', 'baking-desserts', 3 FROM categories WHERE slug = 'food-cooking'
UNION ALL SELECT id, 'Healthy Eating', 'healthy-eating', 4 FROM categories WHERE slug = 'food-cooking'
UNION ALL SELECT id, 'Restaurant Reviews', 'restaurant-reviews', 5 FROM categories WHERE slug = 'food-cooking'
UNION ALL SELECT id, 'Food Photography', 'food-photography', 6 FROM categories WHERE slug = 'food-cooking'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Gaming
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Mobile Gaming', 'mobile-gaming', 1 FROM categories WHERE slug = 'gaming'
UNION ALL SELECT id, 'PC Gaming', 'pc-gaming', 2 FROM categories WHERE slug = 'gaming'
UNION ALL SELECT id, 'Console Gaming', 'console-gaming', 3 FROM categories WHERE slug = 'gaming'
UNION ALL SELECT id, 'Game Reviews', 'game-reviews', 4 FROM categories WHERE slug = 'gaming'
UNION ALL SELECT id, 'Esports', 'esports', 5 FROM categories WHERE slug = 'gaming'
UNION ALL SELECT id, 'Streaming & Let''s Play', 'streaming-lets-play', 6 FROM categories WHERE slug = 'gaming'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Education & Learning
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Study Tips & Hacks', 'study-tips', 1 FROM categories WHERE slug = 'education-learning'
UNION ALL SELECT id, 'Language Learning', 'language-learning', 2 FROM categories WHERE slug = 'education-learning'
UNION ALL SELECT id, 'Science & Math', 'science-math', 3 FROM categories WHERE slug = 'education-learning'
UNION ALL SELECT id, 'Online Courses', 'online-courses', 4 FROM categories WHERE slug = 'education-learning'
UNION ALL SELECT id, 'Board Exam Prep', 'board-exam-prep', 5 FROM categories WHERE slug = 'education-learning'
UNION ALL SELECT id, 'University Life', 'university-life', 6 FROM categories WHERE slug = 'education-learning'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Entertainment & Comedy
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Comedy Sketches', 'comedy-sketches', 1 FROM categories WHERE slug = 'entertainment-comedy'
UNION ALL SELECT id, 'Roasting & Commentary', 'roasting-commentary', 2 FROM categories WHERE slug = 'entertainment-comedy'
UNION ALL SELECT id, 'Drama & Film Reviews', 'drama-film-reviews', 3 FROM categories WHERE slug = 'entertainment-comedy'
UNION ALL SELECT id, 'Memes & Trending', 'memes-trending', 4 FROM categories WHERE slug = 'entertainment-comedy'
UNION ALL SELECT id, 'Podcasting', 'podcasting', 5 FROM categories WHERE slug = 'entertainment-comedy'
UNION ALL SELECT id, 'Celebrity News', 'celebrity-news', 6 FROM categories WHERE slug = 'entertainment-comedy'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Health & Fitness
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Gym & Workout', 'gym-workout', 1 FROM categories WHERE slug = 'health-fitness'
UNION ALL SELECT id, 'Yoga & Meditation', 'yoga-meditation', 2 FROM categories WHERE slug = 'health-fitness'
UNION ALL SELECT id, 'Nutrition & Diet', 'nutrition-diet', 3 FROM categories WHERE slug = 'health-fitness'
UNION ALL SELECT id, 'Mental Health', 'mental-health', 4 FROM categories WHERE slug = 'health-fitness'
UNION ALL SELECT id, 'Home Workouts', 'home-workouts', 5 FROM categories WHERE slug = 'health-fitness'
UNION ALL SELECT id, 'Weight Loss', 'weight-loss', 6 FROM categories WHERE slug = 'health-fitness'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Travel & Adventure
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Pakistan Tourism', 'pakistan-tourism', 1 FROM categories WHERE slug = 'travel-adventure'
UNION ALL SELECT id, 'International Travel', 'international-travel', 2 FROM categories WHERE slug = 'travel-adventure'
UNION ALL SELECT id, 'Budget Travel', 'budget-travel', 3 FROM categories WHERE slug = 'travel-adventure'
UNION ALL SELECT id, 'Hiking & Trekking', 'hiking-trekking', 4 FROM categories WHERE slug = 'travel-adventure'
UNION ALL SELECT id, 'Hotel & Resort Reviews', 'hotel-resort-reviews', 5 FROM categories WHERE slug = 'travel-adventure'
UNION ALL SELECT id, 'Road Trips', 'road-trips', 6 FROM categories WHERE slug = 'travel-adventure'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Music & Dance
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Singing & Vocals', 'singing-vocals', 1 FROM categories WHERE slug = 'music-dance'
UNION ALL SELECT id, 'Music Production', 'music-production', 2 FROM categories WHERE slug = 'music-dance'
UNION ALL SELECT id, 'Instrument Tutorials', 'instrument-tutorials', 3 FROM categories WHERE slug = 'music-dance'
UNION ALL SELECT id, 'Dance Choreography', 'dance-choreography', 4 FROM categories WHERE slug = 'music-dance'
UNION ALL SELECT id, 'Music Reviews', 'music-reviews', 5 FROM categories WHERE slug = 'music-dance'
UNION ALL SELECT id, 'DJ & Remixes', 'dj-remixes', 6 FROM categories WHERE slug = 'music-dance'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Photography & Videography
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Portrait Photography', 'portrait-photography', 1 FROM categories WHERE slug = 'photography-videography'
UNION ALL SELECT id, 'Wedding Photography', 'wedding-photography', 2 FROM categories WHERE slug = 'photography-videography'
UNION ALL SELECT id, 'Drone Videography', 'drone-videography', 3 FROM categories WHERE slug = 'photography-videography'
UNION ALL SELECT id, 'Editing Tutorials', 'editing-tutorials', 4 FROM categories WHERE slug = 'photography-videography'
UNION ALL SELECT id, 'Filmmaking', 'filmmaking', 5 FROM categories WHERE slug = 'photography-videography'
UNION ALL SELECT id, 'Camera Reviews', 'camera-reviews', 6 FROM categories WHERE slug = 'photography-videography'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Business & Finance
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Investing & Stock Market', 'investing-stock-market', 1 FROM categories WHERE slug = 'business-finance'
UNION ALL SELECT id, 'Cryptocurrency', 'cryptocurrency', 2 FROM categories WHERE slug = 'business-finance'
UNION ALL SELECT id, 'Entrepreneurship', 'entrepreneurship', 3 FROM categories WHERE slug = 'business-finance'
UNION ALL SELECT id, 'Personal Finance', 'personal-finance', 4 FROM categories WHERE slug = 'business-finance'
UNION ALL SELECT id, 'E-Commerce & Dropshipping', 'ecommerce-dropshipping', 5 FROM categories WHERE slug = 'business-finance'
UNION ALL SELECT id, 'Startups', 'startups', 6 FROM categories WHERE slug = 'business-finance'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Lifestyle & Vlogs
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Daily Vlogs', 'daily-vlogs', 1 FROM categories WHERE slug = 'lifestyle-vlogs'
UNION ALL SELECT id, 'Minimalism', 'minimalism', 2 FROM categories WHERE slug = 'lifestyle-vlogs'
UNION ALL SELECT id, 'Home Decor', 'home-decor', 3 FROM categories WHERE slug = 'lifestyle-vlogs'
UNION ALL SELECT id, 'Productivity', 'productivity', 4 FROM categories WHERE slug = 'lifestyle-vlogs'
UNION ALL SELECT id, 'Day In My Life', 'day-in-my-life', 5 FROM categories WHERE slug = 'lifestyle-vlogs'
UNION ALL SELECT id, 'Couple & Relationship', 'couple-relationship', 6 FROM categories WHERE slug = 'lifestyle-vlogs'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Sports & Athletics
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Cricket', 'cricket', 1 FROM categories WHERE slug = 'sports-athletics'
UNION ALL SELECT id, 'Football', 'football', 2 FROM categories WHERE slug = 'sports-athletics'
UNION ALL SELECT id, 'Bodybuilding', 'bodybuilding', 3 FROM categories WHERE slug = 'sports-athletics'
UNION ALL SELECT id, 'MMA & Boxing', 'mma-boxing', 4 FROM categories WHERE slug = 'sports-athletics'
UNION ALL SELECT id, 'Sports Commentary', 'sports-commentary', 5 FROM categories WHERE slug = 'sports-athletics'
UNION ALL SELECT id, 'Outdoor Sports', 'outdoor-sports', 6 FROM categories WHERE slug = 'sports-athletics'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Auto & Vehicles
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Car Reviews', 'car-reviews', 1 FROM categories WHERE slug = 'auto-vehicles'
UNION ALL SELECT id, 'Bike & Motorcycle', 'bike-motorcycle', 2 FROM categories WHERE slug = 'auto-vehicles'
UNION ALL SELECT id, 'Auto Detailing', 'auto-detailing', 3 FROM categories WHERE slug = 'auto-vehicles'
UNION ALL SELECT id, 'Modified Cars', 'modified-cars', 4 FROM categories WHERE slug = 'auto-vehicles'
UNION ALL SELECT id, 'Electric Vehicles', 'electric-vehicles', 5 FROM categories WHERE slug = 'auto-vehicles'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Art & Design
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Digital Art', 'digital-art', 1 FROM categories WHERE slug = 'art-design'
UNION ALL SELECT id, 'Graphic Design', 'graphic-design', 2 FROM categories WHERE slug = 'art-design'
UNION ALL SELECT id, 'UI/UX Design', 'ui-ux-design', 3 FROM categories WHERE slug = 'art-design'
UNION ALL SELECT id, 'Calligraphy', 'calligraphy', 4 FROM categories WHERE slug = 'art-design'
UNION ALL SELECT id, 'Painting & Drawing', 'painting-drawing', 5 FROM categories WHERE slug = 'art-design'
UNION ALL SELECT id, 'Animation & Motion', 'animation-motion', 6 FROM categories WHERE slug = 'art-design'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Parenting & Family
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Mom Life', 'mom-life', 1 FROM categories WHERE slug = 'parenting-family'
UNION ALL SELECT id, 'Baby Care', 'baby-care', 2 FROM categories WHERE slug = 'parenting-family'
UNION ALL SELECT id, 'Kids Activities', 'kids-activities', 3 FROM categories WHERE slug = 'parenting-family'
UNION ALL SELECT id, 'Family Vlogs', 'family-vlogs', 4 FROM categories WHERE slug = 'parenting-family'
UNION ALL SELECT id, 'Pregnancy & Maternity', 'pregnancy-maternity', 5 FROM categories WHERE slug = 'parenting-family'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Motivation & Self-Help
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Personal Development', 'personal-development', 1 FROM categories WHERE slug = 'motivation-self-help'
UNION ALL SELECT id, 'Public Speaking', 'public-speaking', 2 FROM categories WHERE slug = 'motivation-self-help'
UNION ALL SELECT id, 'Life Coaching', 'life-coaching', 3 FROM categories WHERE slug = 'motivation-self-help'
UNION ALL SELECT id, 'Book Reviews', 'book-reviews', 4 FROM categories WHERE slug = 'motivation-self-help'
UNION ALL SELECT id, 'Success Stories', 'success-stories', 5 FROM categories WHERE slug = 'motivation-self-help'
ON CONFLICT (category_id, slug) DO NOTHING;

-- News & Current Affairs
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Political Commentary', 'political-commentary', 1 FROM categories WHERE slug = 'news-current-affairs'
UNION ALL SELECT id, 'Tech News', 'tech-news', 2 FROM categories WHERE slug = 'news-current-affairs'
UNION ALL SELECT id, 'Business News', 'business-news', 3 FROM categories WHERE slug = 'news-current-affairs'
UNION ALL SELECT id, 'Social Issues', 'social-issues', 4 FROM categories WHERE slug = 'news-current-affairs'
UNION ALL SELECT id, 'Investigative Journalism', 'investigative-journalism', 5 FROM categories WHERE slug = 'news-current-affairs'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Real Estate & Property
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Property Vlogs', 'property-vlogs', 1 FROM categories WHERE slug = 'real-estate-property'
UNION ALL SELECT id, 'Home Tours', 'home-tours', 2 FROM categories WHERE slug = 'real-estate-property'
UNION ALL SELECT id, 'Investment Tips', 'investment-tips', 3 FROM categories WHERE slug = 'real-estate-property'
UNION ALL SELECT id, 'Construction & Architecture', 'construction-architecture', 4 FROM categories WHERE slug = 'real-estate-property'
ON CONFLICT (category_id, slug) DO NOTHING;

-- DIY & Crafts
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Home DIY Projects', 'home-diy-projects', 1 FROM categories WHERE slug = 'diy-crafts'
UNION ALL SELECT id, 'Sewing & Stitching', 'sewing-stitching', 2 FROM categories WHERE slug = 'diy-crafts'
UNION ALL SELECT id, 'Woodworking', 'woodworking', 3 FROM categories WHERE slug = 'diy-crafts'
UNION ALL SELECT id, 'Paper Crafts', 'paper-crafts', 4 FROM categories WHERE slug = 'diy-crafts'
UNION ALL SELECT id, 'Upcycling & Recycling', 'upcycling-recycling', 5 FROM categories WHERE slug = 'diy-crafts'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Pets & Animals
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Dog Content', 'dog-content', 1 FROM categories WHERE slug = 'pets-animals'
UNION ALL SELECT id, 'Cat Content', 'cat-content', 2 FROM categories WHERE slug = 'pets-animals'
UNION ALL SELECT id, 'Bird Keeping', 'bird-keeping', 3 FROM categories WHERE slug = 'pets-animals'
UNION ALL SELECT id, 'Pet Care Tips', 'pet-care-tips', 4 FROM categories WHERE slug = 'pets-animals'
UNION ALL SELECT id, 'Aquarium & Fish', 'aquarium-fish', 5 FROM categories WHERE slug = 'pets-animals'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Islamic & Religious Content
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Quran Recitation', 'quran-recitation', 1 FROM categories WHERE slug = 'islamic-religious'
UNION ALL SELECT id, 'Islamic Lectures', 'islamic-lectures', 2 FROM categories WHERE slug = 'islamic-religious'
UNION ALL SELECT id, 'Deen & Lifestyle', 'deen-lifestyle', 3 FROM categories WHERE slug = 'islamic-religious'
UNION ALL SELECT id, 'Nasheed & Hamd', 'nasheed-hamd', 4 FROM categories WHERE slug = 'islamic-religious'
UNION ALL SELECT id, 'Ramadan Content', 'ramadan-content', 5 FROM categories WHERE slug = 'islamic-religious'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Reviews & Unboxing
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Product Unboxing', 'product-unboxing', 1 FROM categories WHERE slug = 'reviews-unboxing'
UNION ALL SELECT id, 'Tech Unboxing', 'tech-unboxing', 2 FROM categories WHERE slug = 'reviews-unboxing'
UNION ALL SELECT id, 'Honest Reviews', 'honest-reviews', 3 FROM categories WHERE slug = 'reviews-unboxing'
UNION ALL SELECT id, 'Comparison Videos', 'comparison-videos', 4 FROM categories WHERE slug = 'reviews-unboxing'
UNION ALL SELECT id, 'Subscription Box Reviews', 'subscription-box', 5 FROM categories WHERE slug = 'reviews-unboxing'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Digital Marketing & Social Media
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Instagram Growth', 'instagram-growth', 1 FROM categories WHERE slug = 'digital-marketing'
UNION ALL SELECT id, 'YouTube Strategy', 'youtube-strategy', 2 FROM categories WHERE slug = 'digital-marketing'
UNION ALL SELECT id, 'SEO & Content Marketing', 'seo-content-marketing', 3 FROM categories WHERE slug = 'digital-marketing'
UNION ALL SELECT id, 'Email Marketing', 'email-marketing', 4 FROM categories WHERE slug = 'digital-marketing'
UNION ALL SELECT id, 'TikTok Growth', 'tiktok-growth', 5 FROM categories WHERE slug = 'digital-marketing'
UNION ALL SELECT id, 'Brand Collaborations', 'brand-collaborations', 6 FROM categories WHERE slug = 'digital-marketing'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Freelancing & Career
INSERT INTO niches (category_id, name, slug, sort_order)
SELECT id, 'Upwork & Fiverr Tips', 'upwork-fiverr-tips', 1 FROM categories WHERE slug = 'freelancing-career'
UNION ALL SELECT id, 'Resume & Interview', 'resume-interview', 2 FROM categories WHERE slug = 'freelancing-career'
UNION ALL SELECT id, 'Remote Work', 'remote-work', 3 FROM categories WHERE slug = 'freelancing-career'
UNION ALL SELECT id, 'Side Hustle Ideas', 'side-hustle-ideas', 4 FROM categories WHERE slug = 'freelancing-career'
UNION ALL SELECT id, 'Skill Development', 'skill-development', 5 FROM categories WHERE slug = 'freelancing-career'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ============================================
-- 1.4 PROFILES TABLE (REDESIGN)
-- Add new columns, migrate data, drop old ones
-- ============================================

-- Step 1: Add new columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'creator'
    CHECK (profile_type IN ('creator', 'organization')),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS niche_id UUID REFERENCES niches(id),
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Step 2: Migrate existing data
-- Copy role → profile_type
UPDATE profiles SET profile_type = role WHERE role IS NOT NULL;

-- Step 3: Map existing freetext industry → category_id (best effort)
UPDATE profiles p
SET category_id = c.id
FROM categories c
WHERE LOWER(p.industry) = LOWER(c.name)
  AND p.industry IS NOT NULL
  AND p.industry != ''
  AND p.category_id IS NULL;

-- Step 4: Map existing freetext niche → niche_id (best effort)
UPDATE profiles p
SET niche_id = n.id
FROM niches n
WHERE LOWER(p.niche) = LOWER(n.name)
  AND p.niche IS NOT NULL
  AND p.niche != ''
  AND p.niche_id IS NULL;

-- Step 5: Enforce one creator + one org profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_type
  ON profiles(user_id, profile_type);

-- Step 6: New indexes
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_profiles_niche ON profiles(niche_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_score ON profiles(creasearch_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating_score DESC);

-- Step 7: Drop deprecated columns (AFTER data migration)
-- NOTE: Run these ONLY after verifying data migration is correct
-- ALTER TABLE profiles DROP COLUMN IF EXISTS role;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS location;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS social_links;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS verified_socials;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS gigs_completed;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS industry;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS niche;

-- ============================================
-- 1.5 SOCIAL_ACCOUNTS TABLE (NEW)
-- Replaces social_links JSONB
-- ============================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN (
    'youtube', 'instagram', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other'
  )),
  platform_url TEXT NOT NULL,
  platform_username TEXT,
  platform_user_id TEXT,
  verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  display_name TEXT,
  raw_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_profile ON social_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_social_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_status ON social_accounts(verification_status);

-- ============================================
-- 1.6 MIGRATE social_links JSONB → social_accounts
-- ============================================

-- Migrate YouTube data
INSERT INTO social_accounts (profile_id, platform, platform_url, platform_username, platform_user_id, verification_status, follower_count, display_name, raw_data, verified_at, last_refreshed_at)
SELECT
  p.id,
  'youtube',
  COALESCE(p.social_links->'youtube'->>'url', p.social_links->>'youtube', ''),
  p.social_links->'youtube'->>'channelTitle',
  p.social_links->'youtube'->>'channelId',
  CASE
    WHEN p.social_links->'youtube'->>'status' = 'VERIFIED' THEN 'verified'
    WHEN p.social_links->'youtube'->>'status' = 'PENDING' THEN 'pending'
    ELSE 'unverified'
  END,
  COALESCE((p.social_links->'youtube'->>'subscribers')::integer, 0),
  p.social_links->'youtube'->>'channelTitle',
  COALESCE(p.social_links->'youtube', '{}')::jsonb,
  CASE WHEN p.social_links->'youtube'->>'status' = 'VERIFIED' THEN NOW() ELSE NULL END,
  CASE WHEN p.social_links->'youtube'->>'lastUpdated' IS NOT NULL
    THEN (p.social_links->'youtube'->>'lastUpdated')::timestamptz ELSE NULL END
FROM profiles p
WHERE p.social_links->'youtube' IS NOT NULL
  AND p.social_links->>'youtube' IS NOT NULL
  AND p.social_links->>'youtube' != ''
ON CONFLICT (profile_id, platform) DO NOTHING;

-- Migrate Instagram data
INSERT INTO social_accounts (profile_id, platform, platform_url, platform_username, platform_user_id, verification_status, follower_count, following_count, post_count, display_name, raw_data, verified_at, last_refreshed_at)
SELECT
  p.id,
  'instagram',
  COALESCE(p.social_links->'instagram'->>'url', p.social_links->>'instagram', ''),
  p.social_links->'instagram'->>'username',
  NULL,
  CASE
    WHEN p.social_links->'instagram'->>'status' = 'VALIDATED' THEN 'verified'
    WHEN p.social_links->'instagram'->>'status' = 'PENDING' THEN 'pending'
    ELSE 'unverified'
  END,
  COALESCE((p.social_links->'instagram'->>'followers')::integer, 0),
  COALESCE((p.social_links->'instagram'->>'following')::integer, 0),
  COALESCE((p.social_links->'instagram'->>'posts')::integer, 0),
  p.social_links->'instagram'->>'fullName',
  COALESCE(p.social_links->'instagram', '{}')::jsonb,
  CASE WHEN p.social_links->'instagram'->>'status' = 'VALIDATED' THEN NOW() ELSE NULL END,
  CASE WHEN p.social_links->'instagram'->>'lastUpdated' IS NOT NULL
    THEN (p.social_links->'instagram'->>'lastUpdated')::timestamptz ELSE NULL END
FROM profiles p
WHERE p.social_links->'instagram' IS NOT NULL
  AND p.social_links->>'instagram' IS NOT NULL
  AND p.social_links->>'instagram' != ''
ON CONFLICT (profile_id, platform) DO NOTHING;

-- Migrate other social links (linkedin, twitter, tiktok, facebook) as unverified URLs
INSERT INTO social_accounts (profile_id, platform, platform_url, verification_status)
SELECT p.id, 'linkedin', p.social_links->>'linkedin', 'unverified'
FROM profiles p
WHERE p.social_links->>'linkedin' IS NOT NULL AND p.social_links->>'linkedin' != ''
ON CONFLICT (profile_id, platform) DO NOTHING;

INSERT INTO social_accounts (profile_id, platform, platform_url, verification_status)
SELECT p.id, 'twitter', p.social_links->>'twitter', 'unverified'
FROM profiles p
WHERE p.social_links->>'twitter' IS NOT NULL AND p.social_links->>'twitter' != ''
ON CONFLICT (profile_id, platform) DO NOTHING;

INSERT INTO social_accounts (profile_id, platform, platform_url, verification_status)
SELECT p.id, 'tiktok', p.social_links->>'tiktok', 'unverified'
FROM profiles p
WHERE p.social_links->>'tiktok' IS NOT NULL AND p.social_links->>'tiktok' != ''
ON CONFLICT (profile_id, platform) DO NOTHING;

INSERT INTO social_accounts (profile_id, platform, platform_url, verification_status)
SELECT p.id, 'facebook', p.social_links->>'facebook', 'unverified'
FROM profiles p
WHERE p.social_links->>'facebook' IS NOT NULL AND p.social_links->>'facebook' != ''
ON CONFLICT (profile_id, platform) DO NOTHING;

-- ============================================
-- 1.7 FOLLOWER TOTAL TRIGGER
-- Auto-update profiles.follower_total from social_accounts
-- ============================================
CREATE OR REPLACE FUNCTION update_follower_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET follower_total = (
    SELECT COALESCE(SUM(follower_count), 0)
    FROM social_accounts
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
      AND verification_status = 'verified'
  )
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_follower_total ON social_accounts;
CREATE TRIGGER trg_update_follower_total
  AFTER INSERT OR UPDATE OR DELETE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_follower_total();

-- Recalculate follower_total for existing profiles
UPDATE profiles p
SET follower_total = COALESCE((
  SELECT SUM(sa.follower_count)
  FROM social_accounts sa
  WHERE sa.profile_id = p.id AND sa.verification_status = 'verified'
), 0);

-- ============================================
-- 1.8 RLS FOR NEW TABLES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Users: read own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Categories: public read
CREATE POLICY "Public can read categories" ON categories
  FOR SELECT USING (true);

-- Niches: public read
CREATE POLICY "Public can read niches" ON niches
  FOR SELECT USING (true);

-- Social Accounts: public read for approved profiles
CREATE POLICY "Public can read social accounts of approved profiles" ON social_accounts
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE status = 'approved')
  );

-- Social Accounts: owners manage own
CREATE POLICY "Users can manage own social accounts" ON social_accounts
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- VERIFICATION QUERIES
-- Run these after migration to verify data
-- ============================================

-- Check users table created and populated
-- SELECT COUNT(*) as user_count FROM users;

-- Check categories seeded
-- SELECT COUNT(*) as category_count FROM categories;

-- Check niches seeded
-- SELECT name, COUNT(n.id) as niche_count FROM categories c LEFT JOIN niches n ON n.category_id = c.id GROUP BY c.name ORDER BY c.sort_order;

-- Check social_accounts migration
-- SELECT platform, COUNT(*) as count, COUNT(*) FILTER (WHERE verification_status = 'verified') as verified FROM social_accounts GROUP BY platform;

-- Check profiles have new columns
-- SELECT id, name, profile_type, category_id, niche_id FROM profiles LIMIT 10;

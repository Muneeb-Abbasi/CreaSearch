# Quick Start Commands

## 1. Database Migration

**Using Supabase Dashboard:**
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Copy contents from `supabase/schema.sql`
3. Paste and Run in SQL Editor

**Or using SQL directly:**
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS niche TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_niche ON profiles(niche);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_city_country ON profiles(city, country);
CREATE INDEX IF NOT EXISTS idx_profiles_industry_niche ON profiles(industry, niche);
```

## 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

## 3. Run Project

**Option A: Using Scripts**

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
start.bat
```

**Option B: Manual**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Environment Variables Required

**backend/.env:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5000
RESEND_API_KEY=your_resend_key
```

**frontend/.env:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```

## Access Points

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

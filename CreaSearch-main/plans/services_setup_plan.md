# Supabase & External Services Reset Plan

Fresh setup guide for Supabase, Google Cloud, Apify, and Resend.

---

## 1. Supabase Setup

### Step 1: Create New Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Name**: `creasearch-prod`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Pick closest to Pakistan (Singapore recommended)
4. Wait for project to initialize

### Step 2: Get API Keys
1. In your project dashboard, click the **gear icon** (Settings) in left sidebar
2. Click **API** under "Project Settings"
3. You'll see:
   - **Project URL** (under "Project URL" section) → `SUPABASE_URL` / `VITE_SUPABASE_URL`
     - Example: `https://abcdefghijkl.supabase.co`
   - **anon public** (under "Project API keys") → `VITE_SUPABASE_ANON_KEY`
   - **service_role** (click "Reveal" to show) → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRET)

> **Screenshot path**: Settings (gear icon) → API → All keys are on this single page

### Step 3: Setup Database Schema
1. Go to **SQL Editor**
2. Run schema from: `supabase/schema.sql`
3. Verify tables created: `profiles`, `reviews`

### Step 4: Configure Storage
1. Go to **Storage**
2. Create bucket: `profile-photos` (public)
3. Create bucket: `video-intros` (public)
4. Add policies for authenticated uploads

### Step 5: Configure Google OAuth in Supabase
1. Go to **Authentication → Providers → Google**
2. Toggle **Enable**
3. Add Client ID and Secret (from Google Cloud below)
4. Go to **Authentication → URL Configuration**
5. Set **Site URL**: `https://your-vercel-app.vercel.app`
6. Add **Redirect URLs**:
   - `https://your-vercel-app.vercel.app`
   - `http://localhost:5173` (dev)

---

## 2. Google Cloud Setup

### Step 1: Create OAuth Credentials
1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials → OAuth client ID**
3. Select **Web application**
4. Name: `Creasearch Web`
5. **Authorized JavaScript Origins**:
   - `http://localhost:5173`
   - `https://your-vercel-app.vercel.app`
   - `https://YOUR_SUPABASE_REF.supabase.co`
6. **Authorized Redirect URIs**:
   - `https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback`
7. Click **Create**
8. Copy:
   - **Client ID** → `GOOGLE_OAUTH_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_OAUTH_CLIENT_SECRET`

### Step 2: Enable YouTube Data API
1. Go to **APIs & Services → Library**
2. Search "YouTube Data API v3"
3. Click **Enable**
4. Go to **Credentials → Create Credentials → API Key**
5. Copy → `YOUTUBE_API_KEY`
6. Optional: Restrict to YouTube Data API only

---

## 3. Apify Setup

1. Go to [console.apify.com](https://console.apify.com)
2. Create account (free tier: 100 actors/month)
3. Go to **Account → Integrations**
4. Copy **Personal API token** → `APIFY_TOKEN`

---

## 4. Resend Setup

1. Go to [resend.com](https://resend.com)
2. Create account
3. Go to **API Keys → Create API Key**
4. Name: `creasearch-prod`
5. Copy → `RESEND_API_KEY`
6. Add verified domain (optional but recommended)

---

## 5. Update Environment Files

### Root `.env` (for reference only, don't commit)
```env
# Supabase
VITE_SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...new_anon_key
SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...new_service_key

# Google
VITE_GOOGLE_CLIENT_ID=new-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_ID=new-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-new-secret
YOUTUBE_API_KEY=AIzaSy...new_key

# Apify
APIFY_TOKEN=apify_api_new_token

# Resend
RESEND_API_KEY=re_new_key

# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-app.vercel.app
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api
```

### backend/.env
Copy relevant backend keys (SUPABASE_SERVICE_ROLE_KEY, YOUTUBE_API_KEY, APIFY_TOKEN, RESEND_API_KEY, etc.)

---

## 6. Update Deployment Platforms

### Vercel (Frontend)
Add/update environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_BASE_URL`

### Railway (Backend)
Add/update environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`
- `APIFY_TOKEN`
- `RESEND_API_KEY`
- `CORS_ORIGIN`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

---

## 7. Verification Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Storage buckets created
- [ ] Google OAuth configured in Supabase
- [ ] Google Cloud OAuth credentials created
- [ ] YouTube API enabled and key generated
- [ ] Apify token generated
- [ ] Resend API key generated
- [ ] All `.env` files updated
- [ ] Vercel env vars updated
- [ ] Railway env vars updated
- [ ] Test Google login works
- [ ] Test API calls work

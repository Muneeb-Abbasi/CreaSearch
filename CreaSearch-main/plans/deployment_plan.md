# Deployment Plan: Vercel (Frontend + Backend)

## Architecture Overview
```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────┐
│  Vercel Project 1      │     │  Vercel Project 2      │     │   Supabase     │
│  Frontend (/frontend)  │────▶│  Backend (/backend)    │────▶│   (External)   │
└────────────────────────┘     └────────────────────────┘     └────────────────┘
```

---

## Phase 1: Deploy Backend (Vercel Project 1)

### 1.1 Create Backend Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Set **Root Directory**: `backend`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: `npm install`

### 1.2 Add Backend Environment Variables
In Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `YOUTUBE_API_KEY` | Your YouTube API key |
| `APIFY_TOKEN` | Your Apify token |
| `RESEND_API_KEY` | Your Resend key |
| `GOOGLE_OAUTH_CLIENT_ID` | Your Google client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Your Google client secret |
| `CORS_ORIGIN` | `https://frontend-project.vercel.app` (update after frontend deploy) |

### 1.3 Create backend/vercel.json
```json
{
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

### 1.4 Deploy
1. Click **Deploy**
2. **Copy Backend URL**: `https://backend-project.vercel.app`

---

## Phase 2: Deploy Frontend (Vercel Project 2)

### 2.1 Create Frontend Vercel Project
1. Click **Add New → Project**
2. Import the SAME repository
3. Set **Root Directory**: `frontend`
4. Framework: Vite (auto-detected)

### 2.2 Add Frontend Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_GOOGLE_CLIENT_ID` | Your Google client ID |
| `VITE_API_BASE_URL` | `https://backend-project.vercel.app/api` |

### 2.3 Deploy
1. Click **Deploy**
2. **Copy Frontend URL**: `https://frontend-project.vercel.app`

---

## Phase 3: Post-Deployment Updates

### 3.1 Update Backend CORS
Go to Backend Vercel project → Settings → Environment Variables:
```
CORS_ORIGIN = https://your-frontend.vercel.app
```
Then **redeploy** the backend.

### 3.2 Update Supabase
1. Authentication → URL Configuration
2. **Site URL**: `https://your-frontend.vercel.app`
3. **Redirect URLs**: Add `https://your-frontend.vercel.app`

### 3.3 Update Google Cloud Console
Add to **Authorized JavaScript origins**:
- `https://your-frontend.vercel.app`

---

## Verification Checklist

- [ ] Backend deployed and accessible at `/health`
- [ ] Frontend deployed and loads
- [ ] Google login works
- [ ] API calls work (no CORS errors)
- [ ] Profile creation works
- [ ] Search page shows profiles

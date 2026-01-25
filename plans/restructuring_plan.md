
# ✅ Final Deployment & Restructuring Plan

**(Frontend: Vercel | Backend: Railway | DB/Auth/Storage: Supabase | Domain: Hostinger)**

---

## 1. Target Architecture (Non-negotiable)

```
User
 ↓
creasearch.com          → Frontend (Vercel)
api.creasearch.com      → Backend (Railway)
 ↓
Supabase (Postgres, Auth, Storage)
```

* Frontend and backend are **separate services**
* Supabase is **never directly exposed for sensitive operations**
* Hostinger is **DNS only**

---

## 2. Final Folder Structure (Monorepo, Clean Separation)

```
root/
├── frontend/              # React + Vite (Vercel)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── .env.example
│
├── backend/               # Express API (Railway)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   ├── package.json
│   └── .env.example
│
├── shared/                # OPTIONAL (types only)
│   ├── types.ts
│   ├── zod.ts
│   └── constants.ts
│
├── supabase/              # migrations, policies
│
├── package.json           # workspace only (no runtime deps)
└── README.md
```

---

## 3. Root Configuration (Important)

### Root `package.json`

Keep it **only** for workspace coordination.

```json
{
  "private": true,
  "workspaces": ["frontend", "backend"]
}
```

❌ No runtime dependencies
❌ No build/start logic
✅ Only tooling if needed

---

## 4. Frontend (Vercel)

### Tech

* React + Vite
* No backend logic
* No direct DB access for privileged actions

### `frontend/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### `vite.config.ts`

```ts
export default defineConfig({
  build: {
    outDir: "dist"
  }
});
```

### `vercel.json` (frontend ONLY)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Frontend ENV (Vercel)

```env
VITE_API_BASE_URL=https://api.creasearch.com
```

🚫 Never expose:

* Supabase service role key
* Database credentials

---

## 5. Backend (Railway)

### Tech

* Node.js + Express
* Acts as **only API layer**
* Handles:

  * writes
  * uploads
  * privileged reads
  * auth verification

### `backend/package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

### Backend MUST include

#### CORS (required)

```ts
app.use(cors({
  origin: [
    "https://creasearch.com",
    "https://www.creasearch.com"
  ],
  credentials: true
}));
```

#### Health Check

```ts
app.get("/health", (_, res) => res.send("ok"));
```

### Backend ENV (Railway)

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
CORS_ORIGIN=https://creasearch.com
```

---

## 6. Supabase Usage Rules (Strict)

✅ Allowed:

* Backend → Supabase (full access)
* Frontend → Supabase (limited, public reads only)

❌ Not allowed:

* Frontend using service role
* Business logic in frontend
* Direct DB writes from frontend

Uploads:

* Prefer backend proxy
* Or Supabase Storage with signed URLs

---

## 7. Domain & DNS (Hostinger)

### DNS Records

**Frontend**

```
A     @      → 76.76.21.21
CNAME www    → cname.vercel-dns.com
```

**Backend**

```
CNAME api    → <railway-app>.up.railway.app
```

SSL handled automatically by Vercel & Railway.

---

## 8. Migration Order (DO NOT SKIP)

1. Create `/frontend` and `/backend` folders
2. Move code **without deleting old `api/`**
3. Deploy backend to Railway
4. Test API via `api.creasearch.com`
5. Deploy frontend to Vercel
6. Confirm frontend → backend works
7. Delete old `api/` folder
8. Cleanup root

Each step = **separate git commit**

---

## 9. Deployment Checklist

### Vercel

* Root Directory → `frontend`
* Build Command → `npm run build`
* Output → `dist`
* Env vars set
* Build logs clean

### Railway

* Root Directory → `backend`
* Start Command → `npm run start`
* Health endpoint working
* CORS verified

---

## Final Verdict

This structure is:

* scalable
* debuggable
* production-grade
* vendor-agnostic





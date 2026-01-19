# Creasearch - Implementation Plan v3

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CREASEARCH STACK                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend          │  Vite + React + TypeScript             │
│  Backend           │  Node.js + Express.js                  │
│  Database          │  Supabase PostgreSQL (Singapore)       │
│  Authentication    │  Supabase Auth (Google OAuth)          │
│  File Storage      │  Supabase Storage                      │
│  Email             │  Resend                                │
│  Deployment        │  Vercel                                │
│  Domain/DNS        │  Hostinger                             │
└─────────────────────────────────────────────────────────────┘
```

| Component | Technology | Region |
|-----------|------------|--------|
| Frontend | Vite + React | Vercel Edge |
| Backend | Express.js (API) | Vercel Serverless |
| Database | Supabase PostgreSQL | Singapore |
| Auth | Supabase Auth | Singapore |
| Storage | Supabase Storage | Singapore |
| Email | Resend | - |
| DNS | Hostinger | - |

---

## Project Structure

```
CreasearchMarket/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Page components
│       ├── components/      # UI components
│       ├── lib/             # Supabase client, utils
│       └── contexts/        # Auth context
├── server/                  # Express.js backend
│   ├── index.ts             # Server entry
│   ├── routes.ts            # API routes
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, validation
│   └── services/            # Business logic
├── shared/                  # Shared types
└── db/                      # Database schema (Drizzle)
```

---

## Database Schema (Supabase PostgreSQL)

```sql
-- profiles (creators & organizations)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator', 'organization', 'admin')),
  name TEXT NOT NULL,
  title TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  video_intro_url TEXT,
  collaboration_types TEXT[],
  social_links JSONB DEFAULT '{}',
  follower_total INTEGER DEFAULT 0,
  verified_socials TEXT[],
  profile_completion INTEGER DEFAULT 0,
  gigs_completed INTEGER DEFAULT 0,
  rating_score DECIMAL(3,2) DEFAULT 0,
  creasearch_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- inquiries
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id),
  to_profile_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  collaboration_type TEXT,
  date_range TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_discussion', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- portfolio_items
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints (Express.js)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth callback |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List creators (with filters) |
| GET | `/api/profiles/:id` | Get single profile |
| POST | `/api/profiles` | Create profile |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/pending` | Get pending profiles |
| POST | `/api/admin/approve/:id` | Approve profile |
| POST | `/api/admin/reject/:id` | Reject profile |

### Inquiries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inquiries` | Send inquiry |
| GET | `/api/inquiries` | List user's inquiries |
| PUT | `/api/inquiries/:id/status` | Update inquiry status |

---

## Security

### 1. Row-Level Security (RLS)
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON profiles
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Express Middleware
- JWT validation via Supabase
- Rate limiting (express-rate-limit)
- Input validation (Zod)
- CORS configuration

### 3. Auth Flow
- Google OAuth → Supabase Auth
- JWT tokens stored in HTTP-only cookies
- Protected routes require valid session

---

## Implementation Phases

### Phase 1: Supabase Setup ✅
- [x] Create Supabase project (Singapore region)
- [x] Create database tables
- [x] Enable RLS policies
- [x] Configure Google OAuth in Supabase
- [x] Create storage buckets
- [x] Get connection string for Express
- [x] Configure environment variables (.env)

### Phase 2: Express Backend ✅
- [x] Install Supabase JS client
- [x] Create database service layer
- [x] Build profile API endpoints
- [x] Build admin API endpoints
- [ ] Implement auth middleware (protected routes)
- [ ] Build inquiry API endpoints
- [ ] Add input validation (Zod)
- [ ] Add rate limiting

### Phase 3: Frontend Auth Integration ✅
- [x] Create AuthContext
- [x] Connect Google OAuth
- [x] Header user menu (logged in state)
- [x] Fix Vite env loading (envDir config)
- [ ] Protected route wrapper

### Phase 4: Connect Frontend to API (Partial)
- [x] Create API service layer (api.ts)
- [x] ProfileCreationPage → POST /api/profiles
- [ ] SearchPage → GET /api/profiles
- [ ] CreatorProfilePage → GET /api/profiles/:id
- [ ] AdminDashboardPage → admin endpoints

#### 🆕 Profile Status Check (UX Fix)
**Problem:** After submitting profile, users can revisit /create-profile and see empty form.

**Solution:**
1. Add API endpoint `GET /api/profiles/me` to fetch current user's profile
2. On ProfileCreationPage load:
   - Fetch user's existing profile
   - If **pending**: Show "Profile Under Review" status page
   - If **approved**: Redirect to `/creator/:id` (their profile)
   - If **rejected**: Allow editing and resubmission
   - If **none**: Show profile creation form

### Phase 5: File Uploads
- [ ] Profile photo upload to Supabase Storage
- [ ] Video intro upload or YouTube URL
- [ ] Display media in profiles

### Phase 6: Email (Resend)
- [ ] Configure Resend
- [ ] Inquiry notification emails
- [ ] Profile approved/rejected emails

### Phase 7: Deployment
- [ ] Deploy to Vercel
- [ ] Configure environment variables
- [ ] Connect custom domain
- [ ] Configure Hostinger DNS

---

## Creasearch Score

```typescript
function calculateScore(profile: Profile): number {
  const reachScore = Math.min(profile.follower_total / 1000000, 1) * 100;
  const completionScore = profile.profile_completion;
  const verificationScore = profile.verified_socials.length >= 2 ? 100 : profile.verified_socials.length * 50;
  const gigsScore = Math.min(profile.gigs_completed / 50, 1) * 100;

  return Math.round(
    0.4 * reachScore +
    0.2 * completionScore +
    0.1 * verificationScore +
    0.3 * gigsScore
  );
}
```

---

## Out of Scope

- ❌ Payments / Stripe
- ❌ In-app chat
- ❌ Automated scheduling
- ❌ Mobile apps

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google OAuth (configured in Supabase)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Resend
RESEND_API_KEY=xxx

# App
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```

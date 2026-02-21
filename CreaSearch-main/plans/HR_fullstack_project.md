# Full-Stack Project: Creasearch

**Question:** *"Have you worked on any full-stack development projects? If yes, briefly describe one."*

---

## Project Overview

**Creasearch** is a B2B SaaS marketplace I built that connects brands with content creators in Pakistan. Organizations can discover, filter, and book creators for collaborations, events, and sponsorships.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui |
| **Backend** | Node.js, Express.js, TypeScript, REST APIs |
| **Database** | PostgreSQL (via Supabase) with Row-Level Security |
| **Auth** | Google OAuth 2.0 (Supabase Auth) |
| **Storage** | Supabase Storage (cloud file uploads) |
| **Deployment** | Vercel (frontend), Railway (backend) |

---

## Key Features I Built

1. **Creator Discovery** - Search with dynamic filters (city, follower count, collaboration type)
2. **Multi-Step Profile Wizard** - 4-step form with validation, photo upload, social links
3. **Google OAuth Authentication** - Secure login with session management  
4. **Admin Dashboard** - Approve/reject profiles, role-based access control
5. **File Upload Pipeline** - Client preview → Multer → Supabase Storage
6. **YouTube/Instagram Verification** - API integrations to verify follower counts

---

## Architecture

```
Frontend (Vercel)  →  Backend API (Railway)  →  Supabase (PostgreSQL + Auth + Storage)
```

---

## My Contributions

- Designed and implemented the full database schema with RLS policies
- Built all REST API endpoints for profiles, uploads, and admin operations
- Created responsive UI components with mobile-first design
- Integrated third-party APIs (YouTube Data API, Apify for Instagram)
- Set up CI/CD with Vercel and Railway deployments

---

## Links

- **GitHub:** [github.com/Muneeb-Abbasi/CreaSearch](https://github.com/Muneeb-Abbasi/CreaSearch)

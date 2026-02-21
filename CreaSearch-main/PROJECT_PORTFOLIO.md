# Creasearch - Creator Collaboration Platform

> A full-stack marketplace connecting brands with content creators in Pakistan for collaborations, events, and sponsorships.

## 🌐 Live Demo
**URL:** [creasearch.com](https://creasearch.com) *(deployment pending)*

**GitHub:** [github.com/Muneeb-Abbasi/CreaSearch](https://github.com/Muneeb-Abbasi/CreaSearch)

---

## 📋 Project Overview

Creasearch is a B2B SaaS platform designed to bridge the gap between brands and content creators in Pakistan. Organizations can discover, filter, and connect with verified creators based on their niche, follower count, location, and collaboration preferences.

### Key Features Implemented

- **Creator Discovery** - Search and filter creators by city, follower count, collaboration type
- **Profile Creation** - Multi-step form with photo upload, social links, and video intro
- **Google OAuth Authentication** - Secure login via Google with session management
- **Admin Dashboard** - Approve/reject pending profiles, manage all creators
- **Role-Based Access Control** - Admin-only dashboard with email whitelist
- **File Uploads** - Profile photos stored in cloud storage with preview
- **Responsive Design** - Mobile-first UI with modern aesthetics

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks and functional components |
| **TypeScript** | Type-safe development |
| **Vite** | Fast development server and build tool |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn/ui** | Pre-built accessible UI components |
| **Wouter** | Lightweight client-side routing |
| **TanStack Query** | Server state management and caching |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | REST API framework |
| **TypeScript** | Type-safe server code |
| **Multer** | Multipart file upload handling |

### Database & Auth
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database with Row-Level Security |
| **Supabase Auth** | Google OAuth provider integration |
| **Supabase Storage** | Cloud file storage for photos/videos |

### DevOps & Tooling
| Technology | Purpose |
|------------|---------|
| **Git/GitHub** | Version control |
| **ESLint** | Code linting |
| **tsx** | TypeScript execution |
| **dotenv** | Environment variable management |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React + TypeScript + Tailwind + Shadcn/ui                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐         │
│  │ Landing │ │ Search  │ │ Profile │ │  Admin   │         │
│  │  Page   │ │  Page   │ │Creation │ │Dashboard │         │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘         │
└───────┼───────────┼───────────┼───────────┼────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                      │
│  /api/profiles  /api/admin  /api/upload  /api/auth         │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐       ┌──────────┐       ┌──────────┐
  │ Supabase │       │ Supabase │       │ Supabase │
  │ Database │       │   Auth   │       │ Storage  │
  │(PostgreSQL)│     │ (OAuth)  │       │ (Files)  │
  └──────────┘       └──────────┘       └──────────┘
```

---

## 📁 Project Structure

```
creasearch/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── CreatorCard.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── ui/            # Shadcn components
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── ProfileCreationPage.tsx
│   │   │   ├── CreatorProfilePage.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # Utilities
│   │       ├── api.ts         # API service layer
│   │       ├── supabase.ts    # Supabase client
│   │       └── utils.ts
│   └── index.html
│
├── server/                    # Express Backend
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route definitions
│   ├── vite.ts                # Vite dev server integration
│   └── services/
│       ├── database.ts        # Supabase DB operations
│       └── storage.ts         # File upload service
│
├── supabase/
│   └── schema.sql             # Database schema + RLS policies
│
└── plans/                     # Project documentation
    ├── implementation_plan.md
    ├── startup_guide.md
    └── testing_plan.md
```

---

## 🔐 Security Implementation

- **Row-Level Security (RLS)** - Database policies restrict data access
- **Service Role Key** - Backend uses privileged key for admin operations
- **Admin Whitelist** - Hardcoded admin emails for dashboard access
- **OAuth 2.0** - Secure Google authentication flow
- **Environment Variables** - Secrets stored in .env (gitignored)

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List approved profiles with filters |
| GET | `/api/profiles/:id` | Get single profile details |
| GET | `/api/profiles/me` | Get current user's profile |
| POST | `/api/profiles` | Create new profile |
| GET | `/api/admin/pending` | List pending profiles (admin) |
| POST | `/api/admin/approve/:id` | Approve profile (admin) |
| POST | `/api/admin/reject/:id` | Reject profile (admin) |
| DELETE | `/api/admin/delete/:id` | Delete profile (admin) |
| POST | `/api/upload/photo` | Upload profile photo |
| POST | `/api/upload/video` | Upload video intro |

---

## 💡 Key Technical Accomplishments

### 1. Multi-Step Form with State Management
Implemented a 4-step profile creation wizard with form validation, progress tracking, and data persistence across steps using React state.

### 2. Real-Time Profile Status Flow
Built a system where:
- New profiles go to "pending" status
- Admin approves → profile appears in search
- Admin rejects → user can edit and resubmit
- Visibility change listener for cache invalidation

### 3. File Upload Pipeline
Created end-to-end file upload with:
- Client-side preview generation
- Size validation (5MB limit)
- Multer middleware for multipart handling
- Supabase Storage integration
- URL returned for database storage

### 4. Dynamic Filtering
Search page with:
- Text search (name, title)
- City multi-select filter
- Follower count range slider
- Collaboration type checkboxes
- Real-time filter application

---

## 📊 Database Schema

```sql
-- Main profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'creator',
  name TEXT NOT NULL,
  title TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  video_intro_url TEXT,
  collaboration_types TEXT[],
  social_links JSONB,
  follower_total INTEGER DEFAULT 0,
  verified_socials TEXT[],
  creasearch_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Future Roadmap

- [ ] Email notifications via Resend
- [ ] Creator analytics dashboard
- [ ] Messaging/inquiry system
- [ ] Payment integration
- [ ] Mobile app (React Native)

---

## 👤 Developer

**Muneeb Abbasi**
- GitHub: [@Muneeb-Abbasi](https://github.com/Muneeb-Abbasi)
- Email: muneeb.abbasi13@gmail.com

---

## 📝 Resume Section (Copy-Paste Ready)

### Project Title
**Creasearch** - Full-Stack Creator Collaboration Platform

### Bullet Points for Resume
- Built a B2B SaaS marketplace connecting 100+ brands with content creators using React, TypeScript, and Supabase
- Designed and implemented RESTful APIs with Express.js for profile management, file uploads, and admin operations
- Integrated Google OAuth 2.0 authentication with role-based access control and admin email whitelist
- Developed multi-step profile creation wizard with real-time photo preview and cloud storage upload
- Implemented advanced search with dynamic filtering by location, follower count, and collaboration type
- Built admin dashboard with profile approval workflow and Row-Level Security (RLS) policies

### Tech Stack (One-Liner)
`React` `TypeScript` `Node.js` `Express.js` `PostgreSQL` `Supabase` `Tailwind CSS` `REST APIs` `OAuth 2.0`

### Tech Stack (Categorized)
- **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn/ui, Vite
- **Backend:** Node.js, Express.js, REST APIs, Multer
- **Database:** PostgreSQL (Supabase), Row-Level Security
- **Auth:** Google OAuth 2.0, Supabase Auth
- **Storage:** Supabase Storage (Cloud)
- **Tools:** Git, GitHub, ESLint, dotenv

---

*Built with ❤️ for the Pakistani creator economy*

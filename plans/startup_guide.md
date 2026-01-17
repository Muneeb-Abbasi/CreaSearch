# Creasearch - Startup Guide

## Quick Start (Windows)

### Prerequisites
- Node.js v18+ installed
- npm installed

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
# Windows (use cross-env)
npx cross-env NODE_ENV=development npx tsx server/index.ts
```

### Access the App
Open browser: **http://localhost:5000**

---

## Available Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/login` | Login page |
| `/search` | Find creators |
| `/creator/:id` | Creator profile |
| `/create-profile` | Create creator profile |
| `/admin` | Admin dashboard |

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Unix only) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type check |

> **Note**: The `npm run dev` command uses Unix-style `NODE_ENV=` which doesn't work on Windows. Use the cross-env command above instead.

---

## Project Structure

```
CreasearchMarket/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Express backend
│   ├── index.ts         # Server entry
│   ├── routes.ts        # API routes
│   └── vite.ts          # Vite dev server
├── shared/              # Shared types/schema
├── plans/               # Implementation plans
└── package.json
```

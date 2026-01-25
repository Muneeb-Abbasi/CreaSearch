Here’s a **sharp, no-nonsense prompt** you can paste directly into **Antigravity / Opus 4.5**.

This is written to **force the model to act**, not hallucinate or refactor blindly.

---

### 🔥 PROMPT (copy-paste as is)

> You are a senior full-stack engineer and DevOps architect.
>
> I have an **existing monorepo** with mixed frontend and backend code.
> I want to **restructure it cleanly** so I can:
>
> * deploy **frontend (React + Vite)** on **Vercel**
> * deploy **backend (Express / Node)** on **Railway**
> * keep **Supabase (DB + Auth + Storage)** external
>
> ---
>
> ## CURRENT STRUCTURE (IMPORTANT)
>
> ```
> .
> ├── api/
> ├── attached_assets/
> ├── client/
> ├── server/
> ├── shared/
> ├── supabase/
> ├── node_modules/
> ├── .env
> ├── .env.example
> ├── package.json
> ├── vite.config.ts
> ├── vercel.json
> └── tsconfig.json
> ```
>
> ---
>
> ## TASKS
>
> 1. **Analyze the current structure**
> 2. Propose a **clean final folder structure** with:
>
>    * `/frontend` → Vercel-ready
>    * `/backend` → Railway-ready
>    * optional `/shared` for types/utils
> 3. Clearly state:
>
>    * what files/folders move to **frontend**
>    * what files/folders move to **backend**
>    * what should be **deleted or ignored**
> 4. Update or create:
>
>    * `package.json` (frontend & backend separately)
>    * `vite.config.ts` location & fixes
>    * `vercel.json` (frontend only)
>    * backend start command for Railway
> 5. Explain **environment variable separation**:
>
>    * which env vars go to Vercel
>    * which go to Railway
>    * which NEVER go to frontend
> 6. Ensure:
>
>    * frontend does NOT directly access Supabase DB
>    * backend acts as API layer
>    * Supabase Auth rules are respected
>
> ---
>
> ## CONSTRAINTS (DO NOT IGNORE)
>
> * Do NOT rewrite application logic
> * Do NOT change frameworks
> * Do NOT assume Next.js
> * Keep React + Vite
> * Keep Express backend
> * Focus on **deployment correctness**
>
> ---
>
> ## OUTPUT FORMAT
>
> 1. Final folder tree (ASCII)
> 2. Step-by-step migration instructions
> 3. Updated config snippets (only what must change)
> 4. Deployment checklist for:
>
>    * Vercel
>    * Railway
>
> Be precise.
> No generic advice.
> No assumptions.
> Treat this as a production system.

---

### Why this prompt works (important)

* Forces **analysis before action**
* Prevents the model from:

  * mixing frontend/backend again
  * inventing Next.js
  * rewriting logic
* Optimized for **real deployment**, not theory

---

### Brutal honesty

Your current structure is **the root cause** of:

* Vercel build confusion
* 405 errors
* runtime mismatch
* env leakage risk





# Creasearch - Frontend Updates Plan

## Current Issues

| Issue | Location | Status |
|-------|----------|--------|
| Login/Signup buttons don't work | Header.tsx | ❌ |
| Find Creators button doesn't navigate | HeroSection.tsx, CTASection.tsx | ❌ |
| Join as Creator button doesn't navigate | HeroSection.tsx, CTASection.tsx | ❌ |
| How It Works link needs anchor scroll | Header.tsx | ❌ |
| Pricing link needs anchor scroll | Header.tsx | ❌ |
| No login page exists | - | ❌ |
| Creator cards don't navigate to profile | SearchPage.tsx | ❌ |
| No auth context | - | ❌ |

---

## Pages & Navigation

### New Page: Login (`/login`)
- Google OAuth "Continue with Google" button (primary)
- Email/password form (fallback)
- Redirect to previous page after login

### Anchor Scrolls (No New Pages Needed)
- **How It Works** → `/#how-it-works` (scroll to section on homepage)
- **Pricing** → `/#pricing` (scroll to section on homepage)

> Sections need `id` attributes added: `<section id="how-it-works">` and `<section id="pricing">`

## Button Navigation Fixes

### HeroSection.tsx
```tsx
// Find Creators → /search
<Link href="/search">
  <Button>Find Creators</Button>
</Link>

// Join as Creator → /login (if not logged) OR /create-profile (if logged)
<Button onClick={() => user ? navigate('/create-profile') : navigate('/login')}>
  Join as Creator
</Button>
```

### Header.tsx
```tsx
// Login button → /login
<Link href="/login">
  <Button>Log In</Button>
</Link>

// Sign Up button → /login
<Link href="/login">
  <Button>Sign Up</Button>
</Link>

// When logged in: show Avatar dropdown instead
{user ? <UserMenu /> : <LoginButtons />}
```

### CTASection.tsx
```tsx
// Same logic as HeroSection
```

### SearchPage.tsx (CreatorCard)
```tsx
// Card click → /creator/:id
<CreatorCard onClick={() => navigate(`/creator/${creator.id}`)} />
```

---

## Auth Context Setup

```tsx
// client/src/contexts/AuthContext.tsx
- Supabase auth state listener
- user, loading, signIn, signOut
- Wrap App in AuthProvider
```

---

## Protected Routes

| Route | Access |
|-------|--------|
| `/create-profile` | Logged in only |
| `/admin` | Admin role only |
| `/login` | Redirect to home if already logged in |

---

## Header Updates (When Logged In)

**Before login:**
```
[Find Creators] [How It Works] [Pricing]  [Log In] [Sign Up]
```

**After login:**
```
[Find Creators] [How It Works] [Pricing]  [Avatar ▼]
                                           └─ My Profile
                                           └─ Dashboard (admin)
                                           └─ Sign Out
```

---

## Implementation Checklist

### Phase A: Setup
- [ ] Create `LoginPage.tsx` with Google OAuth button
- [ ] Add `id="how-it-works"` to HowItWorksSection
- [ ] Add `id="pricing"` to PricingSection
- [ ] Add `/login` route to `App.tsx`

### Phase B: Navigation Fixes
- [ ] HeroSection: Add Link to Find Creators button
- [ ] HeroSection: Add conditional navigation to Join as Creator
- [ ] Header: Login/Signup buttons navigate to /login
- [ ] CTASection: Same as HeroSection
- [ ] SearchPage: Creator cards navigate to profile
- [ ] PricingSection: Get Started buttons navigate to /login

### Phase C: Auth Integration
- [ ] Create AuthContext with Supabase
- [ ] Wrap App in AuthProvider
- [ ] Update Header to show user menu when logged in
- [ ] Protect /create-profile route
- [ ] Protect /admin route (admin only)

### Phase D: UX Polish
- [ ] Add loading states during auth
- [ ] Add toast notifications for login/logout
- [ ] Redirect after login to intended page
- [ ] Add user avatar in header dropdown
- [ ] Mobile menu auth state

---

## Files to Modify

| File | Changes |
|------|---------|
| `App.tsx` | Add new routes, wrap with AuthProvider |
| `Header.tsx` | Login/Signup → Link, conditional user menu |
| `HeroSection.tsx` | Button navigation |
| `CTASection.tsx` | Button navigation |
| `SearchPage.tsx` | Card click navigation |
| `PricingSection.tsx` | Button navigation |

## Files to Create

| File | Purpose |
|------|---------|
| `pages/LoginPage.tsx` | Google OAuth + email/password |
| `contexts/AuthContext.tsx` | Supabase auth state |
| `components/UserMenu.tsx` | Logged-in dropdown |
| `components/ProtectedRoute.tsx` | Route guard |

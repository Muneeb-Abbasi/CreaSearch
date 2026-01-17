# Creasearch Testing Plan

## Quick Start
```bash
# Start dev server
npx cross-env NODE_ENV=development npx tsx server/index.ts

# Open in browser
http://localhost:5000
```

---

## Test Checklist

### 1. Homepage ✅ Ready to Test
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | Open http://localhost:5000 | Homepage displays without errors |
| Navigation | Click all header links | Links work (Find Creators, How It Works, Pricing) |
| Anchor scroll | Click "How It Works" | Page scrolls to section |
| CTA buttons | Click "Find Creators" | Navigates to /search |
| Featured creators | View section | 3 creator cards display |
| View All | Click "View All" | Navigates to /search |

---

### 2. Authentication 🔐
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Login page | Click "Sign Up" | Opens /login page |
| Google OAuth | Click "Continue with Google" | Redirects to Google sign-in |
| Successful login | Complete Google sign-in | Redirects to homepage, avatar shows in header |
| User menu | Click avatar | Dropdown shows name, email, My Profile, Sign Out |
| Sign out | Click "Sign Out" | User logged out, Login/Sign Up buttons return |

---

### 3. Search Page 🔍
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | Navigate to /search | Creator grid displays |
| Search filter | Type in search box | Results filter by name/title |
| City filter | Check "Karachi" | Shows only Karachi creators |
| Follower filter | Move slider to 100K | Shows creators with 100K+ followers |
| Type filter | Check "Podcasts" | Shows podcast creators |
| Pagination | Click page 2 | Next set of creators displays |
| Creator card click | Click a creator card | Navigates to /creator/:id |

---

### 4. Static Pages 📄
| Test | Steps | Expected Result |
|------|-------|-----------------|
| About | Navigate to /about | About page displays |
| Contact | Navigate to /contact | Contact form displays |
| Privacy | Navigate to /privacy | Privacy policy displays |
| Terms | Navigate to /terms | Terms of service displays |
| Success Stories | Navigate to /success-stories | Success stories display |

---

### 5. Footer Links 🔗
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Join Platform | Click link | Navigates to /login |
| Pricing | Click link | Scrolls to /#pricing |
| About Us | Click link | Navigates to /about |
| Contact | Click link | Navigates to /contact |
| Privacy Policy | Click link | Navigates to /privacy |
| Terms | Click link | Navigates to /terms |

---

### 6. API Endpoints (via Browser DevTools)
```
GET  http://localhost:5000/api/profiles
GET  http://localhost:5000/api/profiles/:id
GET  http://localhost:5000/api/admin/pending
GET  http://localhost:5000/api/auth/me
```

---

## Known Issues / Not Yet Implemented
- [ ] Profile creation form not connected to API
- [ ] Search page uses mock data (API ready but no DB data)
- [ ] File uploads not implemented
- [ ] Email notifications not configured
- [ ] Protected routes not enforced

---

## Browser Compatibility
Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

---

## Mobile Responsiveness
- [ ] Test hamburger menu on mobile
- [ ] Test search filters on mobile
- [ ] Test creator cards layout on mobile

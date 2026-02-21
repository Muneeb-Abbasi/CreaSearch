# Creasearch Marketplace - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based with Marketplace Best Practices

**Primary References:**
- **Upwork/Fiverr**: Marketplace structure, trust signals, search/discovery patterns
- **Behance/Dribbble**: Creator portfolio presentation, visual storytelling
- **LinkedIn**: Professional profiles with verification badges and credibility indicators
- **Airbnb**: Trust-building through reviews, verification, and quality imagery

**Justification:** Creasearch operates in the creator economy marketplace space where visual presentation, trust signals, and discovery are paramount. The platform must balance professional credibility with creator-friendly aesthetics to appeal to both organizations seeking talent and creators building their brand.

**Core Design Principles:**
1. **Trust First**: Prominent verification badges, credibility scores, social proof
2. **Visual Storytelling**: Creator profiles lead with video/imagery, not text walls
3. **Effortless Discovery**: Intuitive filtering with visual preview cards
4. **Professional Warmth**: Clean layouts with personality through creator content

---

## Typography System

**Primary Font:** Inter (Google Fonts) - Modern, highly legible, professional
**Accent Font:** Poppins (Google Fonts) - Friendly, approachable for headings

**Hierarchy:**
- **H1 (Hero Headlines)**: Poppins, 48px (desktop) / 32px (mobile), font-weight: 700
- **H2 (Section Headers)**: Poppins, 36px (desktop) / 28px (mobile), font-weight: 600
- **H3 (Card Titles)**: Inter, 24px, font-weight: 600
- **H4 (Subsections)**: Inter, 20px, font-weight: 600
- **Body Large**: Inter, 18px, font-weight: 400, line-height: 1.6
- **Body Regular**: Inter, 16px, font-weight: 400, line-height: 1.5
- **Body Small**: Inter, 14px, font-weight: 400
- **Labels/Captions**: Inter, 12px, font-weight: 500, uppercase tracking

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 12, 16
- Micro spacing (gaps, padding): 2, 4
- Component spacing: 8, 12
- Section spacing: 16, 20, 24

**Container Strategy:**
- **Full-width sections**: `w-full` with inner `max-w-7xl mx-auto px-4 md:px-8`
- **Content sections**: `max-w-6xl`
- **Text content**: `max-w-3xl` for readability

**Grid Patterns:**
- **Creator Cards Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`
- **Feature Grid**: `grid-cols-1 md:grid-cols-3 gap-12`
- **Profile Layout**: Two-column `lg:grid-cols-3` (sidebar + main content)

---

## Component Library

### 1. Navigation & Header
**Main Navigation:**
- Sticky header with backdrop blur
- Logo left, navigation center, CTA buttons right
- Search bar integrated into header for logged-in users
- Mobile: Hamburger menu with slide-out drawer

**Admin Navigation:**
- Sidebar layout with collapsible sections
- Dashboard, Users, Profiles, Verifications, CMS sections

### 2. Creator Profile Cards
**Marketplace Grid Cards:**
- Aspect ratio 4:3 image/video thumbnail
- Overlay gradient at bottom for name/title
- Creasearch Score badge (top-right corner)
- Verification checkmark (next to name)
- Social follower count icons (bottom overlay)
- Hover: Subtle lift (translate-y-1) + shadow increase
- Click: Navigate to full profile

**Full Profile Layout:**
- Hero section: Video introduction (16:9 aspect ratio, max 600px width)
- Left sidebar: Profile photo (200x200), verification badges, social links with follower counts, Creasearch Score visualization
- Main content: Bio, collaboration types, portfolio/past work, availability
- Right sidebar (Organizations only): "Send Inquiry" CTA card with quick filters

### 3. Search & Discovery Interface
**Filter Sidebar:**
- Collapsible sections: Collaboration Type, Location, Follower Range, Availability
- Checkbox groups with counts
- Range sliders for numeric filters
- Applied filters displayed as removable chips above results

**Search Bar:**
- Prominent, centered on search page
- Autocomplete suggestions with thumbnails
- Recent searches stored

### 4. Forms & Inputs
**Profile Creation/Edit:**
- Multi-step wizard with progress indicator (Steps: Basic Info → Media → Social Links → Review)
- Image upload with drag-drop and preview
- Video upload/embed toggle with validation (30-50 seconds)
- Social handle inputs with API validation and follower fetch
- Real-time profile completion percentage

**Inquiry Form:**
- Modal overlay or slide-in panel
- Quick message templates for organizations
- Collaboration details: Type, Date Range, Budget indication
- Send button with loading state

### 5. Payment & Subscription
**Pricing Cards:**
- Three-tier layout: Free, Creator Pro, Organization
- Feature comparison table below cards
- Highlighted recommended plan (subtle glow/border)
- Annual/Monthly toggle switch
- Stripe integration for checkout

### 6. Trust & Verification Elements
**Creasearch Score Display:**
- Circular progress indicator (0-100 scale)
- Color-coded ranges: 0-30 (gray), 31-60 (blue), 61-85 (green), 86-100 (gold)
- Breakdown tooltip showing 4 components (reach 40%, completion 20%, verification 10%, gigs 30%)

**Verification Badges:**
- Icon + text format (e.g., checkmark + "Verified Photo")
- Displayed as chips/pills next to relevant content
- Social platform icons with green checkmark overlay for verified handles

**Rating/Review System:**
- Star rating display (future: after completing gigs)
- Testimonial cards with organization logos
- Project completion count badge

### 7. Admin Panel Components
**Approval Queue:**
- Card-based layout with pending profiles
- Side-by-side comparison view for photos/videos
- Approve/Reject/Request Changes buttons
- Admin notes/feedback form

**Dashboard Stats:**
- KPI cards: Total Users, Active Creators, Pending Verifications, Revenue
- Charts: User growth, Subscription breakdown, Geographic distribution

### 8. Messaging/Inquiry Display
**Inquiry Inbox (Creator):**
- List view with organization logo, name, inquiry preview
- Status labels: New, In Discussion, Accepted, Declined
- Click to expand full inquiry details

---

## Marketing Homepage Structure

### Section 1: Hero (Full Viewport)
- **Layout:** Full-bleed background with large hero image showing diverse creators collaborating
- **Content:** Centered headline (H1: "Connect with Pakistan's Top Creators"), subheadline explaining platform value, dual CTAs ("Find Creators" + "Join as Creator")
- **Buttons:** Blurred background buttons for contrast

### Section 2: How It Works
- **Layout:** Three-column grid
- **Content:** Icon + Title + Description for each step (Discover → Connect → Collaborate)

### Section 3: Featured Creators Showcase
- **Layout:** Horizontal scrollable carousel or 6-card grid
- **Content:** Sample creator profile cards demonstrating variety

### Section 4: For Organizations
- **Layout:** Two-column split (left: text, right: screenshot/demo)
- **Content:** Benefits of finding creators, search filters preview, trust signals

### Section 5: For Creators
- **Layout:** Two-column split (right: text, left: screenshot/demo)
- **Content:** Profile builder benefits, Creasearch Score explanation, earnings potential

### Section 6: Trust & Social Proof
- **Layout:** Centered with stats in 4-column grid
- **Content:** Number of creators, successful collaborations, verification rate, average rating

### Section 7: Pricing Teaser
- **Layout:** Centered with simplified pricing cards (Free vs Premium)
- **Content:** Link to full pricing page

### Section 8: Final CTA
- **Layout:** Full-width with gradient background
- **Content:** Strong headline, secondary CTA, social media links

### Footer
- **Layout:** Four-column grid
- **Content:** About/Links, For Creators, For Organizations, Legal/Contact, Newsletter signup

---

## Images

**Hero Image:** Large, high-quality photograph showing diverse Pakistani creators (content creators, speakers, trainers) collaborating in modern setting - bright, energetic, inclusive representation

**Feature Section Images:** Screenshots of actual platform interface (search results, profile pages, dashboard)

**Creator Showcase:** Real creator profile images and video thumbnails

**Organization Section:** Screenshot showing filtered search results with multiple creator cards

**Creator Section:** Screenshot of profile builder wizard interface

**Trust Section:** Background pattern with abstract collaboration iconography
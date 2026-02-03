# Profile Scoring System Plan

## Overview
The Creasearch Score is a comprehensive metric (0-100) that evaluates creator and brand profiles based on multiple factors to help users identify quality profiles for collaboration.

---

## Scoring Factors

### 1. Profile Completion (Max: 30 points)
| Field | Points |
|-------|--------|
| Name | 2 |
| Title | 2 |
| Industry & Niche | 4 |
| Location (City + Country) | 3 |
| Phone | 2 |
| Bio (min 100 chars) | 5 |
| Profile Photo | 6 |
| Video Intro | 6 |

---

### 2. Social Verification (Max: 20 points)
Only YouTube and Instagram can be verified.

| Platform | Points |
|----------|--------|
| YouTube Verified | 10 |
| Instagram Verified | 10 |

---

### 3. Follower Count (Max: 25 points)
**Auto-calculated** from verified YouTube + Instagram accounts.

| Total Followers | Points |
|-----------------|--------|
| 1K - 10K | 5 |
| 10K - 50K | 10 |
| 50K - 100K | 15 |
| 100K - 500K | 20 |
| 500K+ | 25 |

> Note: Manual follower input removed. Followers are pulled from verified accounts only.

---

### 4. Reputation (Max: 25 points)
| Factor | Points |
|--------|--------|
| Review rating (avg × 4) | 0-20 |
| Number of reviews (capped at 10) | 0-5 |

Formula: `(avg_rating × 4) + min(review_count, 10) / 2`

---

## Implementation Plan

### Phase 1: Backend Service
- [ ] Create `calculateCreasearchScore()` function in `database.ts`
- [ ] Add trigger to recalculate on profile update
- [ ] Add trigger to recalculate on new review

### Phase 2: Auto-Update
- [ ] Recalculate on profile creation/update
- [ ] Recalculate when verification status changes
- [ ] Recalculate when new review is added

### Phase 3: Frontend Changes
- [ ] Remove manual follower input from profile forms
- [ ] Show score breakdown on profile page
- [ ] Add score filter on search page
- [ ] Display score badge on creator cards

---

## Score Calculation Formula

```
Score = Profile Completion (30) 
      + Social Verification (20) 
      + Follower Count (25) 
      + Reputation (25)
      = 100 max
```

---

## Future Enhancements
- Response rate tracking
- Collaboration completion rate
- Badge system for milestones

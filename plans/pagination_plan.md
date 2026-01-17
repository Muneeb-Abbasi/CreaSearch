# Creasearch - Pagination Plan

## Problem
The Search page (`/search`) displays creator profiles in a grid but has no pagination. When there are many profiles, users can't navigate to see more.

---

## Solution Options

### Option A: Load More Button (Recommended for MVP)
- Simple "Load More" button at bottom
- Appends next batch of creators to existing list
- Easy to implement, good UX for browsing

### Option B: Traditional Pagination
- Page numbers at bottom (1, 2, 3... 10)
- Navigate between pages
- Better when users want to jump to specific pages

### Option C: Infinite Scroll
- Automatically loads more as user scrolls down
- Seamless experience
- More complex to implement

---

## Recommended Implementation (Option A + B)

### UI Components
```
[Creator Cards Grid - 6 per page]

[< Previous]  Page 1 of 10  [Next >]

         [Load More]
```

### State Management
```tsx
const [currentPage, setCurrentPage] = useState(1);
const [creatorsPerPage] = useState(6);
const [allCreators, setAllCreators] = useState([]);

// Calculate displayed creators
const startIndex = (currentPage - 1) * creatorsPerPage;
const displayedCreators = allCreators.slice(startIndex, startIndex + creatorsPerPage);
const totalPages = Math.ceil(allCreators.length / creatorsPerPage);
```

---

## Implementation Checklist

- [x] Add pagination state to SearchPage
- [x] Create Pagination component (or use existing UI component)
- [x] Add Previous/Next buttons
- [x] Add page number display
- [ ] Optional: Add "Load More" button alternative
- [ ] Update URL with page number (?page=2)
- [ ] Handle empty states

---

## Files to Modify

| File | Changes |
|------|---------|
| `SearchPage.tsx` | Add pagination state and logic |
| `components/ui/pagination.tsx` | Already exists in UI library |

---

## Estimated Effort
~30 minutes

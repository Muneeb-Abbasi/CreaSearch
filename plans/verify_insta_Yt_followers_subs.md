Here’s the **concise, executive-ready plan** for **YouTube + Instagram**, with no fluff and no weak assumptions.

---

## YouTube (Official API – scalable & free)

**On profile submission**

* Validate channel exists
* Fetch subscriber count (public)
* If subscriber count is hidden → reject
* Store `channel_id` and subscriber count

**Ownership verification**

* Creator clicks **“Verify YouTube”**
* Google OAuth (`youtube.readonly`)
* Read authenticated `channelId`
* Compare with submitted channel link
* If match → **OWNER VERIFIED**

**Updates**

* Weekly subscriber updates via YouTube Data API
* Cheap (1 unit per call), safe to run for all creators

**Status values**

* `PENDING`
* `VERIFIED_SOFT` (public data only)
* `VERIFIED_OWNER` (OAuth confirmed)

---

## Instagram (Apify – quota-limited)

**On profile submission**

* Save profile URL as `PENDING`
* ❌ No scraping on submit
* ❌ No ownership verification (MVP scope)

**Verification pipeline (budget-aware)**

* Daily cron processes **1–2 profiles max**
* Use Apify to:

  * Check profile exists
  * Fetch follower count
* If valid → mark as `VALIDATED`
* If invalid/private → `FAILED`

**Follower updates**

* ❌ No weekly updates for all creators
* Update only **high-priority profiles**
* Frequency:

  * High priority → monthly
  * Low priority → 60–90 days
* Always show “last updated” date in UI

**When quota is exhausted**

* Pause Instagram verification jobs
* Platform continues working normally
* Instagram counts remain stale until quota resets

**Status values**

* `PENDING`
* `VALIDATED`
* `FAILED`

---

## Key Rules (Non-negotiable)

* Never scrape Instagram on form submit
* Never update all Instagram profiles on schedule
* YouTube = scalable, Instagram = scarce resource
* Degrade gracefully, never crash system

---

## Outcome

* System survives **100+ submissions/day**
* Stays within **$5 Apify free quota**
* No misleading “verified” claims
* Ready to upgrade later with ownership proof & paid plans

---

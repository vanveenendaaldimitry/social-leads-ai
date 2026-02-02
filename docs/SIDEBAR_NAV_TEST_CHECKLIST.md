# Sidebar Navigation – Local Test Checklist

## Pre-requisites
- `npm run build` succeeds
- `npm run lint` passes
- Dev server running: `npm run dev`

## Test Items

1. **Sidebar renders correctly on desktop and mobile**
   - [ ] Desktop: Left sidebar is visible and fixed
   - [ ] Mobile: Sidebar is hidden by default; hamburger in Topbar opens drawer
   - [ ] Mobile: Overlay closes drawer when clicked
   - [ ] Mobile: X button closes drawer

2. **Active menu highlighting works correctly**
   - [ ] Navigate to /leads/dashboard – Dashboard is highlighted
   - [ ] Navigate to /leads/scanpoints – Scanpoints is highlighted
   - [ ] Navigate to /leads/businesses?view=found – Found businesses is highlighted
   - [ ] Navigate to /leads/businesses?view=scored – Scored businesses is highlighted
   - [ ] Navigate to /leads/businesses?view=enrichment – Enrichment is highlighted
   - [ ] Social routes: /social/dashboard, /social/sources, etc. highlight correctly

3. **Existing Businesses functionality still works**
   - [ ] Select rows with checkboxes
   - [ ] Enrich selected button works (if N8N_BUSINESS_ENRICH_WEBHOOK_URL configured)
   - [ ] Search, status filter, type filter, per-page selector work
   - [ ] Pagination works

4. **Scored businesses correctly shows scraped records**
   - [ ] Navigate to /leads/businesses?view=scored
   - [ ] Status filter defaults to "Scored" (scraped)
   - [ ] Table shows only scraped businesses (if any exist)

5. **Found businesses correctly shows pending and enriched records**
   - [ ] Navigate to /leads/businesses?view=found
   - [ ] Status filter defaults to "Found (pending + enriched)"
   - [ ] Table shows pending and enriched businesses (if any exist)

6. **No console errors**
   - [ ] Open DevTools console
   - [ ] Navigate through sidebar links
   - [ ] No errors in console

7. **Build and lint succeed**
   - [ ] `npm run build` exits 0
   - [ ] `npm run lint` exits 0

## Notes
- Businesses page requires `public.businesses` table in Supabase
- Enrich action requires `N8N_BUSINESS_ENRICH_WEBHOOK_URL` in .env.local

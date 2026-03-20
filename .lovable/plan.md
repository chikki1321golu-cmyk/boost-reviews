

## Plan: Update Pricing, Fix Demo, Rebrand Footer, Agency Limit

### 1. Update Pricing Plans in `PricingCards.tsx`

Update the three plan cards with the exact features specified:

**Starter (₹499/month)**: 1 business, 100 AI reviews/month, Basic analytics, QR code (small branding footer). Best for: small shops, salons, cafes.

**Growth (₹1,499/month)**: 3 businesses, Unlimited AI reviews, Advanced analytics, Custom branding (small logo), Priority support. Mark as Most Popular.

**Agency (₹3,999/month)**: 20 businesses, White-label dashboard, Remove "Powered by", Bulk QR generation, Team access.

Change period text from "/28 days" to "/month". Add "best for" tagline on Starter card.

### 2. Update Agency Business Limit

In `useSubscription.ts`, change Agency `maxBusinesses` from `Infinity` to `20`.

### 3. Fix Demo Funnel

The "Try Demo Funnel" button links to `/r/demo` but there is no business with slug "demo" in the database. Two options:
- Add a static demo mode in `ReviewFunnel.tsx` that works without a database record when slug is "demo" — uses hardcoded business name "Demo Cafe" and skips DB lookups.

### 4. Rebrand Footer and Powered-By

- **Index.tsx footer**: Change from "© 2026 ReviewBoost. All rights reserved." to "Powered by M&M Fintech Digital Solution © 2026 M&M Fintech Digital Solution. All rights reserved."
- **ReviewFunnel.tsx**: Change "Powered by ReviewBoost" to "Powered by M&M Fintech Digital Solution"
- **DashboardLayout.tsx**: Keep "ReviewBoost" as the product name in the header (it's the SaaS product name).

### Files Changed

| File | Change |
|------|--------|
| `src/components/PricingCards.tsx` | Updated plan features, pricing period, best-for tags |
| `src/hooks/useSubscription.ts` | Agency limit → 20 |
| `src/pages/ReviewFunnel.tsx` | Demo mode for slug "demo" |
| `src/pages/Index.tsx` | Footer rebrand to M&M Fintech Digital Solution |


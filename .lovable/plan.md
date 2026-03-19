

## Plan: 7-Day Trial, Subscription Gating, and Payment Database

### Overview

New users get a **7-day free trial** (1 business max, all features). After trial expires without payment, only QR scans work — AI review generation is blocked. Paid subscriptions renew every **28 days**.

### 1. Database Migration

Add a `payments` table and update `subscriptions`:

**New table: `payments`**
- `id` (uuid, PK)
- `user_id` (uuid)
- `subscription_id` (uuid, FK to subscriptions)
- `amount` (integer, in paise)
- `currency` (text, default 'INR')
- `status` (text: success/failed/pending)
- `razorpay_payment_id` (text, nullable)
- `created_at` (timestamptz)
- RLS: users can view own payments

**Update `subscriptions` table** — add columns:
- `trial_start` (timestamptz, default now())
- `trial_end` (timestamptz, default now() + 7 days)
- `is_trial` (boolean, default true)

**Auto-create trial subscription** — update the `handle_new_user` trigger to also insert a trial subscription row when a new user signs up.

### 2. Subscription Helper Hook

Create `src/hooks/useSubscription.ts`:
- Fetches the user's active subscription
- Computes: `isTrialActive`, `isTrialExpired`, `isPaid`, `canGenerateReviews`, `maxBusinesses`
- Trial logic: if `is_trial = true` and `trial_end > now()` → trial active
- After trial: `canGenerateReviews = false` unless `is_trial = false` and `status = 'active'`
- Business limit: trial = 1 business; Starter = 1; Growth = 3; Agency = unlimited

### 3. Gate Review Generation

**Edge function (`generate-reviews`)**: Add a check — query the user's subscription status. If trial expired and no active paid plan, return 403 with a message prompting upgrade.

**ReviewFunnel.tsx**: No change needed (public page, the edge function enforces the gate).

### 4. Gate Business Creation

**DashboardBusiness.tsx**: Before showing the "Add Business" form, check `useSubscription` limits. If trial user already has 1 business, hide the form and show an upgrade prompt.

### 5. Update PricingCards

- Add "7-day free trial" badge/text to each plan
- Update period text to "per 28 days"
- Link CTA buttons to trigger subscription creation (placeholder for Razorpay integration)

### 6. Subscription Status in Dashboard

**DashboardSubscription.tsx**: Show trial status with days remaining, or expired state with upgrade CTA. Display payment history from the `payments` table.

**AppSidebar.tsx**: Show a small trial badge (e.g., "Trial: 5 days left") in the sidebar.

### Files Changed

| Action | File |
|--------|------|
| DB Migration | Add `payments` table, add trial columns to `subscriptions`, update `handle_new_user` trigger |
| Create | `src/hooks/useSubscription.ts` — subscription/trial logic hook |
| Edit | `supabase/functions/generate-reviews/index.ts` — add subscription gate |
| Edit | `src/pages/DashboardBusiness.tsx` — enforce business limit |
| Edit | `src/components/PricingCards.tsx` — trial messaging, 28-day cycle |
| Edit | `src/pages/DashboardSubscription.tsx` — trial status, payment history |
| Edit | `src/components/AppSidebar.tsx` — trial badge |


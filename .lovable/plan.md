

## Plan: Remove Free Plan, Add Lovable Cloud Backend, Prepare for Deploy

### 1. Remove Free Plan from Pricing

- Remove the "Free" plan entry from `PricingCards.tsx` (lines 6-12)
- Update grid to `lg:grid-cols-3` (3 plans instead of 4)
- Update `DashboardSubscription.tsx` badge from "Free Plan" to "No Active Plan" or show the user's current subscription

### 2. Enable Lovable Cloud & Create Database Schema

Set up Lovable Cloud with the following tables:

**profiles** — user profile data
- `id` (uuid, FK to auth.users, PK)
- `full_name` (text)
- `avatar_url` (text, nullable)
- `created_at`, `updated_at`
- Trigger: auto-create on signup

**businesses** — user's businesses
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles)
- `name`, `slug` (unique), `category`, `google_review_link`, `logo_url`
- `created_at`, `updated_at`

**scans** — QR scan tracking
- `id` (uuid, PK)
- `business_id` (uuid, FK to businesses)
- `created_at`

**generated_reviews** — AI-generated reviews
- `id` (uuid, PK)
- `business_id` (uuid, FK to businesses)
- `rating` (int), `tags` (text[]), `review_text` (text)
- `copied` (boolean), `google_clicked` (boolean)
- `created_at`

**subscriptions** — billing state
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles)
- `plan` (text: starter/growth/agency)
- `status` (text: active/cancelled/past_due)
- `razorpay_subscription_id` (text, nullable)
- `current_period_start`, `current_period_end`
- `created_at`

RLS policies on all tables: users can only access their own data. Businesses are scoped by `user_id`. Scans and reviews are scoped by business ownership.

### 3. Authentication

- Integrate Supabase Auth (email/password) into Login and Signup pages
- Create an `AuthProvider` context with `onAuthStateChange` listener
- Add protected route wrapper for `/dashboard/*` routes
- Add logout button to sidebar

### 4. Wire Up Business CRUD

- `DashboardBusiness.tsx`: Insert business into Supabase on form submit, fetch user's businesses
- `DashboardQRCode.tsx`: Fetch user's businesses to generate QR codes for each slug

### 5. Wire Up Review Funnel to Database

- `ReviewFunnel.tsx`: Look up business by slug from DB
- Record scan event on page load
- Track `copied` and `google_clicked` events via DB updates

### 6. Create Edge Function for AI Reviews

- `supabase/functions/generate-reviews/index.ts`
- Accepts `{ rating, tags, businessName }`
- Calls OpenAI (gpt-4o-mini) to generate 3 review suggestions
- Returns JSON array
- Requires `OPENAI_API_KEY` secret (will request from you before implementing)

### 7. Real Analytics from Database

- Update `Dashboard.tsx` and `AnalyticsCharts.tsx` to query real scan/review/copy/click counts from Supabase instead of mock data

### 8. Deploy Readiness

- Ensure all routes are functional with real data
- Error handling and loading states on all async operations
- Toast notifications for success/error feedback

### Summary of Files Changed

| Action | File |
|--------|------|
| Edit | `src/components/PricingCards.tsx` — remove Free plan, 3-col grid |
| Edit | `src/pages/DashboardSubscription.tsx` — update badge |
| Create | `src/contexts/AuthContext.tsx` — auth provider |
| Create | `src/components/ProtectedRoute.tsx` — route guard |
| Edit | `src/pages/Login.tsx` — real Supabase auth |
| Edit | `src/pages/Signup.tsx` — real Supabase auth |
| Edit | `src/App.tsx` — wrap with AuthProvider, protect dashboard routes |
| Edit | `src/components/AppSidebar.tsx` — add logout |
| Edit | `src/pages/DashboardBusiness.tsx` — CRUD with Supabase |
| Edit | `src/pages/DashboardQRCode.tsx` — fetch businesses |
| Edit | `src/pages/ReviewFunnel.tsx` — DB lookup, event tracking |
| Edit | `src/pages/Dashboard.tsx` — real data queries |
| Edit | `src/components/AnalyticsCharts.tsx` — real data queries |
| Create | `supabase/functions/generate-reviews/index.ts` — AI edge function |
| DB | Migrations for profiles, businesses, scans, generated_reviews, subscriptions + RLS |


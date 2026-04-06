

## Plan: Rebrand to "Revuza" + QR Poster Changes

### 1. Rebrand "ReviewBoost" / "ReviewBooster" to "Revuza"

The logo uses a bold, modern style with blues/purples and a star. The logo image will be copied into the project and used where the star icon + text currently appears.

**Files to update** (replace "ReviewBoost" text with "Revuza"):
- `src/pages/Index.tsx` — nav logo (line 44), footer logo (line 176)
- `src/pages/Login.tsx` — logo (line 37)
- `src/pages/Signup.tsx` — logo (line 45)
- `src/components/DashboardLayout.tsx` — header logo (line 17)
- `src/hooks/useRazorpay.ts` — Razorpay merchant name (line 98)
- `index.html` — page title and meta tags

**Logo integration**: Copy the uploaded `revuza_logo_final.jpeg` to `src/assets/revuza-logo.jpeg`. Replace the star-icon + text combos with an `<img>` tag importing this logo. The logo already contains the word "Revuza" so no separate text span is needed — just size the image appropriately for each context (nav ~32px height, footer ~24px, etc).

**Color/font alignment with logo**: The logo uses blues (#4285F4-ish) and purples. The current emerald/green theme is a broader design choice — changing the entire app color scheme is a large undertaking. The plan will keep the existing color scheme but update the brand name and logo image. If a full color scheme change is desired, that can be a follow-up.

### 2. QR Poster — Replace logo placeholder with Google logo text

In `src/components/ReviewPoster.tsx`, replace the logo section (lines 37-69) that currently shows either the uploaded business logo or "Your Business Logo" placeholder. Instead, always render the colorful "Google" wordmark using styled spans:

```tsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
  {[
    { letter: "G", color: "#4285F4" },
    { letter: "o", color: "#EA4335" },
    { letter: "o", color: "#FBBC05" },
    { letter: "g", color: "#4285F4" },
    { letter: "l", color: "#34A853" },
    { letter: "e", color: "#EA4335" },
  ].map((l, i) => (
    <span key={i} style={{ color: l.color, fontSize: 48, fontWeight: 700, fontFamily: "'Product Sans', 'DM Sans', sans-serif" }}>
      {l.letter}
    </span>
  ))}
</div>
```

Remove the `logoUrl` prop from `ReviewPosterProps` since it's no longer used.

### 3. QR Poster Page — Remove upload logo button

In `src/pages/DashboardQRCode.tsx`:
- Remove the entire `<label>` block (lines 149-174) containing the file input and "Upload Logo" button
- Remove the `handleLogoUpload` function (lines 33-65)
- Remove the `uploading` state (line 18)
- Remove the `Upload` icon import
- Remove the `useQueryClient` import and usage (no longer needed for logo invalidation)
- Remove `logoUrl` prop from `<ReviewPoster>` calls
- Keep everything else: download button, poster preview, business list

### 4. Footer branding on poster

Update `WWW.REVIEWBOOSTER.IN` to `WWW.REVUZA.IN` in `ReviewPoster.tsx` line 298 to match the rebrand.

### Files changed summary
| File | Change |
|---|---|
| `src/assets/revuza-logo.jpeg` | New — copied from upload |
| `src/pages/Index.tsx` | Replace brand name + icon with logo image |
| `src/pages/Login.tsx` | Same |
| `src/pages/Signup.tsx` | Same |
| `src/components/DashboardLayout.tsx` | Same |
| `src/hooks/useRazorpay.ts` | "ReviewBooster" → "Revuza" |
| `index.html` | Update title/meta |
| `src/components/ReviewPoster.tsx` | Google logo letters, remove logoUrl prop, update footer URL |
| `src/pages/DashboardQRCode.tsx` | Remove upload logo UI and handler |


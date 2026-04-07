/**
 * googlePlaceUtils.ts
 *
 * Utilities for resolving any Google Business / Maps URL
 * into a direct "write a review" link + Place ID.
 *
 * Used by:
 *  - GoogleReviewLinkInput.tsx  →  resolveGoogleBusinessUrl()
 *  - ReviewFunnel.tsx           →  getDirectReviewUrl()
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolveResult {
  /** The direct review URL (writereview or best-effort fallback) */
  directReviewUrl: string | null;
  /** Google Place ID if successfully extracted */
  placeId: string | null;
  /** Human-readable error message if resolution failed */
  error?: string;
}

export interface BusinessLike {
  google_place_id?: string | null;
  google_review_link?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Try to extract a Place ID directly from a URL string without any network call.
 * Handles:
 *   - https://search.google.com/local/writereview?placeid=ChIJ...
 *   - https://www.google.com/maps/place/.../data=...!1sChIJ...
 */
function extractPlaceIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // Direct placeid / place_id query param
    const pid = u.searchParams.get("placeid") || u.searchParams.get("place_id");
    if (pid && pid.startsWith("ChIJ")) return pid;

    // Embedded in the data= segment  e.g. !1sChIJXXXXX
    const dataMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
    if (dataMatch) return dataMatch[1];
  } catch {
    // invalid URL — ignore
  }
  return null;
}

/**
 * Build the canonical Google review-write URL from a Place ID.
 */
function buildWriteReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * getDirectReviewUrl
 *
 * Synchronous best-effort resolution used in ReviewFunnel.
 * Returns the correct direct review URL from whatever the business has stored:
 *   1. If google_place_id is saved  → use it directly (fastest path)
 *   2. If google_review_link already contains a Place ID → extract and use it
 *   3. Otherwise → return google_review_link as-is (edge function will resolve it async)
 */
export function getDirectReviewUrl(business: BusinessLike): string | null {
  // Fast path: place ID already saved in DB
  if (business.google_place_id) {
    return buildWriteReviewUrl(business.google_place_id);
  }

  // Try to extract Place ID from the stored link
  if (business.google_review_link) {
    const placeId = extractPlaceIdFromUrl(business.google_review_link);
    if (placeId) return buildWriteReviewUrl(placeId);

    // Return the stored link as fallback — ReviewFunnel will resolve it async
    return business.google_review_link;
  }

  return null;
}

/**
 * resolveGoogleBusinessUrl
 *
 * Async resolution used in GoogleReviewLinkInput (business setup form).
 * Calls the Supabase edge function to expand short URLs and extract Place IDs.
 */
export async function resolveGoogleBusinessUrl(url: string): Promise<ResolveResult> {
  if (!url.trim()) {
    return { directReviewUrl: null, placeId: null, error: "No URL provided" };
  }

  // First try synchronous extraction — no network needed
  const placeId = extractPlaceIdFromUrl(url);
  if (placeId) {
    return {
      directReviewUrl: buildWriteReviewUrl(placeId),
      placeId,
    };
  }

  // For short URLs or profile links, call the edge function
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const res = await fetch(
      `${supabaseUrl}/functions/v1/resolve-google-place`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!res.ok) {
      throw new Error(`Edge function returned ${res.status}`);
    }

    const data = await res.json();

    if (data.reviewUrl) {
      return {
        directReviewUrl: data.reviewUrl,
        placeId: data.placeId ?? null,
      };
    }

    return {
      directReviewUrl: null,
      placeId: null,
      error: data.error || "Could not resolve URL",
    };
  } catch (err) {
    console.error("resolveGoogleBusinessUrl error:", err);
    return {
      directReviewUrl: null,
      placeId: null,
      error:
        "Could not extract review link. Try copying the link directly from Google Maps → Share → Copy Link.",
    };
  }
}

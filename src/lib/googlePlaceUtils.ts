import { supabase } from "@/lib/supabase";

export interface GooglePlaceResult {
  placeId: string | null;
  resolvedUrl: string | null;
  directReviewUrl: string | null;
  error?: string;
}

/**
 * Calls the Supabase Edge Function to resolve any Google URL
 * (share.google, maps.app.goo.gl, full maps URL, etc.)
 * into a direct Google Review link.
 *
 * Works with all URL formats Indian businesses share:
 *  - https://share.google/XXXX
 *  - https://maps.app.goo.gl/XXXX
 *  - https://goo.gl/maps/XXXX
 *  - https://g.page/XXXX
 *  - Full google.com/maps URLs
 */
export async function resolveGoogleBusinessUrl(url: string): Promise<GooglePlaceResult> {
  const { data, error } = await supabase.functions.invoke("resolve-google-place", {
    body: { url },
  });

  if (error) {
    return {
      placeId: null,
      resolvedUrl: null,
      directReviewUrl: null,
      error: "Failed to resolve URL. Please check the link and try again.",
    };
  }

  return data as GooglePlaceResult;
}

/**
 * Builds the best possible direct review URL from what's saved in the DB.
 * Priority: Place ID > saved google_review_link
 */
export function getDirectReviewUrl(business: {
  google_place_id?: string | null;
  google_review_link?: string | null;
}): string | null {
  if (business.google_place_id) {
    return `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
  }
  // If google_review_link is already a write-review URL, use it directly
  if (business.google_review_link?.includes("writereview") ||
      business.google_review_link?.includes("write-review") ||
      business.google_review_link?.includes("action=write-review")) {
    return business.google_review_link;
  }
  // Fallback — still better than nothing
  return business.google_review_link ?? null;
}

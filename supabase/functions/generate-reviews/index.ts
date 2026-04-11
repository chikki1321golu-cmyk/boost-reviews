import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rating, tags, businessName, businessId, category, userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check subscription status if userId provided
    if (userId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub) {
        const isTrial = sub.is_trial;
        const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
        const trialExpired = isTrial && trialEnd && trialEnd <= new Date();
        const isPaid = !isTrial && sub.status === "active";

        if (trialExpired && !isPaid) {
          return new Response(
            JSON.stringify({ error: "Your trial has expired. Please upgrade to continue generating reviews." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const categoryHint = category ? ` (${category})` : "";
    const prompt = `You are a helpful assistant that generates Google review text for a business.

Business name: ${businessName}${categoryHint}
Customer rating: ${rating}/5 stars
What they enjoyed: ${(tags || []).join(", ")}

Generate exactly 3 different Google reviews that a real customer might write. Each review should:
- Be 2-3 sentences long
- Sound natural and authentic (not overly formal or promotional)
- Reference the specific tags the customer selected
- Match the rating sentiment (${rating}/5 stars)

Return ONLY a JSON array of 3 strings with no markdown, no code fences, no extra text.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "[]";

    // Parse the JSON array from the response
    let reviews: string[];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      reviews = JSON.parse(cleaned);
      if (!Array.isArray(reviews)) throw new Error("Not an array");
    } catch {
      // Fallback: split by newlines
      reviews = content
        .split("\n")
        .map((l: string) => l.replace(/^[\d\.\-\*]+\s*/, "").trim())
        .filter((l: string) => l.length > 20)
        .slice(0, 3);
    }

    if (reviews.length === 0) throw new Error("No reviews generated");

    return new Response(JSON.stringify({ reviews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-reviews error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

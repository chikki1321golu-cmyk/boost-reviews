import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rating, tags, businessName, businessId, userId } = await req.json();

    // Check subscription status if userId provided
    if (userId) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      const { data: sub } = await sb
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a helpful assistant that generates Google review text for a business.

Business name: ${businessName}
Customer rating: ${rating}/5 stars
What they enjoyed: ${(tags || []).join(", ")}

Generate exactly 3 different Google reviews that a real customer might write. Each review should:
- Be 2-3 sentences long
- Sound natural and authentic (not overly formal or promotional)
- Reference the specific tags the customer selected
- Match the rating sentiment (${rating}/5)

Return ONLY a JSON array of 3 strings. No other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse the JSON array from the response
    let reviews: string[];
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      reviews = JSON.parse(cleaned);
    } catch {
      // Fallback: split by newlines
      reviews = content.split("\n").filter((l: string) => l.trim().length > 20).slice(0, 3);
    }

    // Save generated reviews to DB
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (businessId && reviews.length > 0) {
      const inserts = reviews.map((text: string) => ({
        business_id: businessId,
        rating,
        tags: tags || [],
        review_text: text,
      }));
      await supabase.from("generated_reviews").insert(inserts);
    }

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

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Star, Copy, ExternalLink, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  google_review_link: string | null;
  google_place_id: string | null;
}

const STEPS = { RATING: "rating", GENERATE: "generate", POST: "post" } as const;
type Step = (typeof STEPS)[keyof typeof STEPS];

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractPlaceId(url: string): string | null {
  try {
    const u = new URL(url);
    const p = u.searchParams.get("placeid") || u.searchParams.get("place_id");
    if (p?.startsWith("ChIJ")) return p;
  } catch { /* ignore */ }
  const m1 = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/\/place\/[^/]+\/(ChIJ[A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

function extractCid(url: string): string | null {
  const m = url.match(/[?&]cid=(\d{8,})/);
  if (m) return m[1];
  const h = url.match(/0x[0-9a-fA-F]+:0x([0-9a-fA-F]+)/i);
  if (h) { try { return String(BigInt("0x" + h[1])); } catch { /* ignore */ } }
  return null;
}

async function expandViaIframe(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;visibility:hidden;";
    document.body.appendChild(iframe);
    let done = false;
    const cleanup = () => {
      if (!done) { done = true; try { document.body.removeChild(iframe); } catch { /* ignore */ } }
    };
    const timer = setInterval(() => {
      try {
        const loc = iframe.contentWindow?.location.href;
        if (loc && loc !== "about:blank" && loc !== url) {
          clearInterval(timer); clearTimeout(timeout); cleanup(); resolve(loc);
        }
      } catch { clearInterval(timer); clearTimeout(timeout); cleanup(); resolve(null); }
    }, 300);
    const timeout = setTimeout(() => { clearInterval(timer); cleanup(); resolve(null); }, 6000);
    iframe.src = url;
  });
}

async function resolveGoogleUrl(rawUrl: string): Promise<{ url: string | null; placeId: string | null }> {
  const u = rawUrl.trim();
  if (u.includes("writereview")) return { url: u, placeId: extractPlaceId(u) };
  const pid = extractPlaceId(u);
  if (pid) return { url: `https://search.google.com/local/writereview?placeid=${pid}`, placeId: pid };
  const cid = extractCid(u);
  if (cid) return { url: `https://search.google.com/local/writereview?cid=${cid}`, placeId: null };
  const isShort = u.includes("share.google") || u.includes("goo.gl") || u.includes("maps.app.goo.gl") || u.includes("g.page");
  if (isShort) {
    const expanded = await expandViaIframe(u);
    if (expanded) {
      const eid = extractPlaceId(expanded);
      if (eid) return { url: `https://search.google.com/local/writereview?placeid=${eid}`, placeId: eid };
      const ecid = extractCid(expanded);
      if (ecid) return { url: `https://search.google.com/local/writereview?cid=${ecid}`, placeId: null };
    }
  }
  return { url: null, placeId: null };
}

// ── BUSINESS TAGS ─────────────────────────────────────────────────────────────
const BUSINESS_TAGS: Record<string, string[]> = {
  restaurant: ["Food Quality","Taste","Portion Size","Service","Ambience","Value for Money","Cleanliness","Speed","Staff Behaviour"],
  dhaba: ["Taste","Authentic Flavour","Quantity","Value for Money","Cleanliness","Service Speed","Seating"],
  cafe: ["Coffee Quality","Snacks & Food","Ambience","WiFi","Staff","Value for Money","Seating Comfort"],
  "fast food": ["Taste","Speed","Value for Money","Cleanliness","Portion Size","Packaging","Staff"],
  "sweet shop": ["Taste & Freshness","Variety","Packaging","Value for Money","Hygiene","Staff Behaviour"],
  "juice bar": ["Freshness","Taste","Hygiene","Value for Money","Speed","Variety"],
  bakery: ["Freshness","Taste","Variety","Packaging","Value for Money","Staff"],
  "ice cream": ["Flavour Variety","Taste","Portion Size","Value for Money","Cleanliness","Staff"],
  "tiffin service": ["Taste","Timeliness","Portion Size","Value for Money","Hygiene","Variety"],
  retail: ["Product Quality","Variety","Pricing","Staff Helpfulness","Billing Speed","Cleanliness","Return Policy"],
  grocery: ["Freshness","Variety","Pricing","Staff","Cleanliness","Availability","Billing Speed"],
  "mobile shop": ["Product Variety","Pricing","Staff Knowledge","After-Sales Service","Genuine Products","Speed"],
  "clothing store": ["Variety","Quality","Pricing","Staff Helpfulness","Trial Room","Billing Speed"],
  "jewellery shop": ["Design Variety","Quality","Pricing","Staff Behaviour","Transparency","Packaging"],
  "medical store": ["Availability","Pricing","Staff Knowledge","Cleanliness","Speed"],
  "electronics shop": ["Product Variety","Pricing","Staff Knowledge","After-Sales Service","Genuine Products"],
  stationery: ["Variety","Pricing","Availability","Staff","Quality"],
  hospital: ["Doctor Expertise","Staff Behaviour","Cleanliness","Wait Time","Facilities","Affordability"],
  clinic: ["Doctor Expertise","Wait Time","Staff Behaviour","Cleanliness","Affordability","Availability"],
  pharmacy: ["Medicine Availability","Staff Knowledge","Pricing","Cleanliness","Speed","Behaviour"],
  gym: ["Equipment Quality","Cleanliness","Trainers","Classes & Programs","Value for Money","Atmosphere","Timings"],
  "yoga studio": ["Instructor Quality","Cleanliness","Atmosphere","Timings","Value for Money","Batch Size"],
  spa: ["Service Quality","Cleanliness","Staff Behaviour","Ambience","Value for Money","Relaxation"],
  "ayurveda clinic": ["Doctor Expertise","Treatment Quality","Cleanliness","Staff Behaviour","Affordability"],
  "diagnostic center": ["Report Accuracy","Speed","Staff Behaviour","Cleanliness","Affordability","Home Collection"],
  salon: ["Skill & Expertise","Cleanliness & Hygiene","Staff Behaviour","Timing","Value for Money","Products Used","Results"],
  "beauty parlour": ["Skill","Hygiene","Staff Behaviour","Results","Value for Money","Ambience"],
  "mens salon": ["Haircut Quality","Hygiene","Staff Skill","Speed","Value for Money","Behaviour"],
  "nail studio": ["Nail Art Quality","Hygiene","Product Quality","Staff Skill","Value for Money"],
  "tattoo studio": ["Artist Skill","Design Quality","Hygiene","Safety","Value for Money","Behaviour"],
  "car service": ["Service Quality","Timely Delivery","Transparency","Staff Behaviour","Value for Money","Cleanliness"],
  "bike service": ["Service Quality","Timely Delivery","Transparency","Value for Money","Staff Behaviour"],
  "car wash": ["Cleaning Quality","Speed","Value for Money","Staff Behaviour","Care of Vehicle"],
  "tyre shop": ["Product Quality","Speed","Pricing","Staff Knowledge","Service"],
  "driving school": ["Instructor Behaviour","Teaching Quality","Timings","Value for Money","Vehicle Condition"],
  "coaching class": ["Teaching Quality","Study Material","Doubt Solving","Timings","Value for Money","Results"],
  school: ["Teaching Quality","Faculty","Infrastructure","Activities","Management","Fees"],
  college: ["Faculty Quality","Infrastructure","Placement Support","Management","Value for Money"],
  "dance class": ["Instructor Quality","Atmosphere","Timings","Value for Money","Learning Speed"],
  "music class": ["Instructor Quality","Instruments","Timings","Value for Money","Curriculum"],
  "spoken english": ["Teaching Method","Instructor","Timings","Value for Money","Results"],
  "interior designer": ["Design Quality","On-Time Delivery","Budget Adherence","Communication","Material Quality"],
  plumber: ["Work Quality","Speed","Pricing","Behaviour","Reliability"],
  electrician: ["Work Quality","Speed","Safety","Pricing","Behaviour"],
  carpenter: ["Work Quality","Material","Pricing","On-Time Delivery","Behaviour"],
  "pest control": ["Effectiveness","Safety","Pricing","Staff Behaviour","Punctuality"],
  "cleaning service": ["Cleaning Quality","Punctuality","Staff Behaviour","Value for Money","Reliability"],
  "packers movers": ["Packing Quality","Timely Delivery","Pricing","Staff Behaviour","Item Safety"],
  "ca firm": ["Expertise","Timely Filing","Communication","Transparency","Value for Money"],
  "legal services": ["Expertise","Communication","Transparency","Timely Delivery","Fees"],
  "insurance agent": ["Product Knowledge","Transparency","After-Sales Support","Behaviour","Claim Support"],
  "real estate": ["Property Options","Transparency","Staff Behaviour","After-Sales Service","Value for Money"],
  "travel agent": ["Package Value","Itinerary Quality","Support","Transparency","Hotel Quality"],
  hotel: ["Room Cleanliness","Staff Behaviour","Food Quality","Location","Facilities","Value for Money","Check-in Speed"],
  "guest house": ["Cleanliness","Staff Behaviour","Value for Money","Location","Facilities"],
  pg: ["Cleanliness","Food Quality","Security","Value for Money","Staff Behaviour","WiFi"],
  resort: ["Ambience","Room Quality","Staff Behaviour","Food","Activities","Value for Money"],
  "event planner": ["Creativity","On-Time Execution","Budget Adherence","Decoration Quality","Communication"],
  photographer: ["Photo Quality","Behaviour","Timely Delivery","Value for Money","Equipment"],
  catering: ["Food Taste","Variety","Presentation","Timely Service","Hygiene","Value for Money"],
  "banquet hall": ["Venue Quality","Cleanliness","Staff","Catering","Value for Money","Parking"],
  cinema: ["Screen Quality","Sound","Cleanliness","Seating Comfort","Staff Behaviour","Snacks"],
  default: ["Quality","Service","Value for Money","Staff Behaviour","Cleanliness","Overall Experience"],
};

function getTagsForBusiness(category: string | null): string[] {
  if (!category) return BUSINESS_TAGS.default;
  const key = category.toLowerCase().trim();
  if (BUSINESS_TAGS[key]) return BUSINESS_TAGS[key];
  const match = Object.keys(BUSINESS_TAGS).find(k => k !== "default" && (key.includes(k) || k.includes(key)));
  return match ? BUSINESS_TAGS[match] : BUSINESS_TAGS.default;
}

// ── TAG SELECTOR ──────────────────────────────────────────────────────────────
function TagSelector({ category, selected, onToggle }: {
  category: string | null;
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {getTagsForBusiness(category).map(tag => (
        <button key={tag} onClick={() => onToggle(tag)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            selected.includes(tag)
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
          }`}>
          {tag}
        </button>
      ))}
    </div>
  );
}

// ── MAIN PAGE COMPONENT ───────────────────────────────────────────────────────
const ReviewFunnelPage = () => {
  // ── Slug lookup (THIS IS THE FIX - fetch business from DB using URL slug) ──
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setPageLoading(false); return; }
    supabase
      .from("businesses")
      .select("id, name, slug, category, google_review_link, google_place_id")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else {
          setBusiness(data);
          // Record scan — fire and forget, don't block UI
          supabase.from("scans").insert({ business_id: data.id });
        }
        setPageLoading(false);
      });
  }, [slug]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-500 text-sm">This review link doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return <ReviewFunnel business={business} />;
};

export default ReviewFunnelPage;

// ── FUNNEL COMPONENT ──────────────────────────────────────────────────────────
function ReviewFunnel({ business }: { business: Business }) {
  const [step, setStep] = useState<Step>(STEPS.RATING);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const resolvedUrlRef = useRef<string | null>(null);

  const handleRatingSelect = (value: number) => {
    setRating(value);
    if (value >= 4) setTimeout(() => setStep(STEPS.GENERATE), 300);
    else toast({ title: "Thank you for your feedback", description: "We'll use this to improve our service." });
  };

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleGenerateReview = async () => {
    if (selectedTags.length === 0) {
      toast({ title: "Select at least one option", description: "Please choose what you enjoyed.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: { businessName: business.name, businessId: business.id, category: business.category, rating, tags: selectedTags },
      });
      if (error) throw error;
      const list: string[] = Array.isArray(data?.reviews) ? data.reviews : data?.review ? [data.review] : [];
      if (list.length === 0) throw new Error("No reviews returned");
      setReviews(list);
      setSelectedReview(0);
      setStep(STEPS.POST);
    } catch (err) {
      console.error("Generate error:", err);
      toast({ title: "Error generating review", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = reviews[selectedReview] || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      await supabase.from("generated_reviews")
        .update({ status: "copied" })
        .eq("business_id", business.id)
        .eq("review_text", text)
        .eq("status", "generated");
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const getReviewUrl = async (): Promise<string | null> => {
    if (resolvedUrlRef.current) return resolvedUrlRef.current;
    if (business.google_place_id) {
      const u = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
      resolvedUrlRef.current = u; return u;
    }
    if (business.google_review_link?.includes("writereview")) {
      resolvedUrlRef.current = business.google_review_link;
      return business.google_review_link;
    }
    if (business.google_review_link) {
      const { url: clientUrl, placeId } = await resolveGoogleUrl(business.google_review_link);
      if (clientUrl) {
        resolvedUrlRef.current = clientUrl;
        supabase.functions.invoke("resolve-google-place", {
          body: { url: business.google_review_link, businessId: business.id, businessName: business.name, placeId },
        });
        return clientUrl;
      }
      try {
        const { data } = await supabase.functions.invoke("resolve-google-place", {
          body: { url: business.google_review_link, businessId: business.id, businessName: business.name },
        });
        if (data?.reviewUrl?.includes("writereview")) {
          resolvedUrlRef.current = data.reviewUrl; return data.reviewUrl;
        }
      } catch (e) { console.error("Edge resolve failed:", e); }
    }
    return null;
  };

  const handlePostOnGoogle = async () => {
    setIsPosting(true);
    try {
      const reviewUrl = await getReviewUrl();
      if (!reviewUrl) {
        toast({ title: "Could not open Google Reviews", description: "Please ask the business owner to update their Google review link in Settings.", variant: "destructive" });
        return;
      }
      const text = reviews[selectedReview] || "";
      await supabase.from("generated_reviews")
        .update({ status: "clicked" })
        .eq("business_id", business.id)
        .eq("review_text", text);
      window.open(reviewUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 mt-1">Share your experience</p>
        </div>

        {step === STEPS.RATING && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">How was your visit?</h2>
              <p className="text-gray-500 mb-6 text-sm">Tap a star to rate</p>
              <div className="flex justify-center gap-3 mb-4">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => handleRatingSelect(star)}
                    onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110">
                    <Star size={44} className={star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === STEPS.GENERATE && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <h2 className="text-xl font-semibold text-center mb-2">What did you enjoy?</h2>
              <p className="text-gray-500 text-sm text-center mb-6">Select all that apply</p>
              <TagSelector category={business.category} selected={selectedTags} onToggle={toggleTag} />
              <Button onClick={handleGenerateReview} disabled={isGenerating || selectedTags.length === 0}
                className="w-full mt-6 bg-green-600 hover:bg-green-700">
                {isGenerating ? "Generating..." : "Generate My Review ✨"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === STEPS.POST && reviews.length > 0 && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-4">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={40} />
                <h2 className="text-xl font-semibold">Your review is ready!</h2>
                <p className="text-gray-500 text-sm mt-1">Copy it, then click "Post on Google"</p>
              </div>
              {reviews.length > 1 && (
                <div className="flex gap-2 justify-center mb-3">
                  {reviews.map((_, i) => (
                    <button key={i} onClick={() => setSelectedReview(i)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        i === selectedReview ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"
                      }`}>
                      Option {i + 1}
                    </button>
                  ))}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed min-h-[100px]">
                {reviews[selectedReview]}
              </div>
              <Button variant="outline" onClick={handleCopy} className="w-full mb-3">
                {copied ? <><CheckCircle size={16} className="mr-2 text-green-500" />Copied!</>
                         : <><Copy size={16} className="mr-2" />Copy Review</>}
              </Button>
              <Button onClick={handlePostOnGoogle} disabled={isPosting} className="w-full bg-blue-600 hover:bg-blue-700">
                {isPosting ? <><Loader2 size={16} className="mr-2 animate-spin" />Opening Google...</>
                           : <><ExternalLink size={16} className="mr-2" />Post on Google</>}
              </Button>
              <p className="text-xs text-gray-400 text-center mt-4">💡 Tip: Paste the copied review after Google opens</p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">Powered by M&M Fintech</p>
      </div>
    </div>
  );
}

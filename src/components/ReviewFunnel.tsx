import { useState, useEffect } from "react";
import { Star, Copy, ExternalLink, CheckCircle, RefreshCw } from "lucide-react";
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

interface ReviewFunnelProps {
  business: Business;
}

const STEPS = {
  RATING: "rating",
  GENERATE: "generate",
  POST: "post",
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

export default function ReviewFunnel({ business }: ReviewFunnelProps) {
  const [step, setStep] = useState<Step>(STEPS.RATING);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [generatedReviews, setGeneratedReviews] = useState<string[]>([]);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedReviewUrl, setResolvedReviewUrl] = useState<string | null>(null);
  const [isLoadingReviewUrl, setIsLoadingReviewUrl] = useState(false);

  useEffect(() => {
    const resolveUrl = async () => {
      if (!business) return;
      setIsLoadingReviewUrl(true);
      let urlToUse: string | null = null;

      if (business.google_place_id) {
        urlToUse = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
      } else if (business.google_review_link && business.google_review_link.includes("writereview")) {
        urlToUse = business.google_review_link;
      } else if (business.google_review_link) {
        try {
          const { data, error } = await supabase.functions.invoke("resolve-google-place", {
            body: { url: business.google_review_link, businessId: business.id },
          });
          if (error) {
            console.error("Error resolving Google review link:", error);
            urlToUse = business.google_review_link;
          } else if (data && data.reviewUrl) {
            urlToUse = data.reviewUrl;
          } else {
            urlToUse = business.google_review_link;
          }
        } catch (err) {
          console.error("Unexpected error resolving Google review link:", err);
          urlToUse = business.google_review_link;
        }
      }

      setResolvedReviewUrl(urlToUse);
      setIsLoadingReviewUrl(false);
    };

    resolveUrl();
  }, [business?.google_place_id, business?.google_review_link, business?.id]);
  const currentReview = generatedReviews[selectedReviewIndex] || "";

  const handleRatingSelect = (value: number) => {
    setRating(value);
    if (value >= 4) {
      setTimeout(() => setStep(STEPS.GENERATE), 300);
    } else {
      toast({
        title: "Thank you for your feedback",
        description: "We'll use this to improve our service.",
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateReview = async () => {
    if (selectedTags.length === 0) {
      toast({ title: "Select at least one option", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: {
          businessName: business.name,
          businessId: business.id,
          category: business.category,
          rating,
          tags: selectedTags,
        },
      });
      if (error) throw error;

      const reviews: string[] = data.reviews || (data.review ? [data.review] : []);
      if (reviews.length === 0) throw new Error("No reviews generated");

      setGeneratedReviews(reviews);
      setSelectedReviewIndex(0);
      setStep(STEPS.POST);
    } catch {
      toast({ title: "Error generating review. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handlePostOnGoogle = () => {
    if (isLoadingReviewUrl) return;
    if (!resolvedReviewUrl) {
      toast({ title: "No Google review link configured", variant: "destructive" });
      return;
    }
    window.open(resolvedReviewUrl, "_blank", "noopener,noreferrer");
  };

  const cycleReview = () => {
    if (generatedReviews.length > 1) {
      setSelectedReviewIndex((prev) => (prev + 1) % generatedReviews.length);
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
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
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingSelect(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={44}
                      className={
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
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
              <p className="text-gray-500 text-sm text-center mb-6">
                Select all that apply — we'll write the review for you!
              </p>
              <TagSelector category={business.category} selected={selectedTags} onToggle={toggleTag} />
              <Button
                onClick={handleGenerateReview}
                disabled={isGenerating || selectedTags.length === 0}
                className="w-full mt-6 bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? "Generating..." : "Generate My Review ✨"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === STEPS.POST && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-4">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={40} />
                <h2 className="text-xl font-semibold">Your review is ready!</h2>
                <p className="text-gray-500 text-sm mt-1">Copy it, then click "Post on Google"</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-2 text-sm text-gray-700 leading-relaxed min-h-[100px]">
                {currentReview}
              </div>

              {generatedReviews.length > 1 && (
                <button
                  onClick={cycleReview}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mx-auto mb-3"
                >
                  <RefreshCw size={12} />
                  Try another ({selectedReviewIndex + 1}/{generatedReviews.length})
                </button>
              )}

              <Button variant="outline" onClick={handleCopy} className="w-full mb-3">
                {copied ? (
                  <><CheckCircle size={16} className="mr-2 text-green-500" />Copied!</>
                ) : (
                  <><Copy size={16} className="mr-2" />Copy Review</>
                )}
              </Button>

              {(resolvedReviewUrl || isLoadingReviewUrl) ? (
                <Button
                  onClick={handlePostOnGoogle}
                  disabled={isLoadingReviewUrl || !resolvedReviewUrl}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  {isLoadingReviewUrl ? "Preparing link..." : "Post on Google"}
                </Button>
              ) : (
                <p className="text-center text-sm text-gray-400 mt-2">
                  Google review link not configured for this business.
                </p>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">
                💡 Tip: Paste the copied review after Google opens
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6 mb-2">Powered by M&M Fintech</p>
    </div>
  );
}

const BUSINESS_TAGS: Record<string, string[]> = {
  // Food & Beverage
  restaurant: ["Food Quality", "Taste", "Portion Size", "Service", "Ambience", "Value for Money", "Cleanliness", "Speed", "Staff Behaviour"],
  dhaba: ["Taste", "Authentic Flavour", "Quantity", "Value for Money", "Cleanliness", "Service Speed", "Seating"],
  cafe: ["Coffee Quality", "Snacks & Food", "Ambience", "WiFi", "Staff", "Value for Money", "Seating Comfort"],
  "fast food": ["Taste", "Speed", "Value for Money", "Cleanliness", "Portion Size", "Packaging", "Staff"],
  "sweet shop": ["Taste & Freshness", "Variety", "Packaging", "Value for Money", "Hygiene", "Staff Behaviour"],
  "juice bar": ["Freshness", "Taste", "Hygiene", "Value for Money", "Speed", "Variety"],
  bakery: ["Freshness", "Taste", "Variety", "Packaging", "Value for Money", "Staff"],
  "ice cream": ["Flavour Variety", "Taste", "Portion Size", "Value for Money", "Cleanliness", "Staff"],
  "tiffin service": ["Taste", "Timeliness", "Portion Size", "Value for Money", "Hygiene", "Variety"],

  // Retail & Shopping
  retail: ["Product Quality", "Variety", "Pricing", "Staff Helpfulness", "Billing Speed", "Cleanliness", "Return Policy"],
  grocery: ["Freshness", "Variety", "Pricing", "Staff", "Cleanliness", "Availability", "Billing Speed"],
  "mobile shop": ["Product Variety", "Pricing", "Staff Knowledge", "After-Sales Service", "Genuine Products", "Speed"],
  "clothing store": ["Variety", "Quality", "Pricing", "Staff Helpfulness", "Trial Room", "Billing Speed"],
  "jewellery shop": ["Design Variety", "Quality", "Pricing", "Staff Behaviour", "Transparency", "Packaging"],
    "medical store": ["Availability", "Pricing", "Staff Knowledge", "Cleanliness", "Speed"],
  "electronics shop": ["Product Variety", "Pricing", "Staff Knowledge", "After-Sales Service", "Genuine Products"],
  stationery: ["Variety", "Pricing", "Availability", "Staff", "Quality"],

  // Health & Wellness
  hospital: ["Doctor Expertise", "Staff Behaviour", "Cleanliness", "Wait Time", "Facilities", "Affordability"],
  clinic: ["Doctor Expertise", "Wait Time", "Staff Behaviour", "Cleanliness", "Affordability", "Availability"],
  pharmacy: ["Medicine Availability", "Staff Knowledge", "Pricing", "Cleanliness", "Speed"],
  gym: ["Equipment Quality", "Cleanliness", "Trainers", "Classes & Programs", "Value for Money", "Atmosphere", "Timings"],
  "yoga studio": ["Instructor Quality", "Cleanliness", "Atmosphere", "Timings", "Value for Money", "Batch Size"],
  spa: ["Service Quality", "Cleanliness", "Staff Behaviour", "Ambience", "Value for Money", "Relaxation"],
  "ayurveda clinic": ["Doctor Expertise", "Treatment Quality", "Cleanliness", "Staff Behaviour", "Affordability"],
  "diagnostic center": ["Report Accuracy", "Speed", "Staff Behaviour", "Cleanliness", "Affordability", "Home Collection"],

  // Beauty & Personal Care
  salon: ["Skill & Expertise", "Cleanliness & Hygiene", "Staff Behaviour", "Timing", "Value for Money", "Products Used", "Results"],
  "beauty parlour": ["Skill", "Hygiene", "Staff Behaviour", "Results", "Value for Money", "Ambience"],
  "mens salon": ["Haircut Quality", "Hygiene", "Staff Skill", "Speed", "Value for Money", "Behaviour"],
  "nail studio": ["Nail Art Quality", "Hygiene", "Product Quality", "Staff Skill", "Value for Money"],
  "tattoo studio": ["Artist Skill", "Design Quality", "Hygiene", "Safety", "Value for Money", "Behaviour"],

  // Automotive
  "car service": ["Service Quality", "Timely Delivery", "Transparency", "Staff Behaviour", "Value for Money", "Cleanliness"],
  "bike service": ["Service Quality", "Timely Delivery", "Transparency", "Value for Money", "Staff Behaviour"],
  "car wash": ["Cleaning Quality", "Speed", "Value for Money", "Staff Behaviour", "Care of Vehicle"],
  "tyre shop": ["Product Quality", "Speed", "Pricing", "Staff Knowledge", "Service"],
  "driving school": ["Instructor Behaviour", "Teaching Quality", "Timings", "Value for Money", "Vehicle Condition"],

  // Education
  "coaching class": ["Teaching Quality", "Study Material", "Doubt Solving", "Timings", "Value for Money", "Results"],
  school: ["Teaching Quality", "Faculty", "Infrastructure", "Activities", "Management", "Fees"],
  college: ["Faculty Quality", "Infrastructure", "Placement Support", "Management", "Value for Money"],
  "dance class": ["Instructor Quality", "Atmosphere", "Timings", "Value for Money", "Learning Speed"],
  "music class": ["Instructor Quality", "Instruments", "Timings", "Value for Money", "Curriculum"],
  "spoken english": ["Teaching Method", "Instructor", "Timings", "Value for Money", "Results"],

  // Home Services
  "interior designer": ["Design Quality", "On-Time Delivery", "Budget Adherence", "Communication", "Material Quality"],
  "plumber": ["Work Quality", "Speed", "Pricing", "Behaviour", "Reliability"],
  "electrician": ["Work Quality", "Speed", "Safety", "Pricing", "Behaviour"],
  "carpenter": ["Work Quality", "Material", "Pricing", "On-Time Delivery", "Behaviour"],
  "pest control": ["Effectiveness", "Safety", "Pricing", "Staff Behaviour", "Punctuality"],
  "cleaning service": ["Cleaning Quality", "Punctuality", "Staff Behaviour", "Value for Money", "Reliability"],
  "packers movers": ["Packing Quality", "Timely Delivery", "Pricing", "Staff Behaviour", "Item Safety"],

  // Finance & Professional Services
  "ca firm": ["Expertise", "Timely Filing", "Communication", "Transparency", "Value for Money"],
  "legal services": ["Expertise", "Communication", "Transparency", "Timely Delivery", "Fees"],
  "insurance agent": ["Product Knowledge", "Transparency", "After-Sales Support", "Behaviour", "Claim Support"],
  "real estate": ["Property Options", "Transparency", "Staff Behaviour", "After-Sales Service", "Value for Money"],
  "travel agent": ["Package Value", "Itinerary Quality", "Support", "Transparency", "Hotel Quality"],

  // Hospitality & Stay
  hotel: ["Room Cleanliness", "Staff Behaviour", "Food Quality", "Location", "Facilities", "Value for Money", "Check-in Speed"],
  "guest house": ["Cleanliness", "Staff Behaviour", "Value for Money", "Location", "Facilities"],
  "pg": ["Cleanliness", "Food Quality", "Security", "Value for Money", "Staff Behaviour", "WiFi"],
  "resort": ["Ambience", "Room Quality", "Staff Behaviour", "Food", "Activities", "Value for Money"],

  // Events & Entertainment
  "event planner": ["Creativity", "On-Time Execution", "Budget Adherence", "Decoration Quality", "Communication"],
  "photographer": ["Photo Quality", "Behaviour", "Timely Delivery", "Value for Money", "Equipment"],
  "catering": ["Food Taste", "Variety", "Presentation", "Timely Service", "Hygiene", "Value for Money"],
  "banquet hall": ["Venue Quality", "Cleanliness", "Staff", "Catering", "Value for Money", "Parking"],
  "cinema": ["Screen Quality", "Sound", "Cleanliness", "Seating Comfort", "Staff Behaviour", "Snacks"],

  // Default fallback
  default: ["Quality", "Service", "Value for Money", "Staff Behaviour", "Cleanliness", "Overall Experience"],
};

function getTagsForBusiness(category: string | null): string[] {
  if (!category) return BUSINESS_TAGS.default;
  const key = category.toLowerCase().trim();
  // Exact match first
  if (BUSINESS_TAGS[key]) return BUSINESS_TAGS[key];
  // Partial match — find closest key
  const match = Object.keys(BUSINESS_TAGS).find(
    (k) => k !== "default" && (key.includes(k) || k.includes(key))
  );
  return match ? BUSINESS_TAGS[match] : BUSINESS_TAGS.default;
}
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            selected.includes(tag)
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

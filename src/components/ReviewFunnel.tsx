import { useState, useEffect } from "react";
import { Star, Copy, ExternalLink, CheckCircle } from "lucide-react";
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
  const [generatedReview, setGeneratedReview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolved direct review URL (may differ from what's stored in DB)
  const [resolvedReviewUrl, setResolvedReviewUrl] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  // On mount: resolve the Google review link to the direct write-form URL
  useEffect(() => {
    const resolveUrl = async () => {
      // If google_place_id already set in DB, build URL directly — no API call needed
      if (business.google_place_id && business.google_place_id.trim() !== "") {
        setResolvedReviewUrl(
          `https://search.google.com/local/writereview?placeid=${business.google_place_id.trim()}`
        );
        return;
      }

      // If google_review_link is already a write-review URL, use it directly
      if (
        business.google_review_link &&
        business.google_review_link.includes("writereview")
      ) {
        setResolvedReviewUrl(business.google_review_link);
        return;
      }

      // Otherwise call the edge function to expand short URL + extract Place ID
      if (business.google_review_link) {
        setIsResolvingUrl(true);
        try {
          const { data, error } = await supabase.functions.invoke(
            "resolve-google-place",
            {
              body: {
                url: business.google_review_link,
                businessId: business.id, // edge fn will also update DB for next time
              },
            }
          );

          if (error) throw error;

          if (data?.reviewUrl) {
            setResolvedReviewUrl(data.reviewUrl);
          }
        } catch (err) {
          console.error("Failed to resolve Google review URL:", err);
          // Fallback: use whatever was stored
          setResolvedReviewUrl(business.google_review_link);
        } finally {
          setIsResolvingUrl(false);
        }
      }
    };

    resolveUrl();
  }, [business]);

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
      toast({
        title: "Select at least one option",
        description: "Please choose what you enjoyed before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: {
          businessName: business.name,
          category: business.category,
          rating,
          tags: selectedTags,
        },
      });

      if (error) throw error;

      // Support both data.review and data.reviews[0]
      const reviewText =
        data?.review ||
        (Array.isArray(data?.reviews) ? data.reviews[0] : null) ||
        "";

      setGeneratedReview(reviewText);
      setStep(STEPS.POST);

      await supabase.from("generated_reviews").insert({
        business_id: business.id,
        review_text: reviewText,
        rating,
        status: "generated",
      });
    } catch (err) {
      console.error("Error generating review:", err);
      toast({
        title: "Error generating review",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      await supabase
        .from("generated_reviews")
        .update({ status: "copied" })
        .eq("business_id", business.id)
        .eq("status", "generated");
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handlePostOnGoogle = async () => {
    if (!resolvedReviewUrl) {
      toast({
        title: "No Google review link configured",
        description: "Please contact the business owner.",
        variant: "destructive",
      });
      return;
    }

    await supabase
      .from("generated_reviews")
      .update({ status: "clicked" })
      .eq("business_id", business.id)
      .eq("status", "copied");

    // Opens directly to the Google review WRITE form
    window.open(resolvedReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Business Name */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 mt-1">Share your experience</p>
        </div>

        {/* Step: Rating */}
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
              {rating > 0 && (
                <p className="text-sm text-gray-500">
                  {rating === 5
                    ? "Excellent! 🎉"
                    : rating === 4
                    ? "Great! 😊"
                    : rating === 3
                    ? "Good 👍"
                    : "We'll improve 🙏"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Generate */}
        {step === STEPS.GENERATE && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <h2 className="text-xl font-semibold text-center mb-2">
                What did you enjoy?
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Select all that apply — we'll write the review for you!
              </p>
              <TagSelector
                category={business.category}
                selected={selectedTags}
                onToggle={toggleTag}
              />
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

        {/* Step: Post */}
        {step === STEPS.POST && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-4">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={40} />
                <h2 className="text-xl font-semibold">Your review is ready!</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Copy it, then click "Post on Google"
                </p>
              </div>

              {/* Review text */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed min-h-[100px]">
                {generatedReview}
              </div>

              {/* Copy button */}
              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full mb-3"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} className="mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    Copy Review
                  </>
                )}
              </Button>

              {/* Post on Google button */}
              {resolvedReviewUrl ? (
                <Button
                  onClick={handlePostOnGoogle}
                  disabled={isResolvingUrl}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  {isResolvingUrl ? "Preparing link..." : "Post on Google"}
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
    </div>
  );
}

// ── Tag Selector ──────────────────────────────────────────────────────────────

const BUSINESS_TAGS: Record<string, string[]> = {
  restaurant: ["Food Quality", "Service", "Ambience", "Value for Money", "Cleanliness", "Speed"],
  cafe: ["Coffee Quality", "Food", "Ambience", "Staff", "WiFi", "Value"],
  salon: ["Skill", "Cleanliness", "Staff", "Timing", "Value", "Products"],
  hotel: ["Room Quality", "Cleanliness", "Staff", "Location", "Facilities", "Value"],
  gym: ["Equipment", "Cleanliness", "Trainers", "Classes", "Value", "Atmosphere"],
  retail: ["Product Quality", "Staff", "Pricing", "Variety", "Service", "Store Layout"],
  default: ["Quality", "Service", "Value", "Staff", "Cleanliness", "Experience"],
};

function getTagsForBusiness(category: string | null): string[] {
  if (!category) return BUSINESS_TAGS.default;
  const key = category.toLowerCase();
  return BUSINESS_TAGS[key] ?? BUSINESS_TAGS.default;
}

function TagSelector({
  category,
  selected,
  onToggle,
}: {
  category: string | null;
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  const tags = getTagsForBusiness(category);
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

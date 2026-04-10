import { useState } from "react";
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

  const directReviewUrl = business.google_place_id
  ? `https://search.google.com/local/writereview?placeid=${business.google_place_id}`
  : business.google_review_link;
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
    if (!directReviewUrl) {
      toast({ title: "No Google review link configured", variant: "destructive" });
      return;
    }
    window.open(directReviewUrl, "_blank", "noopener,noreferrer");
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

              {directReviewUrl ? (
                <Button onClick={handlePostOnGoogle} className="w-full bg-blue-600 hover:bg-blue-700">
                  <ExternalLink size={16} className="mr-2" />
                  Post on Google
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
  restaurant: ["Food Quality", "Service", "Ambience", "Value for Money", "Cleanliness", "Speed"],
  cafe: ["Coffee Quality", "Food", "Ambience", "Staff", "WiFi", "Value"],
  salon: ["Skill", "Cleanliness", "Staff", "Timing", "Value", "Products"],
  hotel: ["Room Quality", "Cleanliness", "Staff", "Location", "Facilities", "Value"],
  gym: ["Equipment", "Cleanliness", "Trainers", "Classes", "Value", "Atmosphere"],
  retail: ["Product Quality", "Staff", "Pricing", "Variety", "Service", "Store Layout"],
  default: ["Quality", "Service", "Value", "Staff", "Cleanliness", "Experience"],
};

function TagSelector({ category, selected, onToggle }: { category: string | null; selected: string[]; onToggle: (tag: string) => void }) {
  const key = (category ?? "").toLowerCase();
  const tags = BUSINESS_TAGS[key] ?? BUSINESS_TAGS.default;
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

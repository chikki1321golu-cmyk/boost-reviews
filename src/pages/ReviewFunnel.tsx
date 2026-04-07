/**
 * ReviewFunnel.tsx  (Public page: /r/:slug)
 *
 * FIXED: "Post on Google" button now redirects directly to the
 * Google review composer, not the business profile page.
 */

import { useState } from "react";
import { Star, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { getDirectReviewUrl } from "@/utils/googlePlaceUtils";

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
  TAGS: "tags",
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

  // ✅ FIXED: Always uses the direct review URL (Place ID or write-review URL)
  const directReviewUrl = getDirectReviewUrl(business);

  const handleRatingSelect = (value: number) => {
    setRating(value);
    if (value >= 4) {
      setTimeout(() => setStep(STEPS.TAGS), 250);
    } else {
      toast({
        title: "Thank you for your feedback",
        description: "We appreciate your honest opinion.",
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    if (selectedTags.length === 0) {
      toast({ title: "Select at least one option", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: { businessName: business.name, category: business.category, rating, tags: selectedTags },
      });
      if (error) throw error;
      setGeneratedReview(data.review || "");

      await supabase.from("generated_reviews").insert({
        business_id: business.id,
        review_text: data.review,
        rating,
        status: "generated",
      });

      setStep(STEPS.POST);
    } catch {
      toast({ title: "Error generating review. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  // ✅ FIXED: Opens the Google review WRITE form directly, not just the profile
  const handlePostOnGoogle = () => {
    if (!directReviewUrl) {
      toast({
        title: "Review link not available",
        description: "Please contact the business owner.",
        variant: "destructive",
      });
      return;
    }
    window.open(directReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 mt-1 text-sm">Share your experience</p>
        </div>

        {step === STEPS.RATING && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">How was your experience?</h2>
              <p className="text-gray-400 text-sm mb-6">Tap a star to rate</p>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingSelect(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      size={48}
                      className={
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === STEPS.TAGS && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <h2 className="text-xl font-semibold text-center mb-1">What did you enjoy?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Select all that apply — we'll write the review for you!
              </p>
              <TagGrid
                category={business.category}
                selected={selectedTags}
                onToggle={toggleTag}
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedTags.length === 0}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
              >
                {isGenerating ? "Generating..." : "✨ Generate My Review"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === STEPS.POST && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-5">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={44} />
                <h2 className="text-xl font-semibold">Your review is ready!</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Step 1: Copy → Step 2: Post on Google → Paste & Submit
                </p>
              </div>

              <div className="bg-gray-50 border rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed min-h-[100px] whitespace-pre-wrap">
                {generatedReview}
              </div>

              <Button variant="outline" onClick={handleCopy} className="w-full mb-3">
                {copied ? (
                  <><CheckCircle size={16} className="mr-2 text-green-500" />Copied!</>
                ) : (
                  <><Copy size={16} className="mr-2" />Copy Review</>
                )}
              </Button>

              {directReviewUrl ? (
                <Button
                  onClick={handlePostOnGoogle}
                  className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-semibold"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Post on Google
                </Button>
              ) : (
                <p className="text-center text-sm text-gray-400">
                  Google review link not set up for this business.
                </p>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">
                💡 After clicking, paste the copied review in the Google form
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

const TAGS_BY_CATEGORY: Record<string, string[]> = {
  restaurant: ["Food Quality", "Taste", "Portion Size", "Service", "Ambience", "Value for Money"],
  cafe: ["Coffee", "Food", "Ambience", "Staff", "WiFi", "Value"],
  hotel: ["Rooms", "Cleanliness", "Staff", "Location", "Food", "Value"],
  salon: ["Skilled Staff", "Cleanliness", "Atmosphere", "On Time", "Value", "Products"],
  gym: ["Equipment", "Cleanliness", "Trainers", "Classes", "Atmosphere", "Value"],
  clinic: ["Doctor", "Staff", "Cleanliness", "Wait Time", "Diagnosis", "Overall Care"],
  shop: ["Product Quality", "Variety", "Pricing", "Staff", "Service", "Store Ambience"],
  default: ["Quality", "Service", "Staff", "Value", "Cleanliness", "Overall Experience"],
};

function TagGrid({
  category,
  selected,
  onToggle,
}: {
  category: string | null;
  selected: string[];
  onToggle: (t: string) => void;
}) {
  const key = (category ?? "").toLowerCase();
  const tags = TAGS_BY_CATEGORY[key] ?? TAGS_BY_CATEGORY.default;
  return (
    <div className="grid grid-cols-2 gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all text-left ${
            selected.includes(tag)
              ? "bg-green-600 text-white border-green-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-200 hover:border-green-300"
          }`}
        >
          {selected.includes(tag) ? "✓ " : ""}{tag}
        </button>
      ))}
    </div>
  );
}

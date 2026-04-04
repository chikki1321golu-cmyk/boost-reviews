import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Copy, ExternalLink, ArrowRight, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReviewTabs, { getTabsForBusiness } from "@/components/ReviewTabs";



const ReviewFunnel = () => {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  const [reviews, setReviews] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState("");
  const [editedReview, setEditedReview] = useState("");
  const [business, setBusiness] = useState<any>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (slug === "demo") {
      setBusiness({ id: "demo", name: "Demo Cafe", slug: "demo", google_review_link: "https://search.google.com/local/writereview?placeid=DEMO" });
      setLoadingBusiness(false);
      return;
    }
    const loadBusiness = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        setBusiness(data);
        await supabase.from("scans").insert({ business_id: data.id });
      }
      setLoadingBusiness(false);
    };
    if (slug) loadBusiness();
  }, [slug]);

  const businessName = business?.name || slug?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Business";
  const googleLink = business?.google_review_link || "https://search.google.com/local/writereview?placeid=PLACEHOLDER";


  const generateReviews = async () => {
    if (!business) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: { rating, tags: [], businessName: business.name, businessId: business.id },
      });
      if (error) throw error;
      setReviews(data.reviews || []);
      setStep(3);
    } catch (err: any) {
      toast.error("Failed to generate reviews. Please try again.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const selectReview = async (review: string) => {
    setSelectedReview(review);
    setEditedReview(review);
    setStep(4);
  };

  const copyReview = async () => {
    navigator.clipboard.writeText(editedReview);
    toast.success("Review copied to clipboard!");
    // Track copy in DB
    if (selectedReviewId) {
      await supabase.from("generated_reviews").update({ copied: true }).eq("id", selectedReviewId);
    }
  };

  const handleGoogleClick = async () => {
    if (selectedReviewId) {
      await supabase.from("generated_reviews").update({ google_clicked: true }).eq("id", selectedReviewId);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-heading font-bold text-xl text-foreground mb-2">Business not found</h1>
          <p className="text-muted-foreground">The review page for "{slug}" doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading font-bold text-xl text-foreground">{businessName}</h1>
          <p className="text-sm text-muted-foreground mt-1">We'd love your feedback!</p>
        </div>

        <div className="flex gap-1 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card text-center">
                <h2 className="font-heading font-semibold text-lg text-card-foreground mb-6">How was your experience?</h2>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                      <Star className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating) ? "fill-accent text-accent" : "text-border"}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <Button variant="hero" className="mt-4" onClick={() => setStep(2)}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
                <h2 className="font-heading font-semibold text-lg text-card-foreground mb-2">Tell us more</h2>
                <p className="text-sm text-muted-foreground mb-4">Tap a dimension to highlight what mattered most</p>
                <ReviewTabs
                  tabs={getTabsForBusiness(business?.category)}
                  rating={rating}
                />
                <Button variant="hero" className="w-full mt-4" onClick={generateReviews} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Review Suggestions
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="space-y-3">
                <h2 className="font-heading font-semibold text-lg text-card-foreground mb-1">Pick a review</h2>
                <p className="text-sm text-muted-foreground mb-4">AI-generated suggestions based on your feedback</p>
                {reviews.map((review, i) => (
                  <button key={i} onClick={() => selectReview(review)}
                    className="w-full text-left bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-elevated hover:border-primary/50 transition-all"
                  >
                    <p className="text-sm text-card-foreground leading-relaxed">{review}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
                <h2 className="font-heading font-semibold text-lg text-card-foreground mb-4">Edit & Post</h2>
                <textarea value={editedReview} onChange={(e) => setEditedReview(e.target.value)} rows={5}
                  className="w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-4"
                />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={copyReview}>
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                  <Button variant="hero" className="flex-1" asChild>
                    <a href={googleLink} target="_blank" rel="noopener noreferrer" onClick={handleGoogleClick}>
                      <ExternalLink className="w-4 h-4" /> Post on Google
                    </a>
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4 justify-center text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Thank you for your review!</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-8">Powered by M&M Fintech Digital Solution</p>
      </div>
    </div>
  );
};

export default ReviewFunnel;

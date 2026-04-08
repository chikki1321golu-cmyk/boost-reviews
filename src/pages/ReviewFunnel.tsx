import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReviewFunnel from "@/components/ReviewFunnel";

export default function ReviewFunnelPage() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchBusiness = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("businesses")
        .select("id, name, slug, category, google_review_link, google_place_id")
        .eq("slug", slug)
        .maybeSingle();
      if (err) {
        setError("Failed to load business.");
      } else if (!data) {
        setError("Business not found.");
      } else {
        setBusiness(data);
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error || "Business not found."}</p>
      </div>
    );
  }

  return <ReviewFunnel business={business} />;
}

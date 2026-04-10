import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import ReviewFunnel from "@/components/ReviewFunnel";
import { Loader2, AlertCircle } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  google_review_link: string | null;
  google_place_id: string | null;
}

const ReviewPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name, slug, category, google_review_link, google_place_id")
          .eq("slug", slug)
          .single();

        if (error || !data) { setNotFound(true); return; }

        setBusiness(data);

        // Record scan — fire and forget
        supabase.from("scans").insert({ business_id: data.id }).then(({ error: e }) => {
          if (e) console.error("Scan error:", e.message);
        });
      } catch (err) {
        console.error("ReviewPage error:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  if (loading) {
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

export default ReviewPage;

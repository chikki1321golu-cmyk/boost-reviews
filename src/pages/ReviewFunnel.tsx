import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import ReviewFunnelComponent from "@/components/ReviewFunnel";

export default function ReviewFunnelPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!business || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business not found</h1>
          <p className="text-gray-500">This review link may be invalid.</p>
        </div>
      </div>
    );
  }

  return <ReviewFunnelComponent business={business} />;
}

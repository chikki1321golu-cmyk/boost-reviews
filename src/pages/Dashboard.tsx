import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { QrCode, Sparkles, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      // Get user's business IDs
      const { data: businesses } = await supabase.from("businesses").select("id").eq("user_id", user!.id);
      const bizIds = businesses?.map((b) => b.id) || [];
      if (bizIds.length === 0) return { scans: 0, reviews: 0, copies: 0, clicks: 0 };

      const [scansRes, reviewsRes] = await Promise.all([
        supabase.from("scans").select("id", { count: "exact", head: true }).in("business_id", bizIds),
        supabase.from("generated_reviews").select("id, copied, google_clicked").in("business_id", bizIds),
      ]);

      const reviews = reviewsRes.data || [];
      return {
        scans: scansRes.count || 0,
        reviews: reviews.length,
        copies: reviews.filter((r) => r.copied).length,
        clicks: reviews.filter((r) => r.google_clicked).length,
      };
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Dashboard</h1>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard title="QR Scans" value={stats?.scans ?? 0} icon={QrCode} />
              <StatsCard title="Reviews Generated" value={stats?.reviews ?? 0} icon={Sparkles} />
              <StatsCard title="Reviews Copied" value={stats?.copies ?? 0} icon={Copy} />
              <StatsCard title="Google Clicks" value={stats?.clicks ?? 0} icon={ExternalLink} />
            </div>
            <AnalyticsCharts />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

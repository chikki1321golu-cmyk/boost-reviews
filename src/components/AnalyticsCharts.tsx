import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";

const AnalyticsCharts = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-charts", user?.id],
    queryFn: async () => {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user!.id);

      const bizIds = businesses?.map(b => b.id) || [];
      if (bizIds.length === 0) return [];

      const { data: reviews } = await supabase
        .from("generated_reviews")
        .select("id, status, created_at")
        .in("business_id", bizIds)
        .order("created_at", { ascending: true });

      if (!reviews || reviews.length === 0) return [];

      // Group by date (last 7 days)
      const days: Record<string, { date: string; generated: number; copied: number; clicked: number }> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        days[key] = { date: key, generated: 0, copied: 0, clicked: 0 };
      }

      reviews.forEach(r => {
        const key = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (days[key]) {
          days[key].generated++;
          if (r.status === "copied") days[key].copied++;
          if (r.status === "clicked") days[key].clicked++;
        }
      });

      return Object.values(days);
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0 || data.every(d => d.generated === 0)) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
        No activity yet. Share your QR code to start collecting reviews.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <h2 className="text-lg font-heading font-semibold text-card-foreground mb-4">Activity (Last 7 Days)</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
          <Bar dataKey="generated" name="Generated" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
          <Bar dataKey="copied" name="Copied" fill="#22c55e" radius={[4,4,0,0]} />
          <Bar dataKey="clicked" name="Google Clicks" fill="#3b82f6" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsCharts;

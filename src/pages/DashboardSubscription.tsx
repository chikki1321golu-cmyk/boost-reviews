import DashboardLayout from "@/components/DashboardLayout";
import PricingCards from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DashboardSubscription = () => {
  const { user } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const planLabel = subscription
    ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan`
    : "No Active Plan";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">Subscription</h1>
          <Badge variant="secondary" className="font-heading">{planLabel}</Badge>
        </div>
        <PricingCards />
      </div>
    </DashboardLayout>
  );
};

export default DashboardSubscription;

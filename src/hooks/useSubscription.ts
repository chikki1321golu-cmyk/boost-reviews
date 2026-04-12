import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export interface SubscriptionInfo {
  subscription: any | null;
  isPaid: boolean;
  canGenerateReviews: boolean;
  maxBusinesses: number;
  plan: string;
  isLoading: boolean;
  daysLeft: number;
}

const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  growth: 3,
  agency: 20,
};

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const now = new Date();

  // Only paid (non-trial) active subscriptions count
  const isPaid =
    !!subscription &&
    subscription.status === "active" &&
    subscription.plan !== "trial" &&
    (subscription.current_period_end === null ||
      new Date(subscription.current_period_end) > now);

  const canGenerateReviews = isPaid;
  const plan = isPaid ? (subscription?.plan ?? "none") : "none";
  const maxBusinesses = PLAN_LIMITS[plan] ?? 1;

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const daysLeft =
    isPaid && periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return {
    subscription,
    isPaid,
    canGenerateReviews,
    maxBusinesses,
    plan,
    isLoading,
    daysLeft,
  };
};

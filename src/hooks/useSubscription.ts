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
      // ✅ Fetch latest subscription without status filter
      // so manually activated plans are also picked up
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    // ✅ Re-fetch on window focus so plan changes reflect without hard refresh
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const now = new Date();

  // ✅ isPaid: must be active status, not trial, and not expired
  const isPaid =
    !!subscription &&
    subscription.status === "active" &&
    subscription.plan !== "trial" &&
    (subscription.current_period_end === null ||
      new Date(subscription.current_period_end) > now);

  const canGenerateReviews = isPaid;
  const plan = isPaid ? (subscription?.plan ?? "none") : "none";

  // ✅ Read max_businesses from DB row (kept correct by migrations)
  // Falls back to code-defined PLAN_LIMITS if DB value missing
  const maxBusinesses = isPaid
    ? (subscription?.max_businesses ?? PLAN_LIMITS[plan] ?? 0)
    : 0;

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

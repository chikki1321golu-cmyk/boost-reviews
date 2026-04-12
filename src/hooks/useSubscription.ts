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
      // ✅ FIXED: Fetch latest subscription without status filter.
      // Previously filtered .eq("status", "active") which missed edge cases.
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
    // ✅ Re-fetch when user switches back to tab — picks up admin-activated plans
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const now = new Date();

  // ✅ FIXED: isPaid checks status === "active" AND plan !== "trial"
  // The DB constraint only allows: active | cancelled | expired | past_due
  // so "active" is the only valid paid status — trial plan is excluded
  const isPaid =
    !!subscription &&
    subscription.status === "active" &&
    subscription.plan !== "trial" &&
    (subscription.current_period_end === null ||
      new Date(subscription.current_period_end) > now);

  const canGenerateReviews = isPaid;
  const plan = isPaid ? (subscription?.plan ?? "none") : "none";

  // ✅ FIXED: Read max_businesses directly from DB row (which we now keep correct)
  // Falls back to PLAN_LIMITS from code if the DB value is missing
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

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

// ✅ FIXED: Accept both "active" and "manually_activated" statuses
// so plans you activate manually in Supabase are also recognised
const PAID_STATUSES = ["active", "manually_activated"];

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      // ✅ FIXED: Query without status filter so we get the latest record,
      // then check the status in JS — this avoids missing manually-activated rows
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
    // ✅ FIXED: Re-fetch when window is focused so changes in Supabase
    // are reflected without the user needing to hard-refresh
    refetchOnWindowFocus: true,
    staleTime: 30_000, // 30 seconds
  });

  const now = new Date();

  // ✅ FIXED: isPaid now accepts both "active" and "manually_activated"
  const isPaid =
    !!subscription &&
    PAID_STATUSES.includes(subscription.status) &&
    subscription.plan !== "trial" &&
    (subscription.current_period_end === null ||
      new Date(subscription.current_period_end) > now);

  const canGenerateReviews = isPaid;
  const plan = isPaid ? (subscription?.plan ?? "none") : "none";

  // ✅ FIXED: fallback to 0 when plan is unrecognised and user is paid
  // (previously fell back to 1 which could allow unintended access)
  const maxBusinesses = isPaid ? (PLAN_LIMITS[plan] ?? 0) : 0;

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

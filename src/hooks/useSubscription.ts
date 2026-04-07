import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export interface SubscriptionInfo {
  subscription: any | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isPaid: boolean;
  canGenerateReviews: boolean;
  maxBusinesses: number;
  trialDaysLeft: number;
  plan: string;
  isLoading: boolean;
}

const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  growth: 3,
  agency: 20,
};

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();

  // Fetch the most recent active subscription
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
  const isTrial = subscription?.is_trial ?? false;
  const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;

  // Trial is active only if is_trial=true AND trial hasn't expired
  const isTrialActive = isTrial && !!trialEnd && trialEnd > now;
  // Trial expired = was a trial but time ran out
  const isTrialExpired = isTrial && !!trialEnd && trialEnd <= now;

  // Paid = not a trial AND status is active
  const isPaid = !isTrial && subscription?.status === "active";

  // Can generate reviews only during active trial or with paid plan
  const canGenerateReviews = isTrialActive || isPaid;

  const plan = subscription?.plan ?? "none";
  const maxBusinesses = PLAN_LIMITS[plan] ?? 1;

  const trialDaysLeft =
    isTrialActive && trialEnd
      ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return {
    subscription,
    isTrialActive,
    isTrialExpired,
    isPaid,
    canGenerateReviews,
    maxBusinesses,
    trialDaysLeft,
    plan,
    isLoading,
  };
};

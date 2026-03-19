import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  trial: 1,
  starter: 1,
  growth: 3,
  agency: Infinity,
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
  const isTrial = subscription?.is_trial ?? false;
  const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const isTrialActive = isTrial && !!trialEnd && trialEnd > now;
  const isTrialExpired = isTrial && !!trialEnd && trialEnd <= now;
  const isPaid = !isTrial && subscription?.status === "active";
  const canGenerateReviews = isTrialActive || isPaid;
  const plan = subscription?.plan ?? "none";
  const maxBusinesses = PLAN_LIMITS[plan] ?? 1;

  const trialDaysLeft = isTrialActive && trialEnd
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

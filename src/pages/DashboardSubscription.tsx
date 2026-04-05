import DashboardLayout from "@/components/DashboardLayout";
import PricingCards from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Clock, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";

const DashboardSubscription = () => {
  const { user } = useAuth();
  const { subscription, isTrialActive, isTrialExpired, isPaid, trialDaysLeft, plan } = useSubscription();

  const { data: payments } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const planLabel = isPaid
    ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
    : isTrialActive
      ? `Trial (${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left)`
      : "No Active Plan";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">Subscription</h1>
          <Badge variant={isTrialExpired ? "destructive" : "secondary"} className="font-heading">
            {planLabel}
          </Badge>
        </div>

        {/* Trial / Subscription Status Card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card mb-6">
          {isTrialActive && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-heading font-semibold text-card-foreground">Free Trial Active</p>
                <p className="text-sm text-muted-foreground">
                  You have {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining. All features are available. After your trial, upgrade to keep generating AI reviews.
                </p>
              </div>
            </div>
          )}
          {isTrialExpired && (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-heading font-semibold text-card-foreground">Trial Expired</p>
                <p className="text-sm text-muted-foreground">
                  Your free trial has ended. QR scans still work, but AI review generation is disabled. Upgrade below to unlock all features.
                </p>
              </div>
            </div>
          )}
          {isPaid && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-heading font-semibold text-card-foreground">Active Subscription</p>
                <p className="text-sm text-muted-foreground">
                  Your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan renews every 28 days.
                  {subscription?.current_period_end && ` Next renewal: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          )}
        </div>

        <PricingCards />

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment History
            </h2>
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-card-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-card-foreground">₹{(p.amount / 100).toFixed(2)}</td>
                      <td className="p-3">
                        <Badge variant={p.status === "success" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardSubscription;

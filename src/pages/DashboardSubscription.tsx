import DashboardLayout from "@/components/DashboardLayout";
import PricingCards from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, CreditCard } from "lucide-react";

const DashboardSubscription = () => {
  const { user } = useAuth();
  const { subscription, isPaid, plan, daysLeft } = useSubscription();

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
    : "No Active Plan";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">Subscription</h1>
          <Badge variant={isPaid ? "default" : "destructive"} className="font-heading">
            {planLabel}
          </Badge>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card mb-6">
          {isPaid ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-heading font-semibold text-card-foreground">Active Subscription</p>
                <p className="text-sm text-muted-foreground">
                  Your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan is active.
                  {daysLeft > 0 && ` ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining.`}
                  {subscription?.current_period_end &&
                    ` Expires: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-heading font-semibold text-card-foreground">No Active Plan</p>
                <p className="text-sm text-muted-foreground">
                  All features are locked. Pay via UPI and choose a plan below to activate your account.
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

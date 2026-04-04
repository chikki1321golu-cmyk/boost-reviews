import { useRazorpay, PlanId } from "@/hooks/useRazorpay";
import { useAuth } from "@/hooks/useAuth"; // adjust path if different in your project
import { Check } from "lucide-react";

const PLANS = [
  {
    id: "starter" as PlanId,
    name: "Starter",
    price: 499,
    period: "/month",
    description: "Perfect for small businesses",
    color: "border-gray-200",
    features: [
      "1 business",
      "100 AI reviews/month",
      "Basic analytics",
      "QR code generator",
      "Email support",
    ],
    popular: false,
  },
  {
    id: "growth" as PlanId,
    name: "Growth",
    price: 1499,
    period: "/month",
    description: "For growing businesses",
    color: "border-green-600",
    features: [
      "3 businesses",
      "Unlimited AI reviews",
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "QR poster download",
    ],
    popular: true,
  },
  {
    id: "agency" as PlanId,
    name: "Agency",
    price: 3999,
    period: "/month",
    description: "For agencies & enterprises",
    color: "border-gray-200",
    features: [
      "20 businesses",
      "Unlimited AI reviews",
      "White-label dashboard",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
    popular: false,
  },
];

export default function SubscriptionPlans() {
  const { initiatePayment, loading } = useRazorpay();
  const { user } = useAuth(); // provides user.email, user.user_metadata?.full_name

  const handleUpgrade = (planId: PlanId) => {
    if (!user) return;
    initiatePayment(planId, user.email!, user.user_metadata?.full_name);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Choose your plan</h1>
        <p className="text-muted-foreground">
          Upgrade to unlock more businesses and unlimited AI reviews
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-card rounded-2xl border-2 ${plan.color} p-6 shadow-card flex flex-col`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">₹</span>
                <span className="text-4xl font-bold text-foreground">
                  {plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
                ${plan.popular
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "Processing..." : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Secure payments powered by Razorpay · All prices in INR · Cancel anytime
      </p>
    </div>
  );
}

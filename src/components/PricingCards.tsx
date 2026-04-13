import { useState } from "react";
import { CheckCircle2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const UPI_ID = "revuza@ptaxis"; // ← replace with your actual UPI ID

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "₹499",
    period: "/28 days",
    features: ["1 business", "100 AI reviews/month", "Basic analytics", "QR code generator"],
    bestFor: "Best for: small shops, salons, cafes",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹1,499",
    period: "/28 days",
    features: ["3 businesses", "Unlimited AI reviews", "Advanced analytics", "Custom branding", "Priority support"],
    bestFor: null,
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "₹3,999",
    period: "/28 days",
    features: ["20 businesses", "White-label dashboard", "Remove \"Powered by\"", "Bulk QR generation", "Team access"],
    bestFor: null,
    popular: false,
  },
];

const PricingCards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast({ title: "UPI ID copied!" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePlanClick = () => {
    if (!user) { navigate("/signup"); return; }
  };

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-6 border transition-shadow duration-300 ${
              plan.popular
                ? "border-primary bg-card shadow-elevated scale-[1.02]"
                : "border-border bg-card shadow-card hover:shadow-elevated"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold">
                Most Popular
              </div>
            )}
            <h3 className="font-heading font-bold text-lg text-card-foreground mb-1">{plan.name}</h3>
            <div className="mb-2">
              <span className="text-3xl font-heading font-bold text-card-foreground">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Renews every 28 days</p>
            {plan.bestFor && (
              <p className="text-xs text-muted-foreground italic mb-3">{plan.bestFor}</p>
            )}
            <ul className="space-y-3 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? "hero" : "outline"}
              className="w-full"
              onClick={handlePlanClick}
            >
              {!user ? "Sign up to buy" : `Choose ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      {/* UPI Payment Instructions */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <h3 className="font-heading font-bold text-base text-foreground mb-1">How to activate your plan</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pay via UPI and send us your payment screenshot — we'll activate your plan within a few hours.
        </p>
        <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 mb-4 w-fit">
          <span className="text-sm font-mono font-semibold text-foreground">{UPI_ID}</span>
          <button onClick={copyUPI} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
          <li>Choose a plan above and note the amount</li>
          <li>Pay to the UPI ID above from any UPI app (GPay, PhonePe, Paytm, etc.)</li>
          <li>In the payment note, write your registered email and plan name</li>
          <li>Send the payment screenshot to us via WhatsApp or email</li>
          <li>Your plan will be activated within a few hours</li>
        </ol>
      </div>
    </div>
  );
};

export default PricingCards;

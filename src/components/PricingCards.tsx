import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["1 business", "50 scans/month", "Basic analytics", "QR code generator"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    features: ["1 business", "500 scans/month", "AI review suggestions", "Full analytics", "Custom QR branding"],
    cta: "Start Starter",
    popular: false,
  },
  {
    name: "Growth",
    price: "₹1,499",
    period: "/month",
    features: ["3 businesses", "Unlimited scans", "AI review suggestions", "Advanced analytics", "Priority support"],
    cta: "Start Growth",
    popular: true,
  },
  {
    name: "Agency",
    price: "₹3,999",
    period: "/month",
    features: ["Unlimited businesses", "Unlimited scans", "White-label QR codes", "API access", "Dedicated account manager"],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingCards = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {plans.map((plan) => (
      <div
        key={plan.name}
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
        <div className="mb-5">
          <span className="text-3xl font-heading font-bold text-card-foreground">{plan.price}</span>
          <span className="text-muted-foreground text-sm">{plan.period}</span>
        </div>
        <ul className="space-y-3 mb-6">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Link to="/signup">
          <Button
            variant={plan.popular ? "hero" : "outline"}
            className="w-full"
          >
            {plan.cta}
          </Button>
        </Link>
      </div>
    ))}
  </div>
);

export default PricingCards;

import DashboardLayout from "@/components/DashboardLayout";
import PricingCards from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";

const DashboardSubscription = () => (
  <DashboardLayout>
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Subscription</h1>
        <Badge variant="secondary" className="font-heading">Free Plan</Badge>
      </div>
      <PricingCards />
    </div>
  </DashboardLayout>
);

export default DashboardSubscription;

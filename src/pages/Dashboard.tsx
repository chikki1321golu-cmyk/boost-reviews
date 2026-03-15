import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { QrCode, Sparkles, Copy, ExternalLink } from "lucide-react";

const Dashboard = () => (
  <DashboardLayout>
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="QR Scans" value={1284} icon={QrCode} change="+12% this week" />
        <StatsCard title="Reviews Generated" value={843} icon={Sparkles} change="+8% this week" />
        <StatsCard title="Reviews Copied" value={612} icon={Copy} change="+15% this week" />
        <StatsCard title="Google Clicks" value={487} icon={ExternalLink} change="+10% this week" />
      </div>
      <AnalyticsCharts />
    </div>
  </DashboardLayout>
);

export default Dashboard;

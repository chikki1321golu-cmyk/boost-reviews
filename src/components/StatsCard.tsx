import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
}

const StatsCard = ({ title, value, icon: Icon, change }: StatsCardProps) => (
  <div className="bg-card rounded-xl p-6 border border-border shadow-card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground font-medium">{title}</span>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    <p className="text-3xl font-heading font-bold text-card-foreground">{value}</p>
    {change && <p className="text-sm text-primary mt-1 font-medium">{change}</p>}
  </div>
);

export default StatsCard;

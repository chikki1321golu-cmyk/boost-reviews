import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const last30Days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 29 + i);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const scans = Math.floor(30 + Math.random() * 60 + i * 1.5);
  const reviews = Math.floor(scans * (0.4 + Math.random() * 0.25));
  const copies = Math.floor(reviews * (0.55 + Math.random() * 0.2));
  const clicks = Math.floor(copies * (0.6 + Math.random() * 0.2));
  return { date: label, scans, reviews, copies, clicks };
});

const conversionData = last30Days.map((d) => ({
  date: d.date,
  scanToReview: Math.round((d.reviews / d.scans) * 100),
  reviewToCopy: Math.round((d.copies / d.reviews) * 100),
  copyToClick: Math.round((d.clicks / d.copies) * 100),
}));

const areaConfig: ChartConfig = {
  scans: { label: "QR Scans", color: "hsl(160 84% 28%)" },
  reviews: { label: "Reviews", color: "hsl(38 92% 55%)" },
  copies: { label: "Copies", color: "hsl(200 80% 50%)" },
  clicks: { label: "Google Clicks", color: "hsl(280 60% 55%)" },
};

const convConfig: ChartConfig = {
  scanToReview: { label: "Scan → Review", color: "hsl(160 84% 28%)" },
  reviewToCopy: { label: "Review → Copy", color: "hsl(38 92% 55%)" },
  copyToClick: { label: "Copy → Click", color: "hsl(200 80% 50%)" },
};

const AnalyticsCharts = () => (
  <div className="grid gap-6 lg:grid-cols-2">
    {/* Scan & Review Trends */}
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Activity Trends</CardTitle>
        <CardDescription>Daily funnel metrics over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scans">Scans</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ChartContainer config={areaConfig} className="h-[300px] w-full">
              <AreaChart data={last30Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="scans" stackId="1" fill="var(--color-scans)" stroke="var(--color-scans)" fillOpacity={0.25} />
                <Area type="monotone" dataKey="reviews" stackId="1" fill="var(--color-reviews)" stroke="var(--color-reviews)" fillOpacity={0.25} />
                <Area type="monotone" dataKey="copies" stackId="1" fill="var(--color-copies)" stroke="var(--color-copies)" fillOpacity={0.25} />
                <Area type="monotone" dataKey="clicks" stackId="1" fill="var(--color-clicks)" stroke="var(--color-clicks)" fillOpacity={0.25} />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="scans">
            <ChartContainer config={areaConfig} className="h-[300px] w-full">
              <AreaChart data={last30Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="scans" fill="var(--color-scans)" stroke="var(--color-scans)" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="reviews">
            <ChartContainer config={areaConfig} className="h-[300px] w-full">
              <AreaChart data={last30Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="reviews" fill="var(--color-reviews)" stroke="var(--color-reviews)" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {/* Conversion Rates */}
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Conversion Rates</CardTitle>
        <CardDescription>Funnel step conversion % (30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={convConfig} className="h-[260px] w-full">
          <BarChart data={conversionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={6} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} unit="%" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="scanToReview" fill="var(--color-scanToReview)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="reviewToCopy" fill="var(--color-reviewToCopy)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="copyToClick" fill="var(--color-copyToClick)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>

    {/* Weekly Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Weekly Summary</CardTitle>
        <CardDescription>Aggregated by week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={areaConfig} className="h-[260px] w-full">
          <BarChart
            data={[0, 1, 2, 3].map((w) => {
              const slice = last30Days.slice(w * 7, (w + 1) * 7);
              return {
                week: `Week ${w + 1}`,
                scans: slice.reduce((s, d) => s + d.scans, 0),
                reviews: slice.reduce((s, d) => s + d.reviews, 0),
                copies: slice.reduce((s, d) => s + d.copies, 0),
                clicks: slice.reduce((s, d) => s + d.clicks, 0),
              };
            })}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="scans" fill="var(--color-scans)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="reviews" fill="var(--color-reviews)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  </div>
);

export default AnalyticsCharts;

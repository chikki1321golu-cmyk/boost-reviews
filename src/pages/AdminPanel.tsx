import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Users, CreditCard, ShieldCheck, Search,
  CheckCircle2, XCircle, Clock, RefreshCw,
  ChevronDown, Loader2, Building2, BarChart3,
} from "lucide-react";

type Plan = "starter" | "growth";

const PLAN_PRICES: Record<Plan, string> = {
  starter: "₹499",
  growth: "₹1,499",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-blue-100 text-blue-700",
  growth: "bg-green-100 text-green-700",
  trial: "bg-yellow-100 text-yellow-700",
  none: "bg-gray-100 text-gray-500",
};

// ── Hook: check if current user is admin ──────────────────────────────────
function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
}

// ── Hook: fetch all users with their subscription + business count ─────────
function useAllUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all subscriptions
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      // Get all businesses (count per user)
      const { data: bizList } = await supabase
        .from("businesses")
        .select("id, user_id, name");

      // Get all scans count
      const { data: scanData } = await supabase
        .from("scans")
        .select("id, business_id");

      // Get all generated reviews count
      const { data: reviewData } = await supabase
        .from("generated_reviews")
        .select("id, business_id");

      // Map business IDs to user IDs
      const bizByUser: Record<string, typeof bizList> = {};
      (bizList || []).forEach((b) => {
        if (!bizByUser[b.user_id]) bizByUser[b.user_id] = [];
        bizByUser[b.user_id]!.push(b);
      });

      const bizIdToUserId: Record<string, string> = {};
      (bizList || []).forEach((b) => { bizIdToUserId[b.id] = b.user_id; });

      // Count scans/reviews per user
      const scansPerUser: Record<string, number> = {};
      (scanData || []).forEach((s) => {
        const uid = bizIdToUserId[s.business_id];
        if (uid) scansPerUser[uid] = (scansPerUser[uid] || 0) + 1;
      });

      const reviewsPerUser: Record<string, number> = {};
      (reviewData || []).forEach((r) => {
        const uid = bizIdToUserId[r.business_id];
        if (uid) reviewsPerUser[uid] = (reviewsPerUser[uid] || 0) + 1;
      });

      // Unique users from subscriptions + businesses
      const userIds = Array.from(new Set([
        ...(subs || []).map((s) => s.user_id),
        ...Object.keys(bizByUser),
      ]));

      return userIds.map((uid) => {
        const sub = (subs || []).find((s) => s.user_id === uid && s.status === "active") ||
                    (subs || []).find((s) => s.user_id === uid);
        const now = new Date();
        const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
        const isExpired = periodEnd && periodEnd <= now;
        const isPaid = sub?.status === "active" && sub?.plan !== "trial" && !isExpired;

        return {
          user_id: uid,
          sub,
          isPaid,
          isExpired,
          periodEnd,
          businesses: bizByUser[uid] || [],
          scans: scansPerUser[uid] || 0,
          reviews: reviewsPerUser[uid] || 0,
        };
      });
    },
  });
}

// ── Activate / Update Plan modal ──────────────────────────────────────────
function PlanModal({
  userId,
  currentSub,
  onClose,
}: {
  userId: string;
  currentSub: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [plan, setPlan] = useState<Plan>((currentSub?.plan as Plan) || "starter");
  const [days, setDays] = useState(28);

  const { mutate: activate, isPending } = useMutation({
    mutationFn: async () => {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + days);

      if (currentSub) {
        // Update existing
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", currentSub.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "✅ Plan activated successfully!" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const { mutate: deactivate, isPending: deactivating } = useMutation({
    mutationFn: async () => {
      if (!currentSub) return;
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", currentSub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Plan deactivated" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Manage Plan</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {(["starter", "growth"] as Plan[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                    plan === p
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="capitalize">{p}</div>
                  <div className="text-xs opacity-70">{PLAN_PRICES[p]}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Duration (days)
            </label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              Expires: {new Date(Date.now() + days * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={() => activate()}
            disabled={isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            Activate
          </Button>
          {currentSub?.status === "active" && (
            <Button
              variant="destructive"
              onClick={() => deactivate()}
              disabled={deactivating}
              className="flex-1"
            >
              {deactivating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              Deactivate
            </Button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: users, isLoading: loadingUsers, refetch } = useAllUsers();
  const [search, setSearch] = useState("");
  const [modalUser, setModalUser] = useState<{ userId: string; sub: any } | null>(null);

  // Redirect non-admins
  if (!checkingAdmin && !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const filtered = (users || []).filter((u) =>
    u.user_id.toLowerCase().includes(search.toLowerCase()) ||
    u.businesses.some((b: any) => b.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUsers = users?.length || 0;
  const paidUsers = users?.filter((u) => u.isPaid).length || 0;
  const totalScans = users?.reduce((s, u) => s + u.scans, 0) || 0;
  const totalReviews = users?.reduce((s, u) => s + u.reviews, 0) || 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-heading font-bold text-foreground">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600" },
            { label: "Paid Users", value: paidUsers, icon: CreditCard, color: "text-green-600" },
            { label: "Total Scans", value: totalScans, icon: BarChart3, color: "text-purple-600" },
            { label: "Reviews Generated", value: totalReviews, icon: CheckCircle2, color: "text-orange-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user ID or business name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left p-3 font-medium text-muted-foreground">User ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Businesses</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Expires</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Scans</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Reviews</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const plan = u.sub?.plan || "none";
                    const statusBadge = u.isPaid
                      ? { label: "Active", color: "bg-green-100 text-green-700" }
                      : u.isExpired
                      ? { label: "Expired", color: "bg-red-100 text-red-700" }
                      : u.sub?.status === "active"
                      ? { label: "Active", color: "bg-green-100 text-green-700" }
                      : { label: "No Plan", color: "bg-gray-100 text-gray-500" };

                    return (
                      <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {u.user_id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-foreground">{u.businesses.length}</span>
                            {u.businesses[0] && (
                              <span className="text-muted-foreground text-xs truncate max-w-[100px]">
                                · {u.businesses[0].name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[plan] || PLAN_COLORS.none}`}>
                            {plan === "none" ? "—" : plan.charAt(0).toUpperCase() + plan.slice(1)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {u.periodEnd ? (
                            <span className={u.isExpired ? "text-red-500" : ""}>
                              {u.periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="p-3 text-foreground">{u.scans}</td>
                        <td className="p-3 text-foreground">{u.reviews}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setModalUser({ userId: u.user_id, sub: u.sub })}
                            className="text-xs h-7"
                          >
                            <ChevronDown className="w-3 h-3 mr-1" />
                            Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Activate by User ID */}
        <div className="mt-6 bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Quick Activate by User ID
          </h3>
          <QuickActivate />
        </div>
      </div>

      {/* Plan Modal */}
      {modalUser && (
        <PlanModal
          userId={modalUser.userId}
          currentSub={modalUser.sub}
          onClose={() => setModalUser(null)}
        />
      )}
    </DashboardLayout>
  );
}

// ── Quick activate form ───────────────────────────────────────────────────
function QuickActivate() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<Plan>("starter");
  const [days, setDays] = useState(28);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!userId.trim()) throw new Error("User ID is required");
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + days);

      // Check if subscription exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId.trim())
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("user_id", userId.trim());
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId.trim(),
            plan,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "✅ Plan activated!" });
      setUserId("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
        <Input
          placeholder="Paste user UUID here"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as Plan)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="starter">Starter — ₹499</option>
          <option value="growth">Growth — ₹1,499</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Days</label>
        <Input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          min={1}
          className="w-20"
        />
      </div>
      <Button
        onClick={() => mutate()}
        disabled={isPending || !userId.trim()}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
        Activate
      </Button>
    </div>
  );
}

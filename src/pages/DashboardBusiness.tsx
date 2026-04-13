import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Building2, Plus, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";

const DashboardBusiness = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { maxBusinesses, canGenerateReviews } = useSubscription();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [googleLink, setGoogleLink] = useState("");

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("businesses").insert({
        user_id: user!.id,
        name,
        slug,
        category: category || null,
        google_review_link: googleLink || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Business created!");
      setName(""); setSlug(""); setCategory(""); setGoogleLink("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Business deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Business Profile</h1>

        {/* Existing Businesses */}
        {businesses && businesses.length > 0 && (
          <div className="space-y-3 mb-6">
            {businesses.map((b) => (
              <div key={b.id} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-card-foreground">{b.name}</p>
                  <p className="text-sm text-muted-foreground">/r/{b.slug} · {b.category || "Uncategorized"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {businesses && businesses.length >= maxBusinesses ? (
          <div className="bg-card rounded-xl border border-border p-6 shadow-card text-center">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3 text-amber-500" />
            <h2 className="font-heading font-semibold text-card-foreground mb-2">Business Limit Reached</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your current plan allows up to {maxBusinesses} business(es). Upgrade to add more.
            </p>
            <Link to="/dashboard/subscription">
              <Button variant="hero">Upgrade Plan</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-card-foreground">Add Business</h2>
                <p className="text-sm text-muted-foreground">Set up your business to start collecting reviews.</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name</Label>
                <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }} placeholder="Café Sunshine" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cafe-sunshine" className="mt-1" required />
                <p className="text-xs text-muted-foreground mt-1">Your review page: /r/{slug || "your-slug"}</p>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Restaurant, Salon, Clinic..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="google">Google Review Link</Label>
                <Input id="google" value={googleLink} onChange={(e) => setGoogleLink(e.target.value)} placeholder="https://g.page/r/..." className="mt-1" />
              </div>
              <Button variant="hero" className="w-full mt-2" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Business
              </Button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardBusiness;

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Building2, Plus } from "lucide-react";

const DashboardBusiness = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [googleLink, setGoogleLink] = useState("");

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Business Profile</h1>
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-card-foreground">Create Business</h2>
              <p className="text-sm text-muted-foreground">Set up your business to start collecting reviews.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }} placeholder="Café Sunshine" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cafe-sunshine" className="mt-1" />
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
            <Button variant="hero" className="w-full mt-2">
              <Plus className="w-4 h-4" /> Create Business
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBusiness;

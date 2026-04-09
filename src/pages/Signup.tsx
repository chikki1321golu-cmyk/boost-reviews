import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import revuzaLogo from "@/assets/revuza-logo.png";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Create a 7-day trial subscription for starter plan on signup
    if (data.user) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      await supabase.from("subscriptions").insert({
        user_id: data.user.id,
        plan: "starter",
        status: "active",
        is_trial: true,
        trial_end: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
      });
    }

    setLoading(false);
    toast.success("Account created! Your 7-day free trial has started.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={revuzaLogo} alt="Revuza" className="h-10 w-10 object-contain" />
            <span className="font-heading font-bold text-xl text-foreground">Revuza</span>
          </Link>
          <h1 className="font-heading font-bold text-xl text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start your 7-day free trial today</p>
        </div>

        {/* Trial badge */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 text-center">
          <p className="text-sm text-primary font-semibold">🎉 7-day free trial included</p>
          <p className="text-xs text-muted-foreground mt-0.5">Trial starts on signup · Starter plan · No credit card required</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" minLength={6} required />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Start Free Trial
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

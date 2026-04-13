import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import revuzaLogo from "@/assets/revuza-logo.jpeg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts the token in the URL hash:
    // /reset-password#access_token=xxx&refresh_token=xxx&type=recovery
    // We need to parse it and set the session manually.
    const hash = window.location.hash;

    if (hash && hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error) {
            console.error("setSession error:", error.message);
            setTokenValid(false);
          } else {
            setTokenValid(true);
            // Clean the hash from the URL without reloading
            window.history.replaceState(null, "", window.location.pathname);
          }
        });
        return;
      }
    }

    // No hash token — check if already in a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    });

    // Also listen for PASSWORD_RECOVERY event (fallback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTokenValid(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={revuzaLogo} alt="Revuza" className="h-10 w-auto" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          {tokenValid === null && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Verifying reset link…</p>
            </div>
          )}

          {tokenValid === false && (
            <div className="text-center py-4">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h2 className="font-heading font-semibold text-card-foreground mb-2">Link expired</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This password reset link has expired or already been used. Request a new one.
              </p>
              <Link to="/forgot-password">
                <Button variant="hero" className="w-full">Request new link</Button>
              </Link>
            </div>
          )}

          {done && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="font-heading font-semibold text-card-foreground mb-2">Password updated!</h2>
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
            </div>
          )}

          {tokenValid === true && !done && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="mt-1"
                  required
                />
              </div>
              <Button variant="hero" className="w-full" type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReviewFunnelPage from "./pages/ReviewFunnel";
import Dashboard from "./pages/Dashboard";
import DashboardBusiness from "./pages/DashboardBusiness";
import DashboardQRCode from "./pages/DashboardQRCode";
import DashboardSubscription from "./pages/DashboardSubscription";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FAQ from "./pages/FAQ";
import AdminPanel from "./pages/AdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient();

// ✅ NEW: Admin-only route guard — checks the admins table in Supabase
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
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

  // Wait for auth + admin check to finish
  if (loading || adminLoading) return null;

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not admin → redirect to dashboard
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/r/:slug" element={<ReviewFunnelPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/business" element={<ProtectedRoute><DashboardBusiness /></ProtectedRoute>} />
            <Route path="/dashboard/qrcode" element={<ProtectedRoute><DashboardQRCode /></ProtectedRoute>} />
            <Route path="/dashboard/subscription" element={<ProtectedRoute><DashboardSubscription /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            <Route path="/faq" element={<FAQ />} />
            {/* ✅ FIXED: /admin now uses AdminRoute — only you (in admins table) can access it */}
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

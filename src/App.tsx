import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

// ✅ AdminRoute uses <Outlet /> pattern so it runs INSIDE
// QueryClientProvider + AuthProvider — useQuery works correctly here.
const AdminRoute = () => {
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

  if (loading || adminLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
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
            <Route path="/faq" element={<FAQ />} />
            <Route path="/r/:slug" element={<ReviewFunnelPage />} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/business" element={<ProtectedRoute><DashboardBusiness /></ProtectedRoute>} />
            <Route path="/dashboard/qrcode" element={<ProtectedRoute><DashboardQRCode /></ProtectedRoute>} />
            <Route path="/dashboard/subscription" element={<ProtectedRoute><DashboardSubscription /></ProtectedRoute>} />

            {/* ✅ Admin-only — checks admins table before rendering */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

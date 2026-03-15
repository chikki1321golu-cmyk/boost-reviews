import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReviewFunnel from "./pages/ReviewFunnel";
import Dashboard from "./pages/Dashboard";
import DashboardBusiness from "./pages/DashboardBusiness";
import DashboardQRCode from "./pages/DashboardQRCode";
import DashboardSubscription from "./pages/DashboardSubscription";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/r/:slug" element={<ReviewFunnel />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/business" element={<DashboardBusiness />} />
          <Route path="/dashboard/qrcode" element={<DashboardQRCode />} />
          <Route path="/dashboard/subscription" element={<DashboardSubscription />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

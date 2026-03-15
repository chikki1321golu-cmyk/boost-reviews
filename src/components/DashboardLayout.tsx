import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { Star } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b border-border bg-background/80 backdrop-blur-lg px-4 gap-3">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-hero flex items-center justify-center">
              <Star className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground text-sm">ReviewBoost</span>
          </div>
        </header>
        <main className="flex-1 p-6 bg-secondary/30">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

export default DashboardLayout;

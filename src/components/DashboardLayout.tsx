import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import revuzaLogo from "@/assets/revuza-logo.jpeg";

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b border-border bg-background/80 backdrop-blur-lg px-4 gap-3">
          <SidebarTrigger />
          <img src={revuzaLogo} alt="Revuza" className="h-7 w-auto" />
        </header>
        <main className="flex-1 p-6 bg-secondary/30">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

export default DashboardLayout;

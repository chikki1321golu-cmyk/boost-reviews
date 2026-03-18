import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const DashboardQRCode = () => {
  const { user } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDownload = (slug: string) => {
    const container = document.getElementById(`qr-${slug}`);
    const svg = container?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `reviewboost-${slug}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">QR Codes</h1>
          <p className="text-muted-foreground mb-4">Create a business first to generate QR codes.</p>
          <Link to="/dashboard/business">
            <Button variant="hero">Add Business</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">QR Codes</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          {businesses.map((b) => {
            const url = `${window.location.origin}/r/${b.slug}`;
            return (
              <div key={b.id} className="bg-card rounded-xl border border-border p-6 shadow-card text-center">
                <h2 className="font-heading font-semibold text-card-foreground mb-4">{b.name}</h2>
                <div id={`qr-${b.slug}`} className="inline-block p-4 bg-background rounded-xl mb-3">
                  <QRCodeSVG value={url} size={180} fgColor="hsl(160,84%,28%)" bgColor="transparent" level="H" />
                </div>
                <p className="text-xs text-muted-foreground break-all mb-4">{url}</p>
                <Button variant="hero" onClick={() => handleDownload(b.slug)}>
                  <Download className="w-4 h-4" /> Download PNG
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardQRCode;

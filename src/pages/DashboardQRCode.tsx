import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";
import { useRef } from "react";

const DashboardQRCode = () => {
  const slug = "demo";
  const url = `${window.location.origin}/r/${slug}`;
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
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

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">QR Code</h1>
        <div className="bg-card rounded-xl border border-border p-8 shadow-card mb-6">
          <div ref={qrRef} className="inline-block p-4 bg-background rounded-xl">
            <QRCodeSVG value={url} size={220} fgColor="hsl(160,84%,28%)" bgColor="transparent" level="H" />
          </div>
          <p className="text-sm text-muted-foreground mt-4 break-all">{url}</p>
        </div>
        <Button variant="hero" size="lg" onClick={handleDownload}>
          <Download className="w-4 h-4" /> Download PNG
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default DashboardQRCode;

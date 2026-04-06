import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import ReviewPoster from "@/components/ReviewPoster";

const DashboardQRCode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const posterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleLogoUpload = async (businessId: string, file: File) => {
    setUploading(businessId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${businessId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("business-logos")
        .getPublicUrl(path);

      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ logo_url: logoUrl })
        .eq("id", businessId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo.");
    } finally {
      setUploading(null);
    }
  };

  const handleDownload = async (slug: string) => {
    const el = posterRefs.current[slug];
    if (!el) return;

    setDownloading(slug);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const a = document.createElement("a");
      a.download = `${slug}-review-poster.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch {
      toast.error("Failed to download poster.");
    } finally {
      setDownloading(null);
    }
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
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            QR Posters
          </h1>
          <p className="text-muted-foreground mb-4">
            Create a business first to generate review posters.
          </p>
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
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">
          QR Review Posters
        </h1>

        <div className="space-y-10">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
            >
              {/* Poster preview */}
              <div className="flex justify-center p-6 bg-muted/30 overflow-auto">
                <div
                  className="shadow-xl rounded-lg overflow-hidden"
                  style={{ width: 595 }}
                >
                  <ReviewPoster
                    ref={(el) => {
                      posterRefs.current[b.slug] = el;
                    }}
                    businessName={b.name}
                    slug={b.slug}
                    logoUrl={b.logo_url}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 p-4 border-t border-border">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(b.id, file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    asChild
                    disabled={uploading === b.id}
                  >
                    <span className="cursor-pointer">
                      {uploading === b.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploading === b.id ? "Uploading…" : "Upload Logo"}
                    </span>
                  </Button>
                </label>

                <Button
                  variant="hero"
                  onClick={() => handleDownload(b.slug)}
                  disabled={downloading === b.slug}
                >
                  {downloading === b.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloading === b.slug
                    ? "Generating…"
                    : "Download Poster"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardQRCode;

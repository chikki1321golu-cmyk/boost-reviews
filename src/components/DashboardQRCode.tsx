import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReviewPoster from "./ReviewPoster";

interface Business {
  id: string;
  name: string;
  slug: string;
  google_review_link: string | null;
  google_place_id: string | null;
}

interface DashboardQRCodeProps {
  businesses: Business[];
  appUrl: string; // e.g. "https://your-app.vercel.app"
}

// ✅ FIXED: Returns the direct Google review composer URL
function getDirectReviewUrl(business: Business): string | null {
  if (business.google_place_id) {
    return `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
  }
  return business.google_review_link ?? null;
}

export default function DashboardQRCode({ businesses, appUrl }: DashboardQRCodeProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    businesses[0] ?? null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPoster, setShowPoster] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  if (!selectedBusiness) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No businesses found. Add a business first.</p>
      </div>
    );
  }

  // ✅ The QR code URL points to your app's review page (e.g. /r/slug)
  // Your app's review page (/r/:slug) then handles the funnel + redirect to Google
  const reviewFunnelUrl = `${appUrl}/r/${selectedBusiness.slug}`;

  // ✅ The direct Google review URL (used for the "Open Google" shortcut link)
  const directGoogleUrl = getDirectReviewUrl(selectedBusiness);

  const handleCopyLink = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      /* silent */
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedBusiness.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">QR Code</h2>
        <p className="text-gray-500 mt-1">
          Customers scan this to leave a review. It opens your review funnel, then
          redirects them directly to the Google review form.
        </p>
      </div>

      {/* Business Selector */}
      {businesses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBusiness(b)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                selectedBusiness.id === b.id
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedBusiness.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* ✅ QR points to /r/:slug — your review funnel page */}
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <QRCodeSVG
                ref={qrRef}
                value={reviewFunnelUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-xs text-gray-400 text-center break-all">
              {reviewFunnelUrl}
            </p>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleCopyLink(reviewFunnelUrl, `qr-${selectedBusiness.id}`)}
              >
                {copiedId === `qr-${selectedBusiness.id}` ? (
                  <><CheckCircle size={14} className="mr-1 text-green-500" /> Copied</>
                ) : (
                  <><Copy size={14} className="mr-1" /> Copy Link</>
                )}
              </Button>
              <Button size="sm" onClick={handleDownloadQR} className="flex-1">
                <Download size={14} className="mr-1" /> Download QR
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowPoster(!showPoster)}
            >
              {showPoster ? "Hide Poster" : "View Print Poster"}
            </Button>
          </CardContent>
        </Card>

        {/* Google Review Link Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Google Review Link
              {directGoogleUrl ? (
                <Badge variant="secondary" className="text-green-700 bg-green-50">
                  Configured ✓
                </Badge>
              ) : (
                <Badge variant="destructive">Not set</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {directGoogleUrl ? (
              <>
                <p className="text-sm text-gray-600">
                  After the funnel, customers are redirected directly to the Google
                  review composer — <strong>not just the business profile</strong>.
                </p>

                {/* ✅ Shows the correct direct link */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 break-all">
                  {directGoogleUrl}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      handleCopyLink(directGoogleUrl, `google-${selectedBusiness.id}`)
                    }
                  >
                    {copiedId === `google-${selectedBusiness.id}` ? (
                      <><CheckCircle size={14} className="mr-1 text-green-500" /> Copied</>
                    ) : (
                      <><Copy size={14} className="mr-1" /> Copy</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(directGoogleUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    Test Link
                  </Button>
                </div>

                {selectedBusiness.google_place_id ? (
                  <p className="text-xs text-green-600">
                    ✅ Using Place ID:{" "}
                    <code className="bg-green-50 px-1 rounded">
                      {selectedBusiness.google_place_id}
                    </code>
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">
                    ⚠️ No Place ID saved — using fallback URL. Add a Place ID in
                    business settings for the most reliable redirect.
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">
                  No Google review link configured yet.
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Edit this business and add a Google Place ID or review link.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Poster Preview */}
      {showPoster && (
        <ReviewPoster
          businessName={selectedBusiness.name}
          slug={selectedBusiness.slug}
        />
      )}
    </div>
  );
}

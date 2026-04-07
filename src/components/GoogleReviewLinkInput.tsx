/**
 * GoogleReviewLinkInput.tsx
 *
 * Drop-in component for the Business Add/Edit form.
 * Customer pastes ANY Google URL (share link, Maps URL, profile link)
 * and it automatically resolves to the correct direct review URL + Place ID.
 *
 * Usage:
 *   <GoogleReviewLinkInput
 *     value={formData.google_review_link}
 *     placeId={formData.google_place_id}
 *     onChange={(link, placeId) => setFormData({ ...formData, google_review_link: link, google_place_id: placeId })}
 *   />
 */

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resolveGoogleBusinessUrl } from "@/utils/googlePlaceUtils";

interface Props {
  value: string;
  placeId: string | null;
  onChange: (directReviewUrl: string, placeId: string | null) => void;
}

type Status = "idle" | "loading" | "success" | "error" | "partial";

export default function GoogleReviewLinkInput({ value, placeId, onChange }: Props) {
  const [inputValue, setInputValue] = useState(value || "");
  const [status, setStatus] = useState<Status>(placeId ? "success" : "idle");
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : value || null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!inputValue.trim()) return;
    setStatus("loading");
    setErrorMsg(null);

    const result = await resolveGoogleBusinessUrl(inputValue.trim());

    if (result.directReviewUrl) {
      setResolvedUrl(result.directReviewUrl);
      setStatus(result.placeId ? "success" : "partial");
      onChange(result.directReviewUrl, result.placeId);
      if (!result.placeId) {
        setErrorMsg(
          "Direct review link created, but Place ID not found. It will still work in most cases."
        );
      }
    } else {
      setStatus("error");
      setErrorMsg(
        result.error ||
          "Could not extract review link. Try copying the link directly from Google Maps → Share → Copy Link."
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setStatus("idle");
    setResolvedUrl(null);
    setErrorMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleResolve();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Google Business Profile Link
      </label>
      <p className="text-xs text-gray-500">
        Paste any Google link — share link, Maps link, or profile URL. We'll convert it to a direct review link automatically.
      </p>

      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://share.google/... or https://maps.app.goo.gl/..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={
            status === "error"
              ? "border-red-400"
              : status === "success"
              ? "border-green-400"
              : ""
          }
        />
        <Button
          type="button"
          onClick={handleResolve}
          disabled={!inputValue.trim() || status === "loading"}
          variant="outline"
          className="shrink-0"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Verify"
          )}
        </Button>
      </div>

      {/* Status messages */}
      {status === "success" && resolvedUrl && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">✅ Direct review link ready!</p>
            <p className="text-xs text-green-600 truncate mt-0.5">{resolvedUrl}</p>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 underline flex items-center gap-1 mt-1"
            >
              Test link <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {status === "partial" && resolvedUrl && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">⚠️ Link resolved (partial)</p>
            <p className="text-xs text-amber-600 mt-0.5">{errorMsg}</p>
            <p className="text-xs text-amber-600 truncate mt-1">{resolvedUrl}</p>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-700 underline flex items-center gap-1 mt-1"
            >
              Test link <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Could not resolve link</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            <p className="text-xs text-red-500 mt-2">
              💡 How to get the correct link: Open Google Maps → Search your business → Tap Share → Copy Link
            </p>
          </div>
        </div>
      )}

      {status === "idle" && inputValue && (
        <p className="text-xs text-gray-400">
          Click <strong>Verify</strong> to convert this to a direct review link
        </p>
      )}
    </div>
  );
}

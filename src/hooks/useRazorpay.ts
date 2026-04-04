import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PlanId = "starter" | "growth" | "agency";

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (plan: PlanId, userEmail: string, userName?: string) => {
    setLoading(true);
    try {
      // ── STEP 1: Load Razorpay SDK first (before any auth calls) ──
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

      // ── STEP 2: Get a FRESH session token and hold it in a local variable ──
      // We do NOT use the reactive session from context — that can go stale.
      // By calling refreshSession() we get a guaranteed-valid token we own.
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        throw new Error("Session expired. Please log in again.");
      }
      const accessToken = refreshData.session.access_token;

      // ── STEP 3: Create Razorpay order using our held token ──
      // We call the edge function manually with fetch (not supabase.functions.invoke)
      // so we control exactly which token is sent and avoid triggering a re-auth.
      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const orderRes = await fetch(
        `${supabaseUrl}/functions/v1/create-payment-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": (supabase as any).supabaseKey as string,
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await orderRes.json();
      if (!orderRes.ok) throw new Error(data.error || "Failed to create payment order.");
      if (!data.orderId) throw new Error("Invalid order response from server.");

      // ── STEP 4: Open Razorpay checkout ──
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "ReviewBooster",
          description: `${data.planName} Plan — Monthly`,
          order_id: data.orderId,
          prefill: {
            email: data.userEmail || userEmail,
            name: userName || "",
          },
          theme: { color: "#0D4A3A" },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled.");
              resolve(); // resolve (not reject) so we don't show an error
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // ── STEP 5: Verify payment using the SAME held token ──
              const verifyRes = await fetch(
                `${supabaseUrl}/functions/v1/verify-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "apikey": (supabase as any).supabaseKey as string,
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                  }),
                }
              );

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed.");
              if (!verifyData.success) throw new Error("Payment verification failed.");

              toast.success(`🎉 ${verifyData.message}`);
              resolve();

              // Refresh page after short delay to reload subscription state
              setTimeout(() => window.location.reload(), 1500);
            } catch (err: any) {
              toast.error(err.message || "Payment verification failed. Please contact support.");
              reject(err);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast.error(`Payment failed: ${response.error.description}`);
          resolve(); // resolve so setLoading(false) runs cleanly
        });
        rzp.open();
      });

    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading };
}

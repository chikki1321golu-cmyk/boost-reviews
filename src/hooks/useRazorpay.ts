import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PlanId = "starter" | "growth" | "agency";

declare global {
  interface Window {
    Razorpay: any;
  }
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
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to continue.");

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke("create-payment-order", {
        body: { plan },
      });
      if (error) throw error;
      if (!data?.orderId) throw new Error("Failed to create payment order.");

      // Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "ReviewBooster",
          description: `${data.planName} Plan — Monthly Subscription`,
          image: "https://boost-reviews.vercel.app/favicon.ico",
          order_id: data.orderId,
          prefill: {
            email: userEmail,
            name: userName || "",
          },
          theme: { color: "#0D4A3A" },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled.");
              reject(new Error("Payment cancelled by user."));
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Verify payment and activate subscription
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                "verify-payment",
                {
                  body: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                  },
                }
              );
              if (verifyError) throw verifyError;
              if (!verifyData?.success) throw new Error("Payment verification failed.");
              toast.success(`🎉 ${verifyData.message}`);
              resolve();
              // Reload page after short delay to refresh subscription state
              setTimeout(() => window.location.reload(), 1500);
            } catch (err: any) {
              toast.error(err.message || "Payment verification failed.");
              reject(err);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast.error(`Payment failed: ${response.error.description}`);
          reject(new Error(response.error.description));
        });
        rzp.open();
      });
    } catch (err: any) {
      if (err.message !== "Payment cancelled by user.") {
        toast.error(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading };
}

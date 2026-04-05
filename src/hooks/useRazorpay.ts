import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type PlanId = "starter" | "growth" | "agency";

declare global {
  interface Window { Razorpay: any; }
}

const SUPABASE_URL = "https://yqqkhvrgiclvfxobnnhw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcWtodnJnaWNsdmZ4b2Jubmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDMzNDIsImV4cCI6MjA5MDUxOTM0Mn0.OzeNhQ5pmiJfPFGzJ1upu4OmRA20uF0sgonRrTXdGHo";

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

  const initiatePayment = async (
    plan: PlanId,
    userId: string,       // pass user.id directly from your component
    userEmail: string,    // pass user.email directly from your component
    userName?: string
  ) => {
    setLoading(true);

    try {
      // Step 1 — load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

      // Step 2 — create order
      // NO supabase.auth calls here — we pass userId directly so no token refresh happens
      const orderRes = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ plan, userId, userEmail }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create payment order.");
      if (!orderData.orderId) throw new Error("Invalid order response.");

      // Step 3 — open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "ReviewBooster",
          description: `${orderData.planName} Plan — Monthly`,
          order_id: orderData.orderId,
          prefill: { email: userEmail, name: userName || "" },
          theme: { color: "#0D4A3A" },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled.");
              resolve();
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 4 — verify payment
              // Again NO supabase.auth calls — pass userId directly
              const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan,
                  userId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }

              toast.success(`🎉 ${verifyData.message}`);
              resolve();
              // Reload to refresh subscription UI — short delay so toast is visible
              setTimeout(() => window.location.reload(), 1800);

            } catch (err: any) {
              toast.error(err.message || "Payment verification failed. Please contact support.");
              reject(err);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (res: any) => {
          toast.error(`Payment failed: ${res.error.description}`);
          resolve();
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

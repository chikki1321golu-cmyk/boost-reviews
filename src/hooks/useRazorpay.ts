import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export type PlanId = "starter" | "growth";

declare global {
  interface Window { Razorpay: any; }
}

const SUPABASE_URL = "https://yqqkhvrgiclvfxobnnhw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcWtodnJnaWNsdmZ4b2Jubmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDMzNDIsImV4cCI6MjA5MDUxOTM0Mn0.OzeNhQ5pmiJfPFGzJ1upu4OmRA20uF0sgonRrTXdGHo";

// Single edge function that handles both create_order and verify_payment
async function callPaymentSession(body: object) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/payment-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Payment service error");
  return data;
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (
    plan: PlanId,
    userId: string,
    userEmail: string,
    userName?: string
  ) => {
    if (!userId || !userEmail) {
      toast.error("Please log in to continue.");
      return;
    }

    setLoading(true);
    try {
      // Step 1 — Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");

      // Step 2 — Create order (no auth token needed)
      const orderData = await callPaymentSession({
        action: "create_order",
        plan,
        userId,
        userEmail,
        userName: userName || "",
      });

      if (!orderData.orderId) throw new Error("Failed to create payment order.");

      // Step 3 — Open Razorpay
      // We disable the internal Supabase realtime listener BEFORE opening
      // by temporarily overriding localStorage.setItem so Razorpay's writes
      // are silently dropped without triggering storage events
      const originalSetItem = localStorage.setItem.bind(localStorage);
      const originalRemoveItem = localStorage.removeItem.bind(localStorage);

      const rzpPattern = /razorpay/i;

      const safeSetItem = function(key: string, value: string) {
        if (rzpPattern.test(key)) return; // block Razorpay keys from firing storage events
        originalSetItem(key, value);
      };

      const safeRemoveItem = function(key: string) {
        if (rzpPattern.test(key)) return;
        originalRemoveItem(key);
      };

      localStorage.setItem = safeSetItem;
      localStorage.removeItem = safeRemoveItem;

      await new Promise<void>((resolve) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Revuza",
          description: `${orderData.planName} Plan — Monthly`,
          order_id: orderData.orderId,
          prefill: { email: userEmail, name: userName || "" },
          theme: { color: "#0D4A3A" },
          modal: {
            ondismiss: () => {
              // Restore localStorage before resolving
              localStorage.setItem = originalSetItem;
              localStorage.removeItem = originalRemoveItem;
              supabase.realtime.connect(); // Reconnect realtime after dismiss
              toast.info("Payment cancelled.");
              resolve();
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            // Restore localStorage immediately after payment completes
            localStorage.setItem = originalSetItem;
            localStorage.removeItem = originalRemoveItem;
            supabase.realtime.connect(); // Reconnect realtime after payment

            try {
              const verifyData = await callPaymentSession({
                action: "verify_payment",
                plan,
                userId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (!verifyData.success) throw new Error("Payment verification failed.");
              toast.success(`🎉 ${verifyData.message}`);
              resolve();
              setTimeout(() => window.location.reload(), 1800);
            } catch (err: any) {
              toast.error(err.message || "Verification failed. Contact support.");
              resolve();
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (res: any) => {
          localStorage.setItem = originalSetItem;
          localStorage.removeItem = originalRemoveItem;
          supabase.realtime.connect(); // Reconnect realtime after failure
          toast.error(`Payment failed: ${res.error.description}`);
          resolve();
        });

        // Disconnect realtime before opening Razorpay to prevent false logout
        supabase.realtime.disconnect();
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

import { useState } from "react";

const faqs = [
  {
    question: "How does REVUZA work?",
    answer:
      "REVUZA makes it effortless to collect 5-star Google reviews from your happy customers. Simply share your unique review link — we guide customers step-by-step to leave a review on your Google Business Profile.",
  },
  {
    question: "Do customers need a Google account to leave a review?",
    answer:
      "Yes, Google requires reviewers to be signed in to a Google account. However, most customers already have one through Gmail, YouTube, or Android — so this is rarely a barrier.",
  },
  {
    question: "Will this work for my type of business?",
    answer:
      "Boost Reviews works for any business listed on Google Maps — restaurants, salons, clinics, retail shops, service providers, and more. As long as you have a Google Business Profile, you're good to go.",
  },
  {
    question: "Is there a limit to how many review links I can send?",
    answer:
      "No limits! Send your review link via WhatsApp, SMS, email, QR code, or any other channel. The more you share, the more reviews you collect.",
  },
  {
    question: "Can I customise the review request page?",
    answer:
      "Yes — you can add your business name, logo, and a personalised message so customers feel they're hearing directly from you, not a third-party tool.",
  },
  {
    question: "Does Boost Reviews remove negative reviews?",
    answer:
      "We cannot remove reviews from Google — no tool can legitimately do that. However, our smart funnel gently identifies unhappy customers before they reach Google and routes their feedback to you privately, helping you resolve issues offline.",
  },
  {
    question: "How quickly will I see new reviews on Google?",
    answer:
      "Google typically publishes reviews within a few minutes to a few hours. Occasionally, reviews may be held for moderation and can take up to 24 hours to appear.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We do not store sensitive customer data beyond what is needed to operate the service. All data is encrypted in transit and at rest, and we never sell your information to third parties.",
  },
  {
    question: "What if I need help getting started?",
    answer:
      "Our support team is here for you. Reach out via the chat icon in the dashboard or email us — we typically respond within a few hours on business days.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "0",
        margin: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "72px 24px 48px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.4)",
            color: "#a5b4fc",
            borderRadius: "999px",
            padding: "4px 16px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          FAQ
        </span>
        <h1
          style={{
            color: "#f1f5f9",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 700,
            margin: "0 0 16px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Frequently Asked Questions
        </h1>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "1.1rem",
            maxWidth: "520px",
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          Everything you need to know about REVUZA. Can't find an answer?{" "}
          <a
            href="mailto:support@revuza.app"
            style={{ color: "#818cf8", textDecoration: "underline" }}
          >
            Contact us
          </a>
          .
        </p>
      </div>

      {/* FAQ List */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{
                marginBottom: "12px",
                borderRadius: "14px",
                border: isOpen
                  ? "1px solid rgba(99,102,241,0.45)"
                  : "1px solid rgba(255,255,255,0.07)",
                background: isOpen
                  ? "rgba(99,102,241,0.07)"
                  : "rgba(255,255,255,0.04)",
                transition: "border 0.2s, background 0.2s",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    color: isOpen ? "#e0e7ff" : "#cbd5e1",
                    fontSize: "1rem",
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {faq.question}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isOpen
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.25s, background 0.2s",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="7"
                      y1="1"
                      x2="7"
                      y2="13"
                      stroke={isOpen ? "#a5b4fc" : "#94a3b8"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="1"
                      y1="7"
                      x2="13"
                      y2="7"
                      stroke={isOpen ? "#a5b4fc" : "#94a3b8"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>

              {/* Answer */}
              <div
                style={{
                  maxHeight: isOpen ? "400px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    padding: "0 24px 20px",
                    margin: 0,
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div
        style={{
          textAlign: "center",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "40px 48px",
            maxWidth: "480px",
          }}
        >
          <p
            style={{
              color: "#f1f5f9",
              fontSize: "1.2rem",
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            Still have questions?
          </p>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              margin: "0 0 24px",
            }}
          >
            Our team is happy to help you get set up and collecting reviews fast.
          </p>
          <a
            href="mailto:support@revuza.app"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "#fff",
              padding: "12px 32px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

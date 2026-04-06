import { QRCodeSVG } from "qrcode.react";
import React from "react";

interface ReviewPosterProps {
  businessName: string;
  slug: string;
  logoUrl?: string | null;
}

const ReviewPoster = React.forwardRef<HTMLDivElement, ReviewPosterProps>(
  ({ businessName, slug, logoUrl }, ref) => {
    const qrUrl = `https://boost-reviews.vercel.app/r/${slug}`;

    return (
      <div
        ref={ref}
        style={{
          width: 595,
          minHeight: 842,
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top cream section */}
        <div
          style={{
            backgroundColor: "#F5F0E8",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "36px 40px 24px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 160,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                style={{ maxWidth: 160, maxHeight: 64, objectFit: "contain" }}
                crossOrigin="anonymous"
              />
            ) : (
              <span
                style={{
                  color: "#0D4A3A",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  opacity: 0.5,
                }}
              >
                Your Business Logo
              </span>
            )}
          </div>

          {/* Business name */}
          <p
            style={{
              color: "#0D4A3A",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 20,
              opacity: 0.7,
            }}
          >
            {businessName}
          </p>

          {/* Heading */}
          <h1
            style={{
              color: "#0D4A3A",
              fontSize: 32,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.15,
              margin: "0 0 12px",
              maxWidth: 420,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            SCAN HERE TO LEAVE US A REVIEW
          </h1>

          {/* Subtext */}
          <p
            style={{
              color: "#0D4A3A",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: 380,
              margin: "0 0 28px",
              opacity: 0.7,
            }}
          >
            Your feedback helps us improve, grow, and serve you better every
            time. It only takes a minute!
          </p>

          {/* QR Code with corner brackets */}
          <div
            style={{
              position: "relative",
              width: 200,
              height: 200,
              marginBottom: 28,
            }}
          >
            {/* Corner brackets */}
            {/* Top-left */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 28,
                height: 28,
                borderTop: "3px solid #0D4A3A",
                borderLeft: "3px solid #0D4A3A",
              }}
            />
            {/* Top-right */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 28,
                height: 28,
                borderTop: "3px solid #0D4A3A",
                borderRight: "3px solid #0D4A3A",
              }}
            />
            {/* Bottom-left */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 28,
                height: 28,
                borderBottom: "3px solid #0D4A3A",
                borderLeft: "3px solid #0D4A3A",
              }}
            />
            {/* Bottom-right */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderBottom: "3px solid #0D4A3A",
                borderRight: "3px solid #0D4A3A",
              }}
            />
            {/* QR */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                width: 168,
                height: 168,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QRCodeSVG
                value={qrUrl}
                size={160}
                fgColor="#0D4A3A"
                bgColor="transparent"
                level="H"
              />
            </div>
          </div>
        </div>

        {/* Dark green steps section */}
        <div
          style={{
            backgroundColor: "#0D4A3A",
            padding: "28px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {[
            {
              num: "1",
              text: "Scan the QR code above using your phone",
            },
            {
              num: "2",
              text: "Leave a quick review about your visit",
            },
            {
              num: "3",
              text: "Smile — because your input makes our day",
            },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 60,
                    borderLeft: "1px dashed rgba(245,240,232,0.35)",
                    alignSelf: "center",
                  }}
                />
              )}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "0 12px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "2px solid #F5F0E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F5F0E8",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 10,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {step.num}
                </div>
                <p
                  style={{
                    color: "#F5F0E8",
                    fontSize: 11,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {step.text}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#F5F0E8",
            padding: "14px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#0D4A3A",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            WWW.REVIEWBOOSTER.IN
          </span>
          <span
            style={{
              color: "#0D4A3A",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            © 2026 M&M FINTECH. ALL RIGHTS RESERVED.
          </span>
        </div>
      </div>
    );
  }
);

ReviewPoster.displayName = "ReviewPoster";
export default ReviewPoster;

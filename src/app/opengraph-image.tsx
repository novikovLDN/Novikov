import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Atlas Secure — Безопасный доступ в интернет";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
          <svg width="80" height="80" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M50 8 L85 88 L72 88 L62 64 L38 64 L28 88 L15 88 Z M50 28 L40 56 L60 56 Z"
              fill="url(#g)"
            />
          </svg>
          <span style={{ fontSize: "64px", fontWeight: 800, color: "#ffffff", letterSpacing: "-1px" }}>
            Atlas Secure
          </span>
        </div>

        {/* Subtitle */}
        <span style={{ fontSize: "28px", color: "#9ca3af", fontWeight: 500 }}>
          Безопасный доступ в интернет
        </span>
      </div>
    ),
    { ...size }
  );
}

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
          background: "linear-gradient(135deg, #212529 0%, #272b30 50%, #212529 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
          <svg width="80" height="80" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4CDFF" />
                <stop offset="100%" stopColor="#8942FE" />
              </linearGradient>
            </defs>
            <path d="M30 80L50 15L70 80H60L55 65H45L40 80H30ZM47 55H53L50 42L47 55Z" fill="url(#g)" />
            <path d="M62 35C62 28 56 23 48 23C40 23 34 28 34 35C34 48 62 42 62 55C62 62 56 68 48 68C40 68 34 62 34 55" stroke="url(#g)" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "64px", fontWeight: 800, color: "#E6E8EC", letterSpacing: "-1px" }}>
            Atlas Secure
          </span>
        </div>
        <span style={{ fontSize: "28px", color: "#8b8f96", fontWeight: 500 }}>
          Безопасный доступ в интернет
        </span>
      </div>
    ),
    { ...size }
  );
}

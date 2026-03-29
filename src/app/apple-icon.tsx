import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #212529 0%, #272b30 100%)",
          borderRadius: "38px",
        }}
      >
        <svg width="110" height="110" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4CDFF" />
              <stop offset="100%" stopColor="#8942FE" />
            </linearGradient>
          </defs>
          <path d="M30 80L50 15L70 80H60L55 65H45L40 80H30ZM47 55H53L50 42L47 55Z" fill="url(#g)" />
          <path d="M62 35C62 28 56 23 48 23C40 23 34 28 34 35C34 48 62 42 62 55C62 62 56 68 48 68C40 68 34 62 34 55" stroke="url(#g)" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

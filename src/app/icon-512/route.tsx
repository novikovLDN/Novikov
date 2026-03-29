import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
          borderRadius: "100px",
        }}
      >
        <svg width="320" height="320" viewBox="0 0 200 200" fill="white">
          <path d="M20 15 L60 15 L60 30 L42 30 L75 63 L63 75 L30 42 L30 60 L15 60 L15 20 Z" />
          <path d="M180 15 L140 15 L140 30 L158 30 L125 63 L137 75 L170 42 L170 60 L185 60 L185 20 Z" />
          <path d="M20 185 L60 185 L60 170 L42 170 L75 137 L63 125 L30 158 L30 140 L15 140 L15 180 Z" />
          <path d="M180 185 L140 185 L140 170 L158 170 L125 137 L137 125 L170 158 L170 140 L185 140 L185 180 Z" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}

import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "AutoHaus — Premium Automobiles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", color: "#c9a961", fontSize: 24, letterSpacing: 6 }}>
          SOFIA · BULGARIA
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 150,
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            AutoHaus
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 36, color: "#8a8a8a" }}>
            Premium automobiles · Leasing · Insurance · Service
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 160,
            height: 6,
            background: "#c9a961",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

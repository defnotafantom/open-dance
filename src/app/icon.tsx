import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f2e8",
          color: "#3a1216",
          fontFamily: "sans-serif",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: -1,
        }}
      >
        OD
      </div>
    ),
    { ...size }
  );
}

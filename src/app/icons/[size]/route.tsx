import { ImageResponse } from "next/og";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const dimension = Number(size) || 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
          color: "#fff",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: Math.round(dimension * 0.4),
          letterSpacing: -2,
        }}
      >
        OD
      </div>
    ),
    { width: dimension, height: dimension }
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "OrderlyPOS. Open for service. Still checking after close.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

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
          background: "#FBF9F8",
        }}
      >
        {/* The existing lockup. The file is not redrawn. */}
        <img src={src} width={640} height={174} alt="" />
        <div style={{ marginTop: 28, fontSize: 36, color: "#111827" }}>
          Open for service. Still checking after close.
        </div>
        <div style={{ marginTop: 12, fontSize: 22, color: "#6B7280" }}>
          Cafe, dining room, kiosk, or a group of branches.
        </div>
      </div>
    ),
    { ...size },
  );
}

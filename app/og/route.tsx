import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/data/public";
import { monogramFor } from "@/lib/site";

export const revalidate = 86400;

/**
 * Default social preview image, generated from site settings. Used when no
 * custom OpenGraph image has been uploaded in the dashboard.
 */
export async function GET() {
  const settings = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f7fbfa",
          color: "#102a2a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#0f766e",
              color: "#f7fbfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            {monogramFor(settings)}
          </div>
          <div style={{ width: 64, height: 2, background: "#14b8a6" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            {settings.full_name}
          </div>
          {settings.professional_title ? (
            <div style={{ marginTop: 20, fontSize: 38, color: "#0f766e" }}>{settings.professional_title}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#4f6967" }}>
          {settings.hero_focus_areas.slice(0, 3).join("  ·  ")}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

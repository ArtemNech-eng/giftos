import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Local DejaVu fonts: bundled with the route so the edge renderer never
// fetches fonts from a CDN (works offline, keeps response fast).
const regularFont = fetch(new URL("./fonts/DejaVuSans.ttf", import.meta.url)).then(
  (response) => response.arrayBuffer(),
);
const boldFont = fetch(new URL("./fonts/DejaVuSans-Bold.ttf", import.meta.url)).then(
  (response) => response.arrayBuffer(),
);

const THEMES: Record<string, { accent: string; glow: string; label: string }> = {
  home: { accent: "#7d45ff", glow: "rgba(125,69,255,0.55)", label: "Хочу также" },
  profile: {
    accent: "#ff4b8a",
    glow: "rgba(255,75,138,0.5)",
    label: "Автор в «Хочу также»",
  },
  wish: {
    accent: "#e17dff",
    glow: "rgba(225,125,255,0.5)",
    label: "Желание в «Хочу также»",
  },
  fundraiser: {
    accent: "#ffd35e",
    glow: "rgba(255,211,94,0.45)",
    label: "Сбор в «Хочу также»",
  },
  post: {
    accent: "#7fd8ff",
    glow: "rgba(127,216,255,0.45)",
    label: "Публикация · «Хочу также»",
  },
  invite: {
    accent: "#ff5b96",
    glow: "rgba(222,100,255,0.55)",
    label: "Приглашение в город",
  },
};

/**
 * Shared dynamic Open Graph image (1200x630) for public pages: profiles,
 * wishes, fundraisers, posts and the home page. Rendered on the edge, no
 * extra dependencies (next/og ImageResponse).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = THEMES[searchParams.get("type") ?? "home"]
    ? (searchParams.get("type") as string)
    : "home";
  const theme = THEMES[type] ?? THEMES.home;
  const title = (searchParams.get("title") ?? "Хочу также").slice(0, 90);
  const subtitle = (searchParams.get("subtitle") ?? "").slice(0, 170);
  const people = (searchParams.get("people") ?? "")
    .split(",")
    .map((value) => value.trim().slice(0, 1).toUpperCase())
    .filter(Boolean)
    .slice(0, 4);
  const initial = (title.trim()[0] ?? "Х").toUpperCase();
  const [regular, bold] = await Promise.all([regularFont, boldFont]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0c0e14",
        color: "#ffffff",
        padding: "72px 84px",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-260px",
          right: "-200px",
          width: "760px",
          height: "760px",
          borderRadius: "50%",
          background: theme.glow,
          filter: "blur(90px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-320px",
          left: "-180px",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "rgba(23,25,35,0.9)",
          filter: "blur(70px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 0,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "68px",
            height: "68px",
            borderRadius: "20px",
            background: `linear-gradient(135deg, ${theme.accent}, #7d45ff)`,
            fontSize: "40px",
          }}
        >
          {initial}
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: 700,
            color: "#e9e2f2",
            letterSpacing: "0.5px",
          }}
        >
          {theme.label}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "26px",
          maxWidth: "920px",
        }}
      >
        <div
          style={{
            fontSize: "74px",
            fontWeight: 800,
            lineHeight: 1.08,
            color: "#ffffff",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "34px",
              lineHeight: 1.35,
              color: "#b9b1c5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {type === "invite" && people.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          {people.map((person, index) => (
            <div
              key={`${person}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "54px",
                height: "54px",
                borderRadius: "999px",
                marginLeft: index === 0 ? "0" : "-10px",
                background:
                  index % 2 === 0
                    ? "linear-gradient(135deg, #ff5b96, #9a63ff)"
                    : "linear-gradient(135deg, #62c9d8, #7261ff)",
                border: "3px solid #0c0e14",
                fontSize: "24px",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              {person}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              marginLeft: "18px",
              color: "#e9e2f2",
              fontSize: "25px",
              fontWeight: 700,
            }}
          >
            Уже в круге города
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "26px",
          fontWeight: 600,
          color: "#9991a3",
        }}
      >
        <span>Хочу также</span>
        <span
          style={{
            color: theme.accent,
            fontWeight: 800,
          }}
        >
          ho chu takzhe · {type}
        </span>
      </div>
    </div>,
    // Bundled local fonts (regular + bold) and emoji: "none" (renders glyphs
    // as text) — the edge renderer never fetches anything from a CDN, so the
    // image works offline and stays fast. The cast is needed because the
    // next/og types lag behind satori, which supports "none".
    {
      width: 1200,
      height: 630,
      emoji: "none" as "twemoji",
      fonts: [
        { name: "sans", data: regular, weight: 400, style: "normal" },
        { name: "sans", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}

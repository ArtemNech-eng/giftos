"use client";

/**
 * Root error boundary: catches errors outside the route tree (layout,
 * fonts, global CSS). Minimal standalone page — must render its own
 * <html> because the root layout may have failed.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            background: "#f7f3fa",
            color: "#201827",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8753e6",
            }}
          >
            Не получилось
          </p>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Что-то пошло не так.
          </h1>
          <p style={{ fontSize: 14, color: "#6a5e73", maxWidth: 360, margin: 0 }}>
            Попробуй ещё раз — данные в порядке.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: "12px 28px",
              borderRadius: 999,
              border: 0,
              background: "#201827",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
            type="button"
          >
            Попробовать снова
          </button>
        </main>
      </body>
    </html>
  );
}

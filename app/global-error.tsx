"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#f7fbfa",
          color: "#102a2a",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#4f6967" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              background: "#0f766e",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "0.6rem 1.1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

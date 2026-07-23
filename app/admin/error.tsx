"use client";

/**
 * Error boundary for the /admin route.
 *
 * Without this, any runtime error thrown while the admin console renders on the
 * client bubbles to Next's default handler and the whole segment blanks out —
 * the panel "loads for a second then disappears". This boundary catches the
 * error instead and shows what actually went wrong, with a retry.
 */

import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the full error (with stack) in the browser console.
    console.error("[admin] render error:", error);
  }, [error]);

  return (
    <main className="yume-surface min-h-screen px-4 py-24">
      <div
        className="mx-auto max-w-xl p-8"
        style={{
          borderRadius: 26,
          border: "1px solid var(--home-line-strong)",
          background: "color-mix(in srgb, var(--home-paper) 90%, transparent)",
          boxShadow:
            "0 30px 60px -30px var(--home-shadow-strong), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <p
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Marcellus', serif",
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#9c4a59",
          }}
        >
          <AlertCircle size={14} /> Алдаа гарлаа
        </p>
        <h1
          className="mt-4"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "2rem",
            color: "var(--home-plum)",
          }}
        >
          Удирдлагын самбар ачаалахад алдаа гарлаа.
        </h1>

        <pre
          className="mt-5"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--home-plum)",
            background: "var(--home-paper-2)",
            border: "1px solid var(--home-line)",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          {error.message || "Тодорхойгүй алдаа."}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>

        <button
          type="button"
          onClick={reset}
          className="mt-6"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 14,
            padding: "13px 22px",
            fontFamily: "'Marcellus', serif",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            background:
              "linear-gradient(135deg, var(--home-rose), var(--home-rose-deep))",
            cursor: "pointer",
          }}
        >
          <RotateCw size={16} /> Дахин оролдох
        </button>
      </div>
    </main>
  );
}

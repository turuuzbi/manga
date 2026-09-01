import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for the sign-in and sign-up screens. Dark ink + gold, taken from
 * the logo, so the auth pages read as one piece with the brand instead of the
 * comic-ink treatment they used to carry.
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  /** Two short lines; rendered stacked as the display heading. */
  title: [string, string];
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="yume-auth relative min-h-screen overflow-hidden px-4 py-10">
      <style>{AUTH_STYLES}</style>

      <div className="ya-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center gap-10 lg:grid lg:grid-cols-[1fr_minmax(360px,420px)] lg:items-center lg:gap-16">
        <section className="flex flex-col items-start gap-6">
          <Link href="/" className="ya-back">
            <ArrowLeft size={15} />
            Нүүр хуудас руу буцах
          </Link>

          <img
            src="/yume-logo.jpeg"
            alt="ЮУМЭ Орчуулагч"
            width={1688}
            height={2048}
            className="ya-logo"
          />

          <div>
            <p className="ya-eyebrow">{eyebrow}</p>
            <h1 className="ya-title">
              {title[0]}
              <br />
              {title[1]}
            </h1>
          </div>

          <p className="ya-subtitle">{subtitle}</p>
        </section>

        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}

const AUTH_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.yume-auth {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #0b0910;
  color: #f3ece4;
}
.yume-auth * { box-sizing: border-box; }

.yume-auth .ya-glow {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(circle at 18% 12%, rgba(200, 162, 76, 0.20), transparent 42%),
    radial-gradient(circle at 82% 78%, rgba(210, 125, 156, 0.16), transparent 44%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03), transparent 60%);
}

.yume-auth .ya-back {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(243, 236, 228, 0.6); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-auth .ya-back:hover { color: #e4cd93; transform: translateX(-2px); }

.yume-auth .ya-logo {
  height: 108px; width: auto;
  border-radius: 20px;
  background: #000;
  border: 1px solid rgba(200, 162, 76, 0.5);
  box-shadow: 0 22px 50px -20px rgba(0, 0, 0, 0.9);
  object-fit: contain;
}
@media (min-width: 1024px) { .yume-auth .ya-logo { height: 148px; } }

.yume-auth .ya-eyebrow {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase;
  color: #c8a24c;
}
.yume-auth .ya-title {
  margin-top: 10px;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic;
  font-size: clamp(2.6rem, 7vw, 4.2rem);
  line-height: 0.98;
  background: linear-gradient(135deg, #f6e3c4 0%, #c8a24c 62%, #a67c34 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
.yume-auth .ya-subtitle {
  max-width: 46ch;
  font-size: 14px; line-height: 1.75;
  color: rgba(243, 236, 228, 0.62);
}

/* ── Clerk card ──
   Clerk renders its own markup; these rules tighten what the appearance
   prop cannot reach (control heights, icon alignment, divider weight). */
.yume-auth .cl-socialButtonsBlockButton,
.yume-auth .cl-formButtonPrimary,
.yume-auth .cl-formFieldInput {
  height: 46px;
}
.yume-auth .cl-socialButtonsBlockButton { position: relative; }
.yume-auth .cl-socialButtonsBlockButtonText { font-size: 14px; }
.yume-auth .cl-dividerRow { margin: 20px 0; }
.yume-auth .cl-footer { border-top: 1px solid rgba(200, 162, 76, 0.16); }
`;

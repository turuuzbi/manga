import { getCurrentDbUser } from "@/lib/auth";
import { premiumDaysRemaining } from "@/lib/plans";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import { YUME_CARD_STYLES } from "@/app/_components/MangaPosterCard";
import { AboutCountdown } from "@/app/about/AboutCountdown";
import {
  ABOUT_UNLOCK_AT,
  ABOUT_UNLOCK_LABEL,
  getAboutGateState,
} from "@/lib/about-gate";

export const dynamic = "force-dynamic";

/*
 * ─── Editing this page ───────────────────────────────────────────────────────
 * Everything readers see comes from the SECTIONS array below. To change the
 * page, edit that array — no layout work needed:
 *
 *   { kind: "text",  … }  a heading + paragraphs, full width
 *   { kind: "split", … }  an image beside text; `flip` puts the image right
 *   { kind: "gallery", …} a row of images with optional captions
 *
 * Images can be any URL (R2 uploads, /public files, anything). Add, remove or
 * reorder entries freely; the page adapts.
 */

type Section =
  | { kind: "text"; eyebrow?: string; heading: string; body: string[] }
  | {
      kind: "split";
      eyebrow?: string;
      heading: string;
      body: string[];
      image: string;
      imageAlt: string;
      flip?: boolean;
    }
  | {
      kind: "gallery";
      eyebrow?: string;
      heading: string;
      images: Array<{ src: string; alt: string; caption?: string }>;
    };

const SECTIONS: Section[] = [
  {
    kind: "text",
    eyebrow: "Бидний тухай",
    heading: "ЮҮМЭ Орчуулагч",
    body: [
      "Энд танилцуулах текстээ бичнэ үү. Энэ хэсэг бүхэлдээ өргөнөөрөө харагдана.",
      "Хүссэн хэмжээгээрээ догол мөр нэмж болно.",
    ],
  },
  {
    kind: "split",
    eyebrow: "Бидний зорилго",
    heading: "Гарчиг энд",
    body: [
      "Зураг болон текстийг зэрэгцүүлэн харуулах хэсэг. `flip: true` гэвэл зураг баруун талд харагдана.",
    ],
    image: "/yume-logo.jpeg",
    imageAlt: "ЮҮМЭ Орчуулагч",
  },
  {
    kind: "gallery",
    eyebrow: "Багийнхан",
    heading: "Зургийн эгнээ",
    images: [
      { src: "/yume-logo.jpeg", alt: "Тайлбар 1", caption: "Тайлбар 1" },
      { src: "/yume-logo.jpeg", alt: "Тайлбар 2", caption: "Тайлбар 2" },
      { src: "/yume-logo.jpeg", alt: "Тайлбар 3", caption: "Тайлбар 3" },
    ],
  },
];

const ABOUT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap');

.yume-about { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-about * { box-sizing: border-box; }

.yume-about .ya-eyebrow {
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: var(--home-gold);
}
.yume-about .ya-heading {
  margin-top: 10px;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic;
  font-size: clamp(28px, 4.6vw, 46px); line-height: 1.05;
  color: var(--home-plum);
}
.yume-about .ya-body {
  margin-top: 16px;
  display: flex; flex-direction: column; gap: 14px;
  font-size: 15px; line-height: 1.85; color: var(--home-plum);
  max-width: 68ch;
}
.yume-about .ya-panel {
  border-radius: 24px;
  background: var(--home-paper);
  border: 1px solid var(--home-line);
  box-shadow: 0 22px 48px -30px var(--home-shadow-strong);
  padding: clamp(24px, 4vw, 44px);
}
.yume-about .ya-split {
  display: grid; gap: clamp(22px, 4vw, 44px);
  align-items: center;
}
@media (min-width: 860px) {
  .yume-about .ya-split { grid-template-columns: 0.9fr 1.1fr; }
  .yume-about .ya-split.is-flipped .ya-media { order: 2; }
}
.yume-about .ya-media {
  border-radius: 20px; overflow: hidden;
  border: 1px solid var(--home-line);
  background: var(--home-paper-2);
  box-shadow: 0 18px 40px -24px var(--home-shadow-strong);
}
.yume-about .ya-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-about .ya-gallery {
  margin-top: 22px;
  display: grid; gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
}
.yume-about .ya-tile { display: flex; flex-direction: column; gap: 10px; }
.yume-about .ya-tile figcaption {
  font-family: 'Marcellus', serif;
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--home-plum-soft); text-align: center;
}

/* ── Countdown gate ── */
.yume-about .ya-gate {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; text-align: center;
  padding: clamp(36px, 7vw, 72px) 24px;
  border-radius: 24px;
  background: var(--home-paper);
  border: 1px solid var(--home-line);
  box-shadow: 0 22px 48px -30px var(--home-shadow-strong);
}
.yume-about .ya-gate-dial {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px;
}
.yume-about .ya-gate-lock { color: var(--home-gold); opacity: 0.3; }
.yume-about .ya-gate-time {
  /* Sits low in the icon so the digits land on the lock's body rather than
     across the shackle. Tabular figures keep the width from twitching each
     second. */
  position: absolute; top: 59%; left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: clamp(28px, 6.4vw, 44px);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  color: var(--home-plum);
  white-space: nowrap;
}
.yume-about .ya-gate-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700; font-style: italic;
  font-size: clamp(26px, 4.4vw, 40px); line-height: 1.1;
  color: var(--home-plum);
}
.yume-about .ya-gate-note {
  font-size: 15px; line-height: 1.7; color: var(--home-plum-soft);
}
.yume-about .ya-gate-when {
  margin-top: 6px;
  font-family: 'Marcellus', serif;
  font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--home-gold);
}
`;

export default async function AboutPage() {
  const user = await getCurrentDbUser();

  // The gate is decided here, on the server, and the locked branch never
  // renders SECTIONS — so the page content is not in the HTML at all before
  // the unlock time, rather than merely hidden. The route is force-dynamic, so
  // the first request after the deadline reveals it.
  const { locked, remainingMs } = getAboutGateState();

  return (
    <>
      <style>{YUME_CARD_STYLES}</style>
      <style>{ABOUT_STYLES}</style>

      <div className="yume-surface yume-about relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav
          isAdmin={user?.role === "ADMIN"}
          premiumDaysLeft={premiumDaysRemaining(user)}
        />

        <main className="motion-ink-fade relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-20 pt-10 md:px-8">
          {locked ? (
            <AboutCountdown
              unlockAtIso={ABOUT_UNLOCK_AT.toISOString()}
              initialRemainingMs={remainingMs}
              unlockLabel={ABOUT_UNLOCK_LABEL}
            />
          ) : (
            SECTIONS.map((section, index) => (
            <section
              key={index}
              className="motion-ink-up ya-panel"
              style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
            >
              {section.kind === "split" ? (
                <div
                  className={`ya-split${section.flip ? " is-flipped" : ""}`}
                >
                  <div className="ya-media">
                    <img src={section.image} alt={section.imageAlt} />
                  </div>
                  <div>
                    {section.eyebrow ? (
                      <p className="ya-eyebrow">{section.eyebrow}</p>
                    ) : null}
                    <h2 className="ya-heading">{section.heading}</h2>
                    <div className="ya-body">
                      {section.body.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : section.kind === "gallery" ? (
                <div>
                  {section.eyebrow ? (
                    <p className="ya-eyebrow">{section.eyebrow}</p>
                  ) : null}
                  <h2 className="ya-heading">{section.heading}</h2>
                  <div className="ya-gallery">
                    {section.images.map((image, i) => (
                      <figure key={i} className="ya-tile">
                        <div className="ya-media" style={{ aspectRatio: "4 / 5" }}>
                          <img src={image.src} alt={image.alt} />
                        </div>
                        {image.caption ? (
                          <figcaption>{image.caption}</figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {section.eyebrow ? (
                    <p className="ya-eyebrow">{section.eyebrow}</p>
                  ) : null}
                  <h2 className="ya-heading">{section.heading}</h2>
                  <div className="ya-body">
                    {section.body.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </section>
            ))
          )}
        </main>
      </div>
    </>
  );
}

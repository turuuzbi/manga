import { AutumnFrame } from "@/app/_components/AutumnFrame";

/**
 * Fixed decorative frame that sits behind the page content.
 *
 * The gold celestial layer — corner arcs, crescents, four-point stars and
 * beaded charm strands — is the light/dark frame. In autumn it is hidden (CSS,
 * `app/themes/autumn.css`) and `AutumnFrame`'s artwork takes its place. Both are
 * gated purely on `html[data-theme]`, so there is no client state here and
 * nothing to hydrate. Safe to render from a server component.
 */
export function CelestialFrame() {
  return (
    <>
      <AutumnFrame />

      <div className="yume-frame" aria-hidden="true">
        <style>{CELESTIAL_FRAME_STYLES}</style>

        <CornerOrnament className="corner c-tl" />
        <CornerOrnament className="corner c-tr" />
        <CornerOrnament className="corner c-bl" />
        <CornerOrnament className="corner c-br" />

        <EdgeOrnament className="edge e-l" />
        <EdgeOrnament className="edge e-r" />
      </div>
    </>
  );
}

/* ── Shapes ──────────────────────────────────────────────────────────────── */

/*
 * Crescent geometry, on a unit circle.
 *
 * A moon is the region inside a disc of radius 1 but outside a second disc
 * (radius RHO, centred D to the right) that overlaps it. It cannot be drawn as
 * two circles with `fill-rule="evenodd"`: the cutting disc pokes out past the
 * first one, and that sliver gets filled too, so the result reads as a ring.
 * The shape has to be traced along the two circles' actual intersection points.
 *
 * With RHO close to 1 and D small the sliver stays thin — its widest point is
 * 1 - RHO + D, here about 0.35.
 */
const RHO = 0.95;
const D = 0.3;
/** x of both intersection points; y is ± HORN_Y. */
const HORN_X = (D * D + 1 - RHO * RHO) / (2 * D);
const HORN_Y = Math.sqrt(1 - HORN_X * HORN_X);

/**
 * Crescent moon, drawn as the major arc of the outer circle closed by the near
 * arc of the cutting circle. The opening faces right at `rotate={0}`; pass a
 * rotation to aim the horns.
 */
function Crescent({
  cx,
  cy,
  r,
  rotate = 0,
  opacity = 0.85,
}: {
  cx: number;
  cy: number;
  r: number;
  rotate?: number;
  opacity?: number;
}) {
  const hx = (HORN_X * r).toFixed(3);
  const top = (HORN_Y * r).toFixed(3);
  const bottom = (-HORN_Y * r).toFixed(3);
  const inner = (RHO * r).toFixed(3);

  return (
    <path
      d={
        `M ${hx} ${bottom} ` +
        // outer edge: the long way round, away from the bite
        `A ${r} ${r} 0 1 0 ${hx} ${top} ` +
        // inner edge: back along the cutting circle
        `A ${inner} ${inner} 0 1 1 ${hx} ${bottom} Z`
      }
      transform={`translate(${cx} ${cy}) rotate(${rotate})`}
      fill="currentColor"
      stroke="none"
      opacity={opacity}
    />
  );
}

function FourStar({
  cx,
  cy,
  r,
  opacity = 0.8,
}: {
  cx: number;
  cy: number;
  r: number;
  opacity?: number;
}) {
  const w = r * 0.32;

  return (
    <path
      d={`M${cx} ${cy - r} C ${cx + w} ${cy - w}, ${cx + w} ${cy - w}, ${cx + r} ${cy} C ${cx + w} ${cy + w}, ${cx + w} ${cy + w}, ${cx} ${cy + r} C ${cx - w} ${cy + w}, ${cx - w} ${cy + w}, ${cx - r} ${cy} C ${cx - w} ${cy - w}, ${cx - w} ${cy - w}, ${cx} ${cy - r} Z`}
      fill="currentColor"
      stroke="none"
      opacity={opacity}
    />
  );
}

/* ── Gold celestial layer (light and dark) ───────────────────────────────── */

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="118"
      height="118"
      viewBox="0 0 118 118"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 112 C 6 56 56 6 112 6" strokeWidth="1.2" opacity="0.7" fill="none" />
      <path d="M6 92 C 6 46 46 6 92 6" strokeWidth="0.7" opacity="0.4" fill="none" />
      <Crescent cx={36} cy={36} r={13} rotate={-45} opacity={0.85} />
      <FourStar cx={64} cy={20} r={6} />
      <FourStar cx={20} cy={64} r={6} />
      <FourStar cx={86} cy={40} r={4} />
      <FourStar cx={40} cy={86} r={4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={100}
          cy={28 + i * 11}
          r={i % 2 === 0 ? 1.6 : 1}
          fill="currentColor"
          stroke="none"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

/**
 * Beaded strand down the left/right margins, ending in the little folded
 * letter charm the reference hangs there.
 */
function EdgeOrnament({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="210"
      viewBox="0 0 34 210"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={i}
          cx={17}
          cy={8 + i * 15}
          r={i % 2 === 0 ? 1.4 : 0.9}
          fill="currentColor"
          stroke="none"
          opacity="0.55"
        />
      ))}

      <FourStar cx={17} cy={140} r={7} />
      <Crescent cx={17} cy={162} r={7.5} rotate={-45} opacity={0.7} />

      {/* folded letter */}
      <g transform="translate(5 178) rotate(-8)" opacity="0.75">
        <rect x="0" y="0" width="24" height="17" rx="2" strokeWidth="1.1" fill="none" />
        <path d="M0 1.5 L12 10 L24 1.5" strokeWidth="1.1" fill="none" />
      </g>

      {Array.from({ length: 3 }, (_, i) => (
        <circle
          key={`tail-${i}`}
          cx={17}
          cy={202 + i * 4}
          r={1.1}
          fill="currentColor"
          stroke="none"
          opacity={0.45 - i * 0.12}
        />
      ))}
    </svg>
  );
}

const CELESTIAL_FRAME_STYLES = `
.yume-frame {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  color: var(--home-gold);
}

.yume-frame .corner { position: absolute; opacity: 0.6; }
.yume-frame .c-tl { top: 14px; left: 14px; }
.yume-frame .c-tr { top: 14px; right: 14px; transform: scaleX(-1); }
.yume-frame .c-bl { bottom: 14px; left: 14px; transform: scaleY(-1); }
.yume-frame .c-br { bottom: 14px; right: 14px; transform: scale(-1, -1); }

.yume-frame .edge { position: absolute; opacity: 0.5; }
.yume-frame .e-l { top: 50%; left: 10px; transform: translateY(-50%); }
.yume-frame .e-r { top: 50%; right: 10px; transform: translateY(-50%) scaleX(-1); }

@media (max-width: 900px) {
  .yume-frame .edge { display: none; }
  .yume-frame .corner { opacity: 0.4; }
  .yume-frame .c-tl, .yume-frame .c-bl, .yume-frame .c-tr, .yume-frame .c-br { width: 88px; }
}
`;

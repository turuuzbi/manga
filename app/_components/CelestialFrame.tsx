/**
 * Fixed decorative frame that sits behind the page content.
 *
 * The gold celestial layer — corner arcs, crescents, four-point stars and
 * beaded charm strands — renders in every theme. The autumn layer on top of it
 * (watercolour maple leaves in the corners, berry sprigs, and a sun-flanked-by-
 * crescents band across the top and bottom) is gated purely in CSS on
 * `html[data-theme="autumn"]`, so there is no client state here and nothing to
 * hydrate. Safe to render from a server component.
 */
export function CelestialFrame() {
  return (
    <>
      <div className="yume-frame" aria-hidden="true">
        <style>{CELESTIAL_FRAME_STYLES}</style>

        <LeafCluster className="leaves autumn-only l-tl" />
        <LeafCluster className="leaves autumn-only l-tr" />
        <LeafCluster className="leaves autumn-only l-bl" />
        <LeafCluster className="leaves autumn-only l-br" />

        <CornerOrnament className="corner c-tl" />
        <CornerOrnament className="corner c-tr" />
        <CornerOrnament className="corner c-bl" />
        <CornerOrnament className="corner c-br" />

        <EdgeOrnament className="edge e-l" />
        <EdgeOrnament className="edge e-r" />
      </div>

      {/*
        The sun band closes the page the way the reference frame's bottom edge
        does, so it anchors to the end of the document rather than to the
        viewport — inside the fixed frame it would sit at the bottom of the
        screen and get sliced in half by whatever content happened to scroll
        over it. The parent surface is `position: relative`, so this lands just
        below the last section.
      */}
      <div className="yume-band-anchor autumn-only" aria-hidden="true">
        <SunBand className="band" />
      </div>
    </>
  );
}

/* ── Autumn: maple leaves ────────────────────────────────────────────────── */

/**
 * Five-lobed maple silhouette in a 0–100 box, stem hanging below the blade.
 *
 * What keeps this from reading as a star: the sinuses between lobes cut deep
 * toward the midrib — (57 40), (67 47), (58 66) all sit close to the leaf's
 * centre — while each lobe carries a secondary tooth on the way out. Evenly
 * spaced shallow notches are what make a starburst.
 */
const LEAF_BLADE = [
  "M50 79",
  "L58 66 L74 71 L95 60 L78 53", // lower-right lobe
  "L67 47 L80 40 L84 20 L64 32", // upper-right lobe
  "L57 40 L55 22 L50 5", // central lobe, right edge
  "L45 22 L43 40", // central lobe, left edge
  "L36 32 L16 20 L20 40 L33 47", // upper-left lobe
  "L22 53 L5 60 L26 71 L42 66", // lower-left lobe
  "Z",
].join(" ");

function MapleLeaf({
  x,
  y,
  size,
  rotate,
  tone,
  opacity,
}: {
  /** Centre of the leaf, in the parent SVG's coordinates. */
  x: number;
  y: number;
  size: number;
  rotate: number;
  tone: string;
  opacity: number;
}) {
  return (
    <g
      // Rotate about the leaf's own centre, then drop it at (x, y).
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 100}) translate(-50 -50)`}
      opacity={opacity}
    >
      <path d={LEAF_BLADE} fill={tone} />
      <path
        d="M50 78 L50 97"
        stroke={tone}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* midrib plus one vein per lobe */}
      <path
        d="M50 76 L50 14 M50 52 L80 26 M50 52 L20 26 M50 64 L86 59 M50 64 L14 59"
        stroke="rgba(255, 252, 246, 0.32)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function BerrySprig({
  x,
  y,
  rotate,
}: {
  x: number;
  y: number;
  rotate: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d="M0 0 C 10 6, 20 14, 26 26"
        stroke="var(--leaf-stem)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {[
        [4, 8],
        [13, 6],
        [10, 16],
        [20, 15],
        [17, 24],
      ].map(([bx, by]) => (
        <circle
          key={`${bx}-${by}`}
          cx={bx}
          cy={by}
          r="3.1"
          fill="var(--leaf-berry)"
          opacity="0.85"
        />
      ))}
    </g>
  );
}

function LeafCluster({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="210"
      height="210"
      viewBox="0 0 210 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <MapleLeaf x={44} y={46} size={104} rotate={-26} tone="var(--leaf-deep)" opacity={0.9} />
      <MapleLeaf x={112} y={28} size={74} rotate={34} tone="var(--leaf-mid)" opacity={0.82} />
      <MapleLeaf x={26} y={122} size={68} rotate={-68} tone="var(--leaf-mid)" opacity={0.78} />
      <MapleLeaf x={92} y={96} size={50} rotate={14} tone="var(--leaf-soft)" opacity={0.62} />
      <MapleLeaf x={160} y={64} size={40} rotate={-12} tone="var(--leaf-soft)" opacity={0.5} />
      <BerrySprig x={124} y={126} rotate={18} />
    </svg>
  );
}

/* ── Autumn: sun flanked by crescents ────────────────────────────────────── */

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

const BAND_WIDTH = 320;

/**
 * The top/bottom motif from the reference frame: a radiant sun on the centre
 * line, a crescent to either side, then stars and beading trailing outward.
 * Only the left half is authored — the right half is the same group mirrored
 * across the centre, so the two sides can never drift apart.
 */
function SunBand({ className }: { className?: string }) {
  const half = (
    <>
      {/* horns open toward the sun, which sits to the right of this half */}
      <Crescent cx={112} cy={30} r={11} rotate={-15} opacity={0.8} />
      <FourStar cx={78} cy={30} r={7} opacity={0.72} />
      <FourStar cx={52} cy={24} r={4.5} opacity={0.55} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={36 - i * 9}
          cy={30 + (i % 2 === 0 ? 0 : 3)}
          r={i % 2 === 0 ? 1.7 : 1.1}
          fill="currentColor"
          opacity={0.5 - i * 0.08}
        />
      ))}
    </>
  );

  return (
    <svg
      className={className}
      width={BAND_WIDTH}
      height="60"
      viewBox={`0 0 ${BAND_WIDTH} 60`}
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* sun: open disc with alternating long/short tapered rays */}
      <circle cx={BAND_WIDTH / 2} cy="30" r="9" strokeWidth="1.3" fill="none" opacity="0.85" />
      <circle cx={BAND_WIDTH / 2} cy="30" r="4" fill="currentColor" stroke="none" opacity="0.7" />
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const inner = 12;
        const outer = i % 2 === 0 ? 22 : 16.5;
        const cx = BAND_WIDTH / 2;

        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * inner}
            y1={30 + Math.sin(angle) * inner}
            x2={cx + Math.cos(angle) * outer}
            y2={30 + Math.sin(angle) * outer}
            strokeWidth={i % 2 === 0 ? 1.4 : 0.9}
            strokeLinecap="round"
            opacity="0.8"
          />
        );
      })}

      {half}
      <g transform={`translate(${BAND_WIDTH} 0) scale(-1 1)`}>{half}</g>
    </svg>
  );
}

/* ── Gold celestial layer (all themes) ───────────────────────────────────── */

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
  --leaf-deep: #cf5f2b;
  --leaf-mid: #e98a45;
  --leaf-soft: #f3b169;
  --leaf-berry: #d95f4c;
  --leaf-stem: #b07a45;
}

.yume-frame .corner { position: absolute; opacity: 0.6; }
.yume-frame .c-tl { top: 14px; left: 14px; }
.yume-frame .c-tr { top: 14px; right: 14px; transform: scaleX(-1); }
.yume-frame .c-bl { bottom: 14px; left: 14px; transform: scaleY(-1); }
.yume-frame .c-br { bottom: 14px; right: 14px; transform: scale(-1, -1); }

.yume-frame .edge { position: absolute; opacity: 0.5; }
.yume-frame .e-l { top: 50%; left: 10px; transform: translateY(-50%); }
.yume-frame .e-r { top: 50%; right: 10px; transform: translateY(-50%) scaleX(-1); }

/* Autumn-only ornaments. Hidden by default so light/dark keep the plain gold
   frame; the theme attribute is the only switch. */
.autumn-only { display: none; }
html[data-theme="autumn"] .autumn-only { display: block; }

.yume-frame .leaves { position: absolute; opacity: 0.85; }
/* The top pair clears the 64px sticky header — tucked underneath it they were
   washed out by the bar's translucent background. */
.yume-frame .l-tl { top: 52px; left: -26px; }
.yume-frame .l-tr { top: 52px; right: -26px; transform: scaleX(-1); }
.yume-frame .l-bl { bottom: -22px; left: -26px; transform: scaleY(-1); }
.yume-frame .l-br { bottom: -22px; right: -26px; transform: scale(-1, -1); }

.yume-band-anchor {
  position: absolute; left: 0; right: 0; bottom: 14px;
  z-index: 0; pointer-events: none;
  color: var(--home-gold);
  text-align: center;
}
.yume-band-anchor .band { opacity: 0.7; }

@media (max-width: 900px) {
  .yume-frame .edge { display: none; }
  .yume-frame .corner { opacity: 0.4; }
  .yume-frame .c-tl, .yume-frame .c-bl, .yume-frame .c-tr, .yume-frame .c-br { width: 88px; }
  /* The hero runs full-bleed under the header on phones — ornaments over a
     cover image read as clutter, so only the bottom corners stay. */
  html[data-theme="autumn"] .yume-frame .l-tl,
  html[data-theme="autumn"] .yume-frame .l-tr { display: none; }
  .yume-frame .leaves { width: 132px; opacity: 0.6; }
  .yume-frame .l-bl { bottom: -14px; left: -18px; }
  .yume-frame .l-br { bottom: -14px; right: -18px; }
  .yume-band-anchor .band { width: 220px; opacity: 0.6; }
}
`;

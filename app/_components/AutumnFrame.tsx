/**
 * The autumn theme's frame artwork. Markup only — every rule, image and
 * breakpoint lives in `app/themes/autumn.css`, which also keeps it invisible
 * outside `html[data-theme="autumn"]`. Server-safe: no state, nothing to hydrate.
 *
 * The images are CSS backgrounds rather than <img>/next/image on purpose: a
 * background is only fetched by the breakpoint that paints it (the full frame on
 * phones, the cut-out corners on desktop), and `image-set()` lets the browser
 * pick AVIF, then WebP, then the PNG original — none of which a hidden <img>
 * would do. Nothing here is content, so there is no alt text to lose.
 *
 * Render it inside a `position: relative` page surface: the sun band anchors to
 * the end of that surface. Pages that mount `CelestialFrame` already get this.
 */
export function AutumnFrame() {
  return (
    <>
      <div className="autumn-frame" aria-hidden="true">
        {/* Phones: the two halves of the full frame. */}
        <span className="af-top" />
        <span className="af-bottom" />
        {/* Desktop: gold rule plus the pumpkin corners. */}
        <span className="af-rule" />
        <span className="af-corner af-tl" />
        <span className="af-corner af-tr" />
        <span className="af-corner af-bl" />
        <span className="af-corner af-br" />
      </div>
      <div className="autumn-band" aria-hidden="true" />
    </>
  );
}

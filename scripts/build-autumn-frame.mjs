/**
 * Builds the autumn theme's image assets from public/themes/autumn/frame.png.
 *
 *   node scripts/build-autumn-frame.mjs
 *
 * Outputs, next to the source:
 *   frame.webp / frame.avif        full portrait frame — the phone background
 *   corner-{tl,tr,bl,br}.{webp,avif}  the pumpkin + leaf corners, as transparent
 *                                  sprites for the desktop layout
 *   band.{webp,avif}               the sun-and-crescents motif, transparent
 *   frame-art.{webp,avif}          the full frame with transparent paper (dark theme)
 *
 * The desktop must not stretch the full frame (the sun and pumpkins would
 * distort), so the corners and band are cut out and the cream paper around them
 * is turned into alpha — they then sit on the page's own background without a
 * visible rectangle. frame.png stays as the universal fallback.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "themes",
  "autumn",
);
const SOURCE = path.join(dir, "frame.png");

// The frame's paper is a near-white cream; this is its brightest tone.
const PAPER = [254, 252, 246];
// Below this much "ink" a pixel is treated as paper. Soaks up the faint
// vignette in the source so no ghost rectangle remains.
const ALPHA_FLOOR = 0.075;
// Inner edges fade out over this many pixels so a sprite never ends in a line.
const FEATHER = 34;

// left, top, width, height — in the 971×1620 source.
const SPRITES = {
  // `feather` lists the sides that face the page; the sides on the viewport
  // edge stay hard because the art is meant to run off the screen there.
  "corner-tl": { left: 0, top: 0, width: 270, height: 300, feather: "rb" },
  "corner-tr": { left: 740, top: 0, width: 231, height: 230, feather: "lb" },
  "corner-bl": { left: 0, top: 1360, width: 270, height: 260, feather: "rt" },
  "corner-br": { left: 720, top: 1320, width: 251, height: 300, feather: "lt" },
  // The whole frame again, paper turned to alpha, for the dark variant: the
  // opaque frame.* is cream and cannot sit on a dark page.
  "frame-art": { left: 0, top: 0, width: 971, height: 1620, feather: "" },
  band: { left: 232, top: 62, width: 508, height: 112, feather: "lrtb" },
};

/** Cream → transparent. Keeps the colour of whatever ink sits on top. */
async function colourToAlpha({ feather, ...region }) {
  const { data, info } = await sharp(SOURCE)
    .extract(region)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const ramp = (distance) => Math.min(1, distance / FEATHER);

  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % width;
    const py = Math.floor(i / 4 / width);
    let edge = 1;
    if (feather.includes("l")) edge = Math.min(edge, ramp(px));
    if (feather.includes("r")) edge = Math.min(edge, ramp(width - 1 - px));
    if (feather.includes("t")) edge = Math.min(edge, ramp(py));
    if (feather.includes("b")) edge = Math.min(edge, ramp(height - 1 - py));

    let alpha = 0;
    for (let c = 0; c < 3; c += 1) {
      alpha = Math.max(alpha, (PAPER[c] - data[i + c]) / PAPER[c]);
    }
    alpha = Math.min(1, Math.max(0, (alpha - ALPHA_FLOOR) / (1 - ALPHA_FLOOR)));
    const unfaded = alpha;
    alpha *= edge * edge * (3 - 2 * edge);

    for (let c = 0; c < 3; c += 1) {
      // Un-mix against the pre-feather alpha so fading does not shift colour.
      const ink =
        unfaded > 0 ? (data[i + c] - PAPER[c] * (1 - unfaded)) / unfaded : 0;
      data[i + c] = Math.min(255, Math.max(0, Math.round(ink)));
    }
    data[i + 3] = Math.round(alpha * 255);
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

async function emit(image, name, { avifQuality, webpQuality }) {
  const webp = await image
    .clone()
    .webp({ quality: webpQuality, effort: 6, alphaQuality: 90 })
    .toFile(path.join(dir, `${name}.webp`));
  const avif = await image
    .clone()
    .avif({ quality: avifQuality, effort: 7 })
    .toFile(path.join(dir, `${name}.avif`));
  console.log(
    `${name.padEnd(10)} webp ${(webp.size / 1024).toFixed(1)} KB · avif ${(avif.size / 1024).toFixed(1)} KB`,
  );
}

await emit(sharp(SOURCE), "frame", { webpQuality: 80, avifQuality: 52 });

for (const [name, region] of Object.entries(SPRITES)) {
  // The full-frame art is mostly soft haze; it tolerates a lot more squeeze.
  const big = name === "frame-art";
  await emit(await colourToAlpha(region), name, {
    webpQuality: big ? 70 : 88,
    avifQuality: big ? 40 : 62,
  });
}

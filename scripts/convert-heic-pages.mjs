/**
 * Re-encodes stored HEIC images (chapter pages, covers, posters) as JPEG.
 *
 * iPhone photos imported from Google Drive used to go into R2 untouched, and
 * only Safari 17+ can display HEIC. On Android, in Chrome/Firefox anywhere and
 * on iOS 16 or older those pages showed as a broken image with its alt text
 * ("Бүлэг 9 page 4"). The import converts HEIC itself now (toBrowserSafeAsset
 * in app/admin/actions.ts); this fixes the files already stored.
 *
 *   node scripts/convert-heic-pages.mjs --check      # list them, change nothing
 *   node scripts/convert-heic-pages.mjs --limit 5    # convert the first five
 *   node scripts/convert-heic-pages.mjs              # convert all of them
 *
 * Every image the database points at (pages, covers, the poster library,
 * readers' chosen posters, thumbnails, badges, hero and promo art) is checked
 * by its first bytes (an iPhone HEIC can carry a .jpg name), then each HEIC
 * is converted IN PLACE: same key, JPEG bytes, Content-Type image/jpeg. URLs
 * do not change, so no database row is written (the database is only read,
 * to list the images), and every place that shows the file is fixed at once. The original is first copied to heic-originals/<key>, so it
 * can be put back. Re-running is safe: files that are already JPEG are skipped.
 *
 * Needs DATABASE_URL plus R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_BUCKET_NAME and R2_PUBLIC_URL — copy the R2 ones from the Vercel project
 * settings into .env.local.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import convertHeic from "heic-convert";
import { readFileSync, existsSync } from "node:fs";

// Load .env the same way `next` does; this script runs outside the framework.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const required = [
  "DATABASE_URL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing ${missing.join(", ")} (add them to .env.local).`);
  process.exit(1);
}

const checkOnly = process.argv.includes("--check");
const limitIndex = process.argv.indexOf("--limit");
const limit =
  limitIndex === -1 ? Infinity : Number(process.argv[limitIndex + 1]) || 0;
const bucket = process.env.R2_BUCKET_NAME;
const publicBaseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
const BACKUP_PREFIX = "heic-originals/";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  // As in lib/r2.ts: current SDKs validate response checksums by default, and
  // a whole-object checksum would never match the 64-byte ranged reads below.
  responseChecksumValidation: "WHEN_REQUIRED",
});

// HEVC-coded HEIF brands. AVIF shares the container but browsers show it.
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis"]);

function isHeic(bytes) {
  const buffer = Buffer.from(bytes);

  if (buffer.length < 12 || buffer.toString("latin1", 4, 8) !== "ftyp") {
    return false;
  }

  // Major brand, then the compatible brands after the minor version.
  const boxEnd = Math.min(buffer.readUInt32BE(0), buffer.length);
  const brands = [buffer.toString("latin1", 8, 12)];

  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
    brands.push(buffer.toString("latin1", offset, offset + 4));
  }

  return !brands.includes("avif") && brands.some((b) => HEIC_BRANDS.has(b));
}

// The same two helpers as app/admin/actions.ts: iPhones tag many HEICs
// Display P3, and the decoded pixels are in that space, so the JPEG carries
// the profile on or colour pages come out duller.
function heicIccProfile(heic) {
  for (let at = heic.indexOf("colrprof"); at >= 4; at = heic.indexOf("colrprof", at + 8)) {
    const icc = heic.subarray(at + 8, at - 4 + heic.readUInt32BE(at - 4));

    if (icc.toString("latin1", 36, 40) === "acsp") {
      return icc;
    }
  }

  return null;
}

function withIccProfile(jpeg, icc) {
  if (icc.length > 65519) {
    return jpeg;
  }

  const header = Buffer.alloc(18);
  header.writeUInt16BE(0xffe2, 0);
  header.writeUInt16BE(16 + icc.length, 2);
  header.write("ICC_PROFILE\0", 4, "latin1");
  header[16] = 1;
  header[17] = 1;
  const at = jpeg.readUInt16BE(2) === 0xffe0 ? 4 + jpeg.readUInt16BE(4) : 2;

  return Buffer.concat([jpeg.subarray(0, at), header, icc, jpeg.subarray(at)]);
}

async function inBatches(items, size, task) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      await task(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: size }, worker));
}

try {
  // Every image the site shows. Pages are where Drive HEIC landed, but a page
  // file can also be a series cover ("first page as cover"), sit in the
  // poster library, or be a reader's chosen poster — and an old cover kept in
  // the library is referenced from nowhere else. Each file is read by its
  // bytes once, however many places point at it.
  const rows = await prisma.$queryRaw`
    SELECT p."imageUrl" AS url,
           m."mangaName" || ' · ch ' || c."chapterNumber" || ' · p' || p."pageNumber" AS label
      FROM "Page" p
      JOIN "Chapter" c ON c.id = p."chapterId"
      JOIN "Manga" m ON m.id = c."mangaId"
    UNION ALL
    SELECT u.url, m."mangaName" || ' · ch ' || c."chapterNumber" || ' · thumbnail/badge'
      FROM "Chapter" c
      JOIN "Manga" m ON m.id = c."mangaId"
     CROSS JOIN LATERAL unnest(ARRAY[c."coverImage", c."badgeImage"]) AS u(url)
     WHERE u.url IS NOT NULL
    UNION ALL
    SELECT u.url, m."mangaName" || ' · series art'
      FROM "Manga" m
     CROSS JOIN LATERAL unnest(
       ARRAY[
         m."coverImage", m."homeCoverImage", m."detailCoverImage",
         m."defaultPoster", m."promoImageUrl", m."featuredImageDesktop",
         m."featuredImageMobile", m."rewardBackgroundUrl"
       ] || m."posterOptions"
     ) AS u(url)
     WHERE u.url IS NOT NULL
    UNION ALL
    SELECT pc."posterUrl", m."mangaName" || ' · a reader''s poster'
      FROM "UserPosterChoice" pc
      JOIN "Manga" m ON m.id = pc."mangaId"
  `;

  // One entry per file; a cover can share its file with a page.
  const byKey = new Map();
  let foreign = 0;

  for (const { url, label } of rows) {
    if (!url.startsWith(`${publicBaseUrl}/`)) {
      foreign += 1;
      continue;
    }

    const key = url.slice(publicBaseUrl.length + 1);
    const entry = byKey.get(key) ?? { key, url, labels: [] };
    entry.labels.push(label);
    byKey.set(key, entry);
  }

  const files = [...byKey.values()];
  console.log(
    `Checking ${files.length} files in R2 by their first bytes` +
      (foreign ? ` (${foreign} URLs on another host skipped)` : "") +
      "…",
  );

  const heic = [];
  const unreadable = [];
  let checked = 0;

  await inBatches(files, 16, async (file) => {
    try {
      const response = await r2.send(
        new GetObjectCommand({ Bucket: bucket, Key: file.key, Range: "bytes=0-63" }),
      );
      const head = await response.Body.transformToByteArray();

      if (isHeic(head)) {
        heic.push({ ...file, contentType: response.ContentType });
      }
    } catch (error) {
      unreadable.push({ ...file, error: error?.message ?? String(error) });
    }

    checked += 1;
    if (checked % 2000 === 0) console.log(`  ${checked}/${files.length}`);
  });

  heic.sort((a, b) => a.labels[0].localeCompare(b.labels[0], "mn"));
  console.log(`\nHEIC files: ${heic.length}`);

  for (const file of heic) {
    console.log(`  ${file.labels.join(" | ")}  (${file.contentType})  ${file.key}`);
  }

  if (unreadable.length > 0) {
    console.log(`\nCould not read ${unreadable.length} files (left alone):`);
    for (const file of unreadable.slice(0, 50)) {
      console.log(`  ${file.error}  ${file.labels[0]}  ${file.key}`);
    }
  }

  if (checkOnly || heic.length === 0) {
    console.log(checkOnly ? "\n--check: nothing changed." : "\nNothing to convert.");
  } else {
    const todo = heic.slice(0, limit);
    const failed = [];
    let converted = 0;

    console.log(`\nConverting ${todo.length} of ${heic.length}…`);

    await inBatches(todo, 2, async (file) => {
      try {
        const original = await r2.send(
          new GetObjectCommand({ Bucket: bucket, Key: file.key }),
        );
        const bytes = await original.Body.transformToByteArray();

        // Read again in full: skip anything that changed since the scan.
        if (!isHeic(bytes)) {
          console.log(`  skipped (no longer HEIC)  ${file.key}`);
          return;
        }

        const converted = Buffer.from(
          await convertHeic({ buffer: bytes, format: "JPEG", quality: 0.9 }),
        );
        const icc = heicIccProfile(Buffer.from(bytes));
        const jpeg = icc ? withIccProfile(converted, icc) : converted;

        await r2.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: encodeURI(`${bucket}/${file.key}`),
            Key: `${BACKUP_PREFIX}${file.key}`,
          }),
        );
        await r2.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: file.key,
            Body: jpeg,
            ContentType: "image/jpeg",
          }),
        );

        const stored = await r2.send(
          new HeadObjectCommand({ Bucket: bucket, Key: file.key }),
        );

        if (
          stored.ContentType !== "image/jpeg" ||
          stored.ContentLength !== jpeg.length
        ) {
          throw new Error("stored object does not match the JPEG just written");
        }

        converted += 1;
        console.log(
          `  ${converted}/${todo.length}  ${bytes.length} B HEIC -> ${jpeg.length} B JPEG  ${file.labels[0]}`,
        );
      } catch (error) {
        failed.push(file);
        console.error(`  FAILED ${file.key}: ${error?.message ?? error}`);
      }
    });

    console.log(
      `\nConverted ${converted}, failed ${failed.length}` +
        (todo.length < heic.length ? `, ${heic.length - todo.length} left (--limit)` : "") +
        `. Originals are under ${BACKUP_PREFIX} in the bucket.`,
    );

    if (failed.length > 0) {
      process.exitCode = 1;
    }
  }
} finally {
  await prisma.$disconnect();
}

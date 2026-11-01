import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import convertHeic from "heic-convert";
import { getOwnR2Key, r2 } from "@/lib/r2";

// HEIC is what an iPhone saves, and only Safari 17+ can display it: Chrome,
// Firefox, every Android browser and iOS 16 or older show such a page as
// broken alt text. Matched on the file's own ftyp brand, because an iPhone
// HEIC can carry a .jpg name.
const HEIC_BRAND = /^ftyp(heic|heix|hevc|hevx|heim|heis)$/;

export function hasHeicBrand(bytes: Uint8Array) {
  return (
    bytes.length >= 12 &&
    HEIC_BRAND.test(Buffer.from(bytes.subarray(4, 12)).toString("latin1"))
  );
}

/**
 * The ICC profile a HEIC carries in a `colr` box of type `prof` — iPhones tag
 * many images Display P3 — or null. The decoder returns the pixels in that
 * colour space, so a JPEG without the profile would look duller.
 */
function heicIccProfile(heic: Buffer) {
  for (
    let at = heic.indexOf("colrprof");
    at >= 4;
    at = heic.indexOf("colrprof", at + 8)
  ) {
    const icc = heic.subarray(at + 8, at - 4 + heic.readUInt32BE(at - 4));

    if (icc.toString("latin1", 36, 40) === "acsp") {
      return icc;
    }
  }

  return null;
}

/** The JPEG with `icc` as its APP2 ICC_PROFILE segment, after the JFIF one. */
function withIccProfile(jpeg: Buffer, icc: Buffer) {
  // One segment holds 65,519 bytes of profile; a P3 profile is 536.
  if (icc.length > 65519) {
    return jpeg;
  }

  const header = Buffer.alloc(18);
  header.writeUInt16BE(0xffe2, 0);
  header.writeUInt16BE(16 + icc.length, 2);
  header.write("ICC_PROFILE\0", 4, "latin1");
  header[16] = 1; // segment 1…
  header[17] = 1; // …of 1
  const at = jpeg.readUInt16BE(2) === 0xffe0 ? 4 + jpeg.readUInt16BE(4) : 2;

  return Buffer.concat([jpeg.subarray(0, at), header, icc, jpeg.subarray(at)]);
}

/** A HEIC as JPEG bytes, keeping its colour profile. */
export async function heicToJpeg(heic: Buffer) {
  const jpeg = Buffer.from(
    await convertHeic({ buffer: heic, format: "JPEG", quality: 0.9 }),
  );
  const icc = heicIccProfile(heic);

  return icc ? withIccProfile(jpeg, icc) : jpeg;
}

/**
 * Last line of defence for images the browser uploaded straight to R2: if the
 * file behind `url` is really a HEIC (whatever its name or type claims), it is
 * re-encoded as JPEG in place, same key, so the saved URL stays valid. The
 * admin browser already converts HEIC before uploading; this catches anything
 * that got past it, so a HEIC page can never be saved.
 *
 * URLs that are not on our bucket are left alone. A file that cannot be read
 * or converted throws, so the save fails loudly instead of storing a page
 * Android cannot show.
 */
export async function ensureBrowserSafeImage(url: string) {
  const key = getOwnR2Key(url);

  if (!key) {
    return;
  }

  const bucket = process.env.R2_BUCKET_NAME;
  const head = await r2.send(
    new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-63" }),
  );

  if (!hasHeicBrand(await head.Body!.transformToByteArray())) {
    return;
  }

  const original = await r2.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  try {
    const jpeg = await heicToJpeg(
      Buffer.from(await original.Body!.transformToByteArray()),
    );

    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: jpeg,
        ContentType: "image/jpeg",
      }),
    );
  } catch (error) {
    console.error("[heic] could not convert an uploaded HEIC", key, error);
    throw new Error(
      "A HEIC image could not be converted to JPEG. Re-export it as JPG and upload it again.",
    );
  }
}

export async function ensureBrowserSafeImages(urls: string[]) {
  for (let at = 0; at < urls.length; at += 6) {
    await Promise.all(urls.slice(at, at + 6).map(ensureBrowserSafeImage));
  }
}

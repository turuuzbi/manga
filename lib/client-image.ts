/**
 * Browser-side resize + compress for admin artwork, run before the direct R2
 * upload. Most admin work happens on an iPhone, where a picked photo or PNG
 * export is easily 3–10 MB; nothing that size needs to reach a 3:4 card.
 *
 * Output is WebP where the browser can encode it and JPEG otherwise. iOS
 * Safari cannot encode WebP from a canvas and silently hands back a PNG
 * instead, so the encoded type is checked rather than trusted. Images with
 * real transparency (chapter badges) stay WebP/PNG so the alpha survives.
 */

import { MAX_UPLOAD_BYTES, UPLOAD_CONTENT_TYPES } from "@/lib/upload-types";

export type PreparedImage = {
  blob: Blob;
  contentType: string;
  fileName: string;
  width: number;
  height: number;
};

export class ImagePrepareError extends Error {}

// HEIC is what an iPhone saves, and only Safari 17+ can display it: on Android
// and in Chrome/Firefox a stored HEIC page is a broken image ("N-р хуудсыг
// ачаалж чадсангүй"). Detected by its first bytes, never by name or type,
// because an iPhone HEIC can carry a .jpg name. Same brands as the Drive
// import's check in app/admin/actions.ts.
const HEIC_BRAND = /^ftyp(heic|heix|hevc|hevx|heim|heis)$/;

export async function isHeic(file: Blob): Promise<boolean> {
  if (/^image\/hei[cf]/.test(file.type)) {
    return true;
  }

  try {
    const head = new Uint8Array(await file.slice(4, 12).arrayBuffer());
    return HEIC_BRAND.test(String.fromCharCode(...head));
  } catch {
    return false;
  }
}

// iOS Safari refuses to draw a canvas above ~16.7 MP; a 48 MP iPhone photo
// is scaled to fit rather than failing.
const MAX_CANVAS_PIXELS = 16_000_000;

/** Long side, in pixels, for artwork that ends up on cards and banners. */
export const ARTWORK_MAX_SIDE = 1600;

// Already-small JPEG/WebP files under this size are sent as they are:
// re-encoding them would only lose quality.
const PASSTHROUGH_BYTES = 900 * 1024;

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Older Safari rejects the options bag; fall through to <img>.
    }
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImagePrepareError(
      "Зургийг уншиж чадсангүй. JPG, PNG эсвэл WEBP зураг сонгоно уу.",
    );
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function hasTransparency(source: CanvasImageSource, width: number, height: number) {
  // A small sample is enough to tell a cut-out badge from a flat PNG export.
  const sample = document.createElement("canvas");
  const scale = Math.min(1, 96 / Math.max(width, height));
  sample.width = Math.max(1, Math.round(width * scale));
  sample.height = Math.max(1, Math.round(height * scale));
  const context = sample.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return false;
  }

  context.drawImage(source, 0, 0, sample.width, sample.height);
  const { data } = context.getImageData(0, 0, sample.width, sample.height);

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) {
      return true;
    }
  }

  return false;
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "image";
}

/**
 * A HEIC re-encoded as a full-size JPEG. Only a browser that can decode HEIC
 * (Safari on iPhone/Mac, where these files come from) can do this; elsewhere
 * the admin is asked for a JPG instead of storing a page readers cannot see.
 */
async function heicToJpeg(file: Blob, fileName: string): Promise<PreparedImage> {
  let decoded: Decoded;

  try {
    decoded = await decode(file);
  } catch {
    throw new ImagePrepareError(
      `"${fileName}" нь HEIC (iPhone) зураг тул ихэнх уншигчдад харагдахгүй. Энэ хөтөч үүнийг хөрвүүлж чадсангүй — iPhone-ий Safari-аас оруулах эсвэл JPG болгоод дахин сонгоно уу.`,
    );
  }

  try {
    const { width, height, source } = decoded;

    if (!width || !height) {
      throw new ImagePrepareError("Зургийн хэмжээг уншиж чадсангүй.");
    }

    const scale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(width * scale));
    canvas.height = Math.max(1, Math.floor(height * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      throw new ImagePrepareError("Зургийг боловсруулж чадсангүй.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    const blob = await toBlob(canvas, "image/jpeg", 0.92);

    if (!blob || blob.type !== "image/jpeg") {
      throw new ImagePrepareError(
        `"${fileName}"-г JPG болгож чадсангүй. JPG болгоод дахин сонгоно уу.`,
      );
    }

    return {
      blob,
      contentType: "image/jpeg",
      fileName: `${baseName(fileName)}.jpg`,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    decoded.release();
  }
}

const PAGE_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export type PreparedPage = { blob: Blob; contentType: string; fileName: string };

/**
 * A chapter page, ready to upload. Pages go up untouched so translated pages
 * keep their full quality — except HEIC, which is converted to JPEG because
 * most readers' browsers cannot show it.
 */
export async function preparePage(file: File): Promise<PreparedPage> {
  const prepared = (await isHeic(file))
    ? await heicToJpeg(file, file.name)
    : null;
  const blob = prepared?.blob ?? file;
  const fileName = prepared?.fileName ?? file.name;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType =
    prepared?.contentType ??
    (UPLOAD_CONTENT_TYPES[file.type] ? file.type : PAGE_TYPE_BY_EXT[ext]);

  if (!contentType) {
    throw new ImagePrepareError(
      `"${file.name}" — зөвхөн JPG, PNG, WEBP, GIF, AVIF хуудас оруулна.`,
    );
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new ImagePrepareError(
      `"${file.name}" хэт том байна (${(blob.size / 1024 / 1024).toFixed(1)} MB).`,
    );
  }

  return { blob, contentType, fileName };
}

export async function prepareImage(
  file: Blob,
  {
    fileName = "image",
    maxSide = ARTWORK_MAX_SIDE,
    quality = 0.86,
  }: { fileName?: string; maxSide?: number; quality?: number } = {},
): Promise<PreparedImage> {
  const decoded = await decode(file);

  try {
    const { width, height, source } = decoded;

    if (!width || !height) {
      throw new ImagePrepareError("Зургийн хэмжээг уншиж чадсангүй.");
    }

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    if (
      scale === 1 &&
      (file.type === "image/jpeg" || file.type === "image/webp") &&
      file.size <= PASSTHROUGH_BYTES &&
      // A HEIC named .jpg reports image/jpeg; it must be re-encoded.
      !(await isHeic(file))
    ) {
      return {
        blob: file,
        contentType: file.type,
        fileName,
        width,
        height,
      };
    }

    const mayHaveAlpha = /png|webp|gif|avif/.test(file.type);
    const keepAlpha = mayHaveAlpha && hasTransparency(source, width, height);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new ImagePrepareError("Зургийг боловсруулж чадсангүй.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, targetWidth, targetHeight);

    let blob = await toBlob(canvas, "image/webp", keepAlpha ? 0.92 : quality);

    if (!blob || blob.type !== "image/webp") {
      blob = keepAlpha
        ? await toBlob(canvas, "image/png")
        : await toBlob(canvas, "image/jpeg", quality);
    }

    if (!blob) {
      throw new ImagePrepareError("Зургийг шахаж чадсангүй.");
    }

    const ext =
      blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";

    return {
      blob,
      contentType: blob.type,
      fileName: `${baseName(fileName)}.${ext}`,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    decoded.release();
  }
}

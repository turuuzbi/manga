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

export type PreparedImage = {
  blob: Blob;
  contentType: string;
  fileName: string;
  width: number;
  height: number;
};

export class ImagePrepareError extends Error {}

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
      file.size <= PASSTHROUGH_BYTES
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

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const requiredEnvVars = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Missing required R2 env var: ${envVar}`);
  }
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

// Signs URLs only. Kept apart from `r2` because current SDKs add a CRC32
// checksum to every request by default, and on a presigned PUT that checksum is
// computed before the body exists — R2 then rejects the browser's real upload
// as a mismatch. "WHEN_REQUIRED" is Cloudflare's documented setting for
// presigned R2 URLs.
const r2Signer = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/**
 * A short-lived URL the browser can PUT one file to, straight into the bucket.
 * The content type is part of the signature, so the upload must send exactly
 * this `Content-Type`. This is what keeps image bytes out of Server Action
 * bodies, which Vercel rejects above 4.5 MB before our code ever runs.
 */
export async function createPresignedUpload(
  key: string,
  contentType: string,
  expiresInSeconds = 900,
) {
  const uploadUrl = await getSignedUrl(
    r2Signer,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds },
  );

  return { uploadUrl, publicUrl: getR2PublicUrl(key) };
}

/**
 * A short-lived link that downloads the object as a file instead of opening
 * it. The public bucket domain is a different origin, so a plain
 * `<a download>` is ignored there — the attachment disposition on the signed
 * response is what makes iPhone Safari offer "Download".
 */
export async function createPresignedDownload(
  key: string,
  fileName: string,
  expiresInSeconds = 300,
) {
  const asciiName = fileName.replace(/[^\x20-\x7e]+/g, "_").replace(/"/g, "");

  return getSignedUrl(
    r2Signer,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: expiresInSeconds },
  );
}

/**
 * The object key for a URL on our own public bucket domain, or null for any
 * other URL. Stricter than getR2KeyFromUrl, which falls back to the path of
 * any URL — this is the check to use on URLs a browser sends us.
 */
export function getOwnR2Key(url: string): string | null {
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!publicBaseUrl || !url.startsWith(`${publicBaseUrl}/`)) {
    return null;
  }

  const key = url.slice(publicBaseUrl.length + 1);

  return key && !key.includes("..") ? key : null;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType = "image/jpeg",
) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return {
    key,
    url: getR2PublicUrl(key),
  };
}

export async function deleteFromR2(key: string) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}

export function getR2PublicUrl(key: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_URL;

  if (!publicBaseUrl) {
    throw new Error("R2_PUBLIC_URL is not configured.");
  }

  return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

export function getR2KeyFromUrl(url: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  if (publicBaseUrl && url.startsWith(`${publicBaseUrl}/`)) {
    return url.slice(publicBaseUrl.length + 1);
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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

import { Client } from "minio";

export const BUCKET = process.env.MINIO_BUCKET || "bug-screenshots";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    console.log(`[minio] created bucket "${BUCKET}"`);
  } else {
    console.log(`[minio] bucket "${BUCKET}" ready`);
  }
}

export async function presignScreenshot(objectKey, expirySeconds = 7 * 24 * 60 * 60) {
  return minioClient.presignedGetObject(BUCKET, objectKey, expirySeconds);
}

// Stands in for src/config/minio.js during tests (aliased in vitest.config.js), so the
// suite never needs a running object store. Uploads are verified by the API contract,
// not by bytes landing in MinIO.
export const BUCKET = "test-bucket";

export const minioClient = {
  putObject: async () => ({}),
  removeObject: async () => ({}),
  bucketExists: async () => true,
  makeBucket: async () => ({}),
  presignedGetObject: async (bucket, key) => `http://minio.test/${key}`,
};

export const ensureBucket = async () => ({});
export const presignScreenshot = async (objectKey) => `http://minio.test/${objectKey}`;

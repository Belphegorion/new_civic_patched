// backend/services/minioService.js
// Minimal wrapper around MinIO JS SDK to provide presigned PUT URL and object URL.

const Minio = require('minio');
const url = require('url');

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_USE_SSL = (process.env.MINIO_USE_SSL === 'true') || false;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'uploads';

// Create client
const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// Ensure bucket exists (best-effort)
async function ensureBucket(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, '');
      console.log('[minioService] Created bucket:', bucketName);
    }
  } catch (err) {
    console.warn('[minioService] ensureBucket warning:', err && err.message ? err.message : err);
  }
}
ensureBucket(MINIO_BUCKET).catch(() => { /* swallow here; controllers will catch more relevant errors */ });

/**
 * Generate a presigned PUT url for direct browser upload.
 * Returns { uploadUrl, key }
 */
async function getPresignedPutUrl({ bucket = MINIO_BUCKET, key, expires = 60 }) {
  if (!key) throw new Error('Missing object key');
  return new Promise((resolve, reject) => {
    minioClient.presignedPutObject(bucket, key, expires, (err, presignedUrl) => {
      if (err) return reject(err);
      resolve({ uploadUrl: presignedUrl, key });
    });
  });
}

/**
 * Return a direct object URL (optionally presigned GET)
 * If bucket is public, you can construct a public URL. Otherwise we can return a presigned GET.
 */
async function getObjectUrl({ bucket = MINIO_BUCKET, key, expires = 60 }) {
  if (!key) throw new Error('Missing object key');

  // Try to construct public URL (path style)
  const protocol = MINIO_USE_SSL ? 'https' : 'http';
  const host = `${MINIO_ENDPOINT}:${MINIO_PORT}`;
  // path-style URL:
  const publicUrl = `${protocol}://${host}/${bucket}/${encodeURIComponent(key)}`;

  // We still return presigned GET for safety (it works whether bucket is public or private)
  return new Promise((resolve, reject) => {
    minioClient.presignedGetObject(bucket, key, expires, (err, presignedUrl) => {
      if (err) {
        // fallback to public URL if presign fails
        return resolve({ url: publicUrl, presigned: false });
      }
      return resolve({ url: presignedUrl, presigned: true });
    });
  });
}

/**
 * Optionally check if object exists (returns boolean)
 */
async function headObject({ bucket = MINIO_BUCKET, key }) {
  try {
    await minioClient.statObject(bucket, key);
    return true;
  } catch (err) {
    if (err && (err.code === 'NotFound' || err.statusCode === 404)) return false;
    throw err;
  }
}

/**
 * Delete object
 */
async function deleteObject({ bucket = MINIO_BUCKET, key }) {
  return minioClient.removeObject(bucket, key);
}

module.exports = {
  client: minioClient,
  getPresignedPutUrl,
  getObjectUrl,
  headObject,
  deleteObject,
  DEFAULT_BUCKET: MINIO_BUCKET,
};

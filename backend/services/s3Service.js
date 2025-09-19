// services/s3Service.js
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const streamToBuffer = require('../utils/streamToBuffer');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET;

const s3 = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

/**
 * Get object buffer from S3
 * @param {string} bucket
 * @param {string} key
 * @returns {Promise<Buffer>}
 */
async function getObjectBuffer(bucket, key) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const resp = await s3.send(cmd);
  const buffer = await streamToBuffer(resp.Body);
  return buffer;
}

/**
 * Delete object from S3
 */
async function deleteObject(bucket, key) {
  const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  return s3.send(cmd);
}

module.exports = { getObjectBuffer, deleteObject, s3Client: s3 };

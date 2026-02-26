import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = 'shopu-bucket';
const REGION = 'fra1';
const CDN_HOST = `${BUCKET}.${REGION}.cdn.digitaloceanspaces.com`;

let client = null;

function getClient() {
  if (!client) {
    client = new S3Client({
      endpoint: `https://${REGION}.digitaloceanspaces.com`,
      region: REGION,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      },
    });
  }
  return client;
}

/**
 * Uploads a file buffer to DigitalOcean Spaces.
 * @param {Buffer} buffer - File contents
 * @param {string} filename - Original filename
 * @param {string} tenantSlug - Tenant slug for path namespacing
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Public CDN URL
 */
export async function uploadImage(buffer, filename, tenantSlug, mimeType) {
  const timestamp = Date.now();
  const key = `${tenantSlug}/products/${timestamp}-${filename}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    })
  );

  return `https://${CDN_HOST}/${key}`;
}

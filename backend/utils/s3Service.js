import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  }
});

const getUploadPresignedUrl = async (key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || 'tma-videos',
    Key: key,
    ContentType: contentType
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

const getDownloadPresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || 'tma-videos',
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export { getUploadPresignedUrl, getDownloadPresignedUrl };

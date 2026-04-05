import { S3Client, CreateBucketCommand, PutBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'tma-videos';
const REGION = process.env.AWS_REGION || 'ap-south-1';

const setup = async () => {
  // 1. Create bucket if it doesn't exist
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`✅ Bucket "${BUCKET}" already exists.`);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`Creating bucket "${BUCKET}" in ${REGION}...`);
      try {
        const params = { Bucket: BUCKET };
        if (REGION !== 'us-east-1') {
          params.CreateBucketConfiguration = { LocationConstraint: REGION };
        }
        await s3.send(new CreateBucketCommand(params));
        console.log(`✅ Bucket "${BUCKET}" created!`);
      } catch (createErr) {
        console.error('❌ Failed to create bucket:', createErr.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Error checking bucket:', err.message);
      process.exit(1);
    }
  }

  // 2. Set CORS so browsers can PUT directly from localhost/production
  try {
    await s3.send(new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['http://localhost:3000', 'https://*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600
          }
        ]
      }
    }));
    console.log('✅ CORS configured on S3 bucket.');
  } catch (err) {
    console.error('❌ Failed to set CORS:', err.message);
  }

  console.log('\n🚀 S3 setup complete! Video uploads will now work from the browser.');
  process.exit(0);
};

setup();

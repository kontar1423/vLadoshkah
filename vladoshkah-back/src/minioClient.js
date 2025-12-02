import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

if (process.env.NODE_ENV !== 'test') {
  minioClient.bucketExists(process.env.MINIO_BUCKET)
    .then(exists => {
      if (exists) {
        console.log(`MinIO connected. Bucket "${process.env.MINIO_BUCKET}" exists`);
      } else {
        console.log(`Bucket "${process.env.MINIO_BUCKET}" does not exist`);
      }
    })
    .catch(err => {
      console.error('MinIO connection error:', err.message);
    });
}

export default minioClient;
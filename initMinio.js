import minioClient from "./minioClient.js";

const bucketName = process.env.MINIO_BUCKET || 'uploads';

async function initMinio() {
  try {
    console.log('🔄 Checking MinIO bucket...');
    
    const exists = await minioClient.bucketExists(bucketName);
    
    if (!exists) {
      console.log(`🪣 Creating bucket: ${bucketName}`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket "${bucketName}" created successfully`);
    } else {
      console.log(`✅ Bucket "${bucketName}" already exists`);
    }
    
    return true; // Успешная инициализация
  } catch (error) {
    console.error('❌ MinIO initialization error:', error.message);
    // return false; // Неуспешная инициализация
  }
}

export default initMinio;
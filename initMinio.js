// initMinio.js
import minioClient from './minioClient.js';

async function setBucketPublic(bucketName) {
  try {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: [
            's3:GetObject',
            's3:GetObjectVersion'
          ],
          Resource: [
            `arn:aws:s3:::${bucketName}/*`
          ]
        }
      ]
    };

    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`✅ Bucket "${bucketName}" set to public`);
  } catch (error) {
    console.error(`❌ Error setting bucket policy for ${bucketName}:`, error.message);
    // Если политика уже установлена - это нормально
    if (!error.message.includes('PolicyAlreadyExists')) {
      throw error;
    }
  }
}

async function initMinio() {
  try {
    const bucketName = process.env.MINIO_BUCKET || 'uploads';
    
    // Проверяем существует ли бакет
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      // Создаем бакет
      await minioClient.makeBucket(bucketName);
      console.log(`✅ Bucket "${bucketName}" created`);
      
      // Сразу устанавливаем публичный доступ
      await setBucketPublic(bucketName);
    } else {
      console.log(`✅ Bucket "${bucketName}" already exists`);
      // Убедимся что политика установлена (на случай перезапуска)
      await setBucketPublic(bucketName);
    }
    
    console.log('🎉 MinIO initialization completed');
    
  } catch (error) {
    console.error('❌ MinIO initialization failed:', error);
    throw error;
  }
}

export default initMinio;
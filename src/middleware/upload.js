import multer, { memoryStorage } from 'multer';

// Храним файлы в памяти для загрузки в MinIO
const storage = memoryStorage();

const fileFilter = (req, file, cb) => {
  // Проверяем тип файла
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

export default upload;
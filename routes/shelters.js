import express from 'express';
import multer from 'multer';
import sheltersController from "../controllers/sheltersController.js";

const router = express.Router();

// Настройка multer ДО определения роутов
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ✅ Multer middleware для парсинга form-data
router.use(express.urlencoded({ extended: true }));

// GET /api/shelters - получить все приюты
router.get('/', sheltersController.getAll);

// GET /api/shelters/:id - получить приют по ID
router.get('/:id', sheltersController.getById);

// POST /api/shelters - создать новый приют
router.post('/', upload.single('photo'), sheltersController.create);

// PUT /api/shelters/:id - обновить приют
router.put('/:id', sheltersController.update);

// PATCH /api/shelters/:id - частично обновить приют  
router.patch('/:id', sheltersController.update);

// DELETE /api/shelters/:id - удалить приют
router.delete('/:id', sheltersController.remove);

export default router;
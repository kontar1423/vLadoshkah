import express from 'express';
import multer from 'multer';
import animalsController from '../controllers/animalsController.js';

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
// GET /api/animals - получить всех животных
router.get('/', animalsController.getAll);

// GET /api/animals/filters - получить животных с фильтрами
router.get('/filters', animalsController.getAnimalsWithFilters);

// GET /api/animals/:id - получить животное по ID
router.get('/:id', animalsController.getById);

// GET /api/animals/shelter/:shelterId - получить животных по приюту
router.get('/shelter/:shelterId', animalsController.getAllByShelterId);

// POST /api/animals - создать новое животное
router.post('/', upload.single('photo'),animalsController.create);

// PUT /api/animals/:id - обновить животное
router.put('/:id', animalsController.update);

// PATCH /api/animals/:id - частично обновить животное
router.patch('/:id', animalsController.update);

// DELETE /api/animals/:id - удалить животное
router.delete('/:id', animalsController.remove);

// GET /api/animals/search/:term - поиск животных
router.get('/search/:term', animalsController.getAnimalsWithFilters);

export default router;


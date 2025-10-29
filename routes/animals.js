import express from 'express';
import multer from 'multer';
import animalsController from '../controllers/animalsController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

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
// GET /api/animals - получить всех животных (публичный)
router.get('/', animalsController.getAll);

// GET /api/animals/filters - получить животных с фильтрами (публичный)
router.get('/filters', animalsController.getAnimalsWithFilters);

// GET /api/animals/:id - получить животное по ID (публичный)
router.get('/:id', animalsController.getById);

// GET /api/animals/shelter/:shelterId - получить животных по приюту (публичный)
router.get('/shelter/:shelterId', animalsController.getAllByShelterId);

// POST /api/animals - создать новое животное (только админ сайта или админ приюта)
router.post('/', authenticateToken, authorize('admin', 'shelter_admin'), upload.single('photo'), animalsController.create);

// PUT /api/animals/:id - обновить животное (только админ сайта или админ приюта)
router.put('/:id', authenticateToken, authorize('admin', 'shelter_admin'), animalsController.update);

// PATCH /api/animals/:id - частично обновить животное (только админ сайта или админ приюта)
router.patch('/:id', authenticateToken, authorize('admin', 'shelter_admin'), animalsController.update);

// DELETE /api/animals/:id - удалить животное (только админ сайта или админ приюта)
router.delete('/:id', authenticateToken, authorize('admin', 'shelter_admin'), animalsController.remove);

// GET /api/animals/search/:term - поиск животных (публичный)
router.get('/search/:term', animalsController.getAnimalsWithFilters);

export default router;


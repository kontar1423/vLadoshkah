import express from 'express';
import multer from 'multer';
import sheltersController from "../controllers/sheltersController.js";
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createShelterSchema, updateShelterSchema, shelterIdSchema } from '../validators/sheltersValidator.js';

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

// GET /api/shelters - получить все приюты (публичный)
router.get('/', sheltersController.getAll);

// GET /api/shelters/:id - получить приют по ID (публичный)
router.get('/:id', validate(shelterIdSchema, 'params'), sheltersController.getById);

// POST /api/shelters - создать новый приют (только админ сайта)
router.post('/', authenticateToken, authorize('admin'), upload.single('photo'), validate(createShelterSchema), sheltersController.create);

// PUT /api/shelters/:id - обновить приют (только админ сайта)
router.put('/:id', authenticateToken, authorize('admin'), validate(shelterIdSchema, 'params'), validate(updateShelterSchema), sheltersController.update);

// PATCH /api/shelters/:id - частично обновить приют (только админ сайта)
router.patch('/:id', authenticateToken, authorize('admin'), validate(shelterIdSchema, 'params'), validate(updateShelterSchema), sheltersController.update);

// DELETE /api/shelters/:id - удалить приют (только админ сайта)
router.delete('/:id', authenticateToken, authorize('admin'), validate(shelterIdSchema, 'params'), sheltersController.remove);

export default router;
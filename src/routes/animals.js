import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import animalsController from '../controllers/animalsController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createAnimalSchema, updateAnimalSchema, animalFiltersSchema, animalIdSchema } from '../validators/animalsValidator.js';

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

// Middleware для обработки form-data
router.use(express.urlencoded({ extended: true }));
// GET /api/animals - получить всех животных (публичный)
router.get('/', animalsController.getAll);

// GET /api/animals/filters - получить животных с фильтрами (публичный)
router.get('/filters', validate(animalFiltersSchema, 'query'), animalsController.getAnimalsWithFilters);

// GET /api/animals/shelter/:shelterId - получить животных по приюту (публичный)
const shelterIdSchema = Joi.object({
  shelterId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом',
      'any.required': 'ID приюта обязателен'
    })
});
router.get('/shelter/:shelterId', validate(shelterIdSchema, 'params'), animalsController.getAllByShelterId);

// GET /api/animals/search/:term - поиск животных (публичный)
router.get('/search/:term', animalsController.getAnimalsWithFilters);

// GET /api/animals/:id - получить животное по ID (публичный)
router.get('/:id', validate(animalIdSchema, 'params'), animalsController.getById);

// POST /api/animals - создать новое животное (только админ сайта или админ приюта)
router.post('/', authenticateToken, authorize('admin', 'shelter_admin'), upload.single('photo'), validate(createAnimalSchema), animalsController.create);

// PUT /api/animals/:id - обновить животное (только админ сайта или админ приюта)
router.put('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(animalIdSchema, 'params'), validate(updateAnimalSchema), animalsController.update);

// PATCH /api/animals/:id - частично обновить животное (только админ сайта или админ приюта)
router.patch('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(animalIdSchema, 'params'), validate(updateAnimalSchema), animalsController.update);

// DELETE /api/animals/:id - удалить животное (только админ сайта или админ приюта)
router.delete('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(animalIdSchema, 'params'), animalsController.remove);

export default router;

import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import animalsController from '../controllers/animalsController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createAnimalSchema, updateAnimalSchema, animalFiltersSchema, animalIdSchema } from '../validators/animalsValidator.js';

const router = express.Router();

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

router.use(express.urlencoded({ extended: true }));
router.get('/', animalsController.getAll);

router.get('/filters', validate(animalFiltersSchema, 'query'), animalsController.getAnimalsWithFilters);

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

router.get('/search/:term', animalsController.getAnimalsWithFilters);

router.get('/:id', validate(animalIdSchema, 'params'), animalsController.getById);

router.post(
  '/',
  authenticateToken,
  authorize('admin', 'shelter_admin'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'photos', maxCount: 5 },
  ]),
  validate(createAnimalSchema),
  animalsController.create
);

router.put('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(animalIdSchema, 'params'), validate(updateAnimalSchema), animalsController.update);

router.patch('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(animalIdSchema, 'params'), validate(updateAnimalSchema), animalsController.update);

router.delete('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(animalIdSchema, 'params'), animalsController.remove);

export default router;

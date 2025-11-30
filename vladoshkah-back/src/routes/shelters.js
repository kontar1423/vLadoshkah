import express from 'express';
import multer from 'multer';
import sheltersController from "../controllers/sheltersController.js";
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createShelterSchema, updateShelterSchema, shelterIdSchema, shelterVoteSchema, shelterAdminIdSchema } from '../validators/sheltersValidator.js';

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

// GET /api/shelters - получить все приюты (публичный)
router.get('/', sheltersController.getAll);

// POST /api/shelters/vote - проголосовать за приют (только авторизованные)
router.post('/vote', authenticateToken, validate(shelterVoteSchema), sheltersController.vote);

// GET /api/shelters/admin/:adminId - получить приют по shelter_admin_id (публичный)
router.get('/admin/:adminId', validate(shelterAdminIdSchema, 'params'), sheltersController.getByAdminId);

// GET /api/shelters/:id - получить приют по ID (публичный)
router.get('/:id', validate(shelterIdSchema, 'params'), sheltersController.getById);

// POST /api/shelters - создать новый приют (только админ сайта)
router.post(
  '/',
  authenticateToken,
  authorize('admin', 'shelter_admin'),
  upload.fields([
    { name: 'photo', maxCount: 1 },   // совместимость со старым полем
    { name: 'photos', maxCount: 10 }, // новое поле для нескольких фото
  ]),
  validate(createShelterSchema),
  sheltersController.create
);

// PUT /api/shelters/:id - обновить приют (админ сайта или админ своего приюта)
router.put('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(shelterIdSchema, 'params'), validate(updateShelterSchema), sheltersController.update);

// PATCH /api/shelters/:id - частично обновить приют (админ сайта или админ своего приюта)
router.patch('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(shelterIdSchema, 'params'), validate(updateShelterSchema), sheltersController.update);

// DELETE /api/shelters/:id - удалить приют (админ сайта или админ своего приюта)
router.delete('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(shelterIdSchema, 'params'), sheltersController.remove);

export default router;

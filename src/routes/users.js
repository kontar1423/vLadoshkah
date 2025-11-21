import express from 'express';
import multer from 'multer';
import usersController from "../controllers/usersController.js";
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validators/usersValidator.js';

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

// GET /api/users - получить всех пользователей (публичный)
router.get('/', usersController.getAll);

// Текущий пользователь (должно идти до параметризованных роутов)
router.get('/me', authenticateToken, usersController.getMe);
router.patch('/me', authenticateToken, validate(updateUserSchema), usersController.updateMe);
router.put('/me', authenticateToken, validate(updateUserSchema), usersController.updateMe);

// PUT /api/users/:id - обновить пользователя (требует авторизации)
router.put('/:id', authenticateToken, authorize('admin'), validate(userIdSchema, 'params'), validate(updateUserSchema), usersController.update);

// PATCH /api/users/:id - частично обновить пользователя (требует авторизации)
router.patch('/:id', authenticateToken, authorize('admin'), validate(userIdSchema, 'params'), validate(updateUserSchema), usersController.update);

// GET /api/users/:id - получить пользователя по ID (публичный)
router.get('/:id', validate(userIdSchema, 'params'), usersController.getById);

// DELETE /api/users/:id - удалить пользователя (только для админов)
router.delete('/:id', authenticateToken, authorize('admin'), validate(userIdSchema, 'params'), usersController.remove);

// POST /api/users - создать нового пользователя (требует авторизации)
router.post('/', authenticateToken, upload.single('photo'), validate(createUserSchema), usersController.create);

export default router;

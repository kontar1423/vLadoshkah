import express from 'express';
import multer from 'multer';
import usersController from "../controllers/usersController.js";
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

// GET /api/users - получить всех пользователей (публичный)
router.get('/', usersController.getAll);

// GET /api/users/:id - получить пользователя по ID (публичный)
router.get('/:id', usersController.getById);

// POST /api/users - создать нового пользователя (требует авторизации)
router.post('/', authenticateToken, upload.single('photo'), usersController.create);

// PUT /api/users/:id - обновить пользователя (требует авторизации)
router.put('/:id', authenticateToken, usersController.update);

// PATCH /api/users/:id - частично обновить пользователя (требует авторизации)
router.patch('/:id', authenticateToken, usersController.update);

// DELETE /api/users/:id - удалить пользователя (только для админов)
router.delete('/:id', authenticateToken, authorize('admin'), usersController.remove);

export default router;
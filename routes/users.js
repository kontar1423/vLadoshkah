import express from 'express';
import multer from 'multer';
import usersController from "../controllers/usersController.js";

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

// GET /api/users - получить всех пользователей
router.get('/', usersController.getAll);

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', usersController.getById);

// POST /api/users - создать нового пользователя
router.post('/', upload.single('photo'), usersController.create);

// PUT /api/users/:id - обновить пользователя
router.put('/:id', usersController.update);

// PATCH /api/users/:id - частично обновить пользователя
router.patch('/:id', usersController.update);

// DELETE /api/users/:id - удалить пользователя
router.delete('/:id', usersController.remove);

export default router;
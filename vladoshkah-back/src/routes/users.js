import express from 'express';
import multer from 'multer';
import usersController from "../controllers/usersController.js";
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createUserSchema, updateUserSchema, userIdSchema, userFavoriteSchema, userFavoriteBulkSchema } from '../validators/usersValidator.js';

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

router.get('/', usersController.getAll);

router.get('/me', authenticateToken, usersController.getMe);
router.patch('/me', authenticateToken, validate(updateUserSchema), usersController.updateMe);
router.put('/me', authenticateToken, validate(updateUserSchema), usersController.updateMe);

router.get('/favorite', authenticateToken, validate(userFavoriteSchema, 'query'), usersController.getFavorite);
router.post('/favorite', authenticateToken, validate(userFavoriteSchema), usersController.addFavorite);
router.delete('/favorite', authenticateToken, validate(userFavoriteSchema), usersController.removeFavorite);
router.post('/favorite/animals', authenticateToken, validate(userFavoriteBulkSchema), usersController.bulkFavoriteStatus);

router.put('/:id', authenticateToken, authorize('admin'), validate(userIdSchema, 'params'), validate(updateUserSchema), usersController.update);

router.patch('/:id', authenticateToken, authorize('admin'), validate(userIdSchema, 'params'), validate(updateUserSchema), usersController.update);

router.get('/:id', validate(userIdSchema, 'params'), usersController.getById);

router.delete('/:id', authenticateToken, authorize('admin'), validate(userIdSchema, 'params'), usersController.remove);

router.post('/', authenticateToken, upload.single('photo'), validate(createUserSchema), usersController.create);

export default router;

import express from 'express';
import multer from 'multer';
import sheltersController from "../controllers/sheltersController.js";
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createShelterSchema, updateShelterSchema, shelterIdSchema, shelterVoteSchema, shelterAdminIdSchema } from '../validators/sheltersValidator.js';

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

router.get('/', sheltersController.getAll);

router.post('/vote', authenticateToken, validate(shelterVoteSchema), sheltersController.vote);

router.get('/admin/:adminId', validate(shelterAdminIdSchema, 'params'), sheltersController.getByAdminId);

router.get('/:id', validate(shelterIdSchema, 'params'), sheltersController.getById);

router.post(
  '/',
  authenticateToken,
  authorize('admin', 'shelter_admin'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
  ]),
  validate(createShelterSchema),
  sheltersController.create
);

router.put('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(shelterIdSchema, 'params'), validate(updateShelterSchema), sheltersController.update);

router.patch('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(shelterIdSchema, 'params'), validate(updateShelterSchema), sheltersController.update);

router.delete('/:id', authenticateToken, authorize('admin', 'shelter_admin'), validate(shelterIdSchema, 'params'), sheltersController.remove);

export default router;

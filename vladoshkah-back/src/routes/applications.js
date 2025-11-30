import express from 'express';
import multer from 'multer';
import applicationsController from '../controllers/applicationsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { 
  createApplicationSchema, 
  updateApplicationSchema, 
  applicationIdSchema,
  createGiveApplicationSchema,
  updateGiveApplicationSchema
} from '../validators/applicationsValidator.js';

const router = express.Router();
const takeRouter = express.Router();
const giveRouter = express.Router();

// Multer для фото "отдать" питомца
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// TAKE (adopt) routes
takeRouter.post('/', authenticateToken, validate(createApplicationSchema), applicationsController.createTake);
takeRouter.get('/count/approved', applicationsController.countApprovedTake);
takeRouter.get('/by-animal/:animalId', authenticateToken, applicationsController.getTakeByAnimalId);
takeRouter.get('/:id', authenticateToken, validate(applicationIdSchema, 'params'), applicationsController.getTakeById);
takeRouter.get('/', authenticateToken, applicationsController.getAllTake);
takeRouter.put('/:id', authenticateToken, validate(applicationIdSchema, 'params'), validate(updateApplicationSchema), applicationsController.updateTake);
takeRouter.delete('/:id', authenticateToken, validate(applicationIdSchema, 'params'), applicationsController.removeTake);

// GIVE (surrender) routes
giveRouter.post('/', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photos', maxCount: 1 }
]), validate(createGiveApplicationSchema), applicationsController.createGive);
giveRouter.get('/:id', authenticateToken, validate(applicationIdSchema, 'params'), applicationsController.getGiveById);
giveRouter.get('/', authenticateToken, applicationsController.getAllGive);
giveRouter.put('/:id', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photos', maxCount: 1 }
]), validate(applicationIdSchema, 'params'), validate(updateGiveApplicationSchema), applicationsController.updateGive);
giveRouter.delete('/:id', authenticateToken, validate(applicationIdSchema, 'params'), applicationsController.removeGive);

router.use('/take', takeRouter);
router.use('/give', giveRouter);

// Legacy /api/applications/* behaves as /take
router.use('/', takeRouter);

export default router;

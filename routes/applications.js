import express from 'express';
import applicationsController from '../controllers/applicationsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createApplicationSchema, updateApplicationSchema, applicationIdSchema } from '../validators/applicationsValidator.js';

const router = express.Router();

// Все роуты заявок требуют авторизации
router.post('/', authenticateToken, validate(createApplicationSchema), applicationsController.create);
router.get('/count/approved', applicationsController.countApproved);
router.get('/:id', authenticateToken, validate(applicationIdSchema, 'params'), applicationsController.getById);
router.get('/', authenticateToken, applicationsController.getAll);
router.put('/:id', authenticateToken, validate(applicationIdSchema, 'params'), validate(updateApplicationSchema), applicationsController.update);
router.delete('/:id', authenticateToken, validate(applicationIdSchema, 'params'), applicationsController.remove);

export default router;

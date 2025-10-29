import express from 'express';
import applicationsController from '../controllers/applicationsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Все роуты заявок требуют авторизации
router.post('/', authenticateToken, applicationsController.create);
router.get('/count/approved', authenticateToken, applicationsController.countApproved);
router.get('/:id', authenticateToken, applicationsController.getById);
router.get('/', authenticateToken, applicationsController.getAll);
router.put('/:id', authenticateToken, applicationsController.update);
router.delete('/:id', authenticateToken, applicationsController.remove);

export default router;

import express from 'express';
import applicationsController from '../controllers/applicationsController.js';

const router = express.Router();

router.post('/', applicationsController.create);
router.get('/:id', applicationsController.getById);
router.get('/', applicationsController.getAll);
router.put('/:id', applicationsController.update);
router.delete('/:id', applicationsController.remove);

export default router;

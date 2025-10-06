import express from 'express';
import { PhotosController } from '../controllers/photosController.js';

const router = express.Router();

router.get('/', PhotosController.getAll);
router.get('/:id', PhotosController.getById);
router.get('/entity/:type/:id', PhotosController.getByEntity);
router.post('/', PhotosController.create);
router.delete('/:id', PhotosController.delete);

export default router;

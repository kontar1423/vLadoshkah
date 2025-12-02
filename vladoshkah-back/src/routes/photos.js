import express from 'express';
import upload from '../middleware/upload.js';
import photosController from '../controllers/photosController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', authenticateToken, upload.single('photo'), photosController.uploadPhoto);

router.get('/info/:id', photosController.getPhotoInfo);

router.get('/file/:objectName', photosController.getPhotoFile);

router.delete('/:id', authenticateToken, photosController.deletePhoto);

router.get('/entity/:entityType/:entityId', photosController.getPhotosByEntity);

router.get('/', photosController.getAllPhotos);

export default router;


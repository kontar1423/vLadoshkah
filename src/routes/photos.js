import express from 'express';
import upload from '../middleware/upload.js';
import photosController from '../controllers/photosController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Загрузка фото (требует авторизации)
router.post('/upload', authenticateToken, upload.single('photo'), photosController.uploadPhoto);

// Получение информации о фото по ID (публичный)
router.get('/info/:id', photosController.getPhotoInfo);

// Получение файла фото по object_name (публичный)
router.get('/file/:objectName', photosController.getPhotoFile);

// Удаление фото по ID (требует авторизации)
router.delete('/:id', authenticateToken, photosController.deletePhoto);

// Получение фото по сущности (публичный)
router.get('/entity/:entityType/:entityId', photosController.getPhotosByEntity);

// Получение всех фото (публичный)
router.get('/', photosController.getAllPhotos);

export default router;


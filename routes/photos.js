import express from 'express';
import upload from '../middleware/upload.js';
import photosController from '../controllers/photosController.js';

const router = express.Router();

// Загрузка фото
router.post('/upload', upload.single('photo'), photosController.uploadPhoto);

// Получение информации о фото по ID
router.get('/info/:id', photosController.getPhotoInfo);

// Получение файла фото по object_name
router.get('/file/:objectName', photosController.getPhotoFile);

// Удаление фото по ID
router.delete('/:id', photosController.deletePhoto);

// Получение фото по сущности
router.get('/entity/:entityType/:entityId', photosController.getPhotosByEntity);

// Получение всех фото
router.get('/', photosController.getAllPhotos);

export default router;


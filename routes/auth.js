import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register - регистрация нового пользователя
router.post('/register', authController.register);

// POST /api/auth/login - вход пользователя
router.post('/login', authController.login);

// POST /api/auth/refresh - обновление access токена
router.post('/refresh', authController.refreshToken);

export default router;


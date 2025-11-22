import express from 'express';
import authController from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/authValidator.js';

const router = express.Router();

// POST /api/auth/register - регистрация нового пользователя
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login - вход пользователя
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh - обновление access токена
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

export default router;


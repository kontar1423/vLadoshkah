import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';
const jwtConfig = authConfig.jwt;
import logger from '../logger.js';

/**
 * Middleware для проверки JWT токена
 * Добавляет данные пользователя в req.user
 */
function authenticateToken(req, res, next) {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Проверяем токен
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired'
          });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            error: 'Invalid token'
          });
        }
        return res.status(403).json({
          success: false,
          error: 'Token verification failed'
        });
      }

      // Добавляем данные пользователя в запрос
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    });
  } catch (error) {
    logger.error(error, 'Middleware: error in authenticateToken');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Middleware для проверки роли пользователя
 * @param {...string} allowedRoles - Роли, которым разрешен доступ
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

export {
  authenticateToken,
  authorize
};


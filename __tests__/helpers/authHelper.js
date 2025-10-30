import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth.js';

const jwtConfig = authConfig.jwt;

/**
 * Генерирует тестовый JWT токен
 * @param {Object} payload - Данные для токена
 * @param {number} payload.userId - ID пользователя
 * @param {string} payload.email - Email пользователя
 * @param {string} payload.role - Роль пользователя (admin, shelter_admin, user)
 * @returns {string} JWT токен
 */
export function generateTestToken(payload = {}) {
  const defaultPayload = {
    userId: payload.userId || 1,
    email: payload.email || 'test@example.com',
    role: payload.role || 'admin'
  };

  return jwt.sign(defaultPayload, jwtConfig.secret, {
    expiresIn: '7d'
  });
}

/**
 * Создает заголовок Authorization для запросов
 * @param {string} token - JWT токен
 * @returns {Object} Объект с заголовком Authorization
 */
export function authHeader(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}


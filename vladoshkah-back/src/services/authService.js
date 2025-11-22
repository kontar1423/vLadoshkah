import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userDAO from '../dao/usersDao.js';
import logger from '../logger.js';
import authConfig from '../config/auth.js';
import kafkaProducer from '../messaging/kafka-producer.js';
const jwtConfig = authConfig.jwt;
const bcryptConfig = authConfig.bcrypt;

/**
 * Регистрация нового пользователя (минимальная - только email и password)
 * Остальные данные профиля (firstname, lastname, gender, phone, bio) можно дополнить через PUT /api/users/:id
 * @param {Object} userData - Данные пользователя (email - обязательный, password - обязательный, role - опциональный, по умолчанию 'user')
 * @returns {Promise<Object>} - Созданный пользователь (без пароля) и токены (accessToken, refreshToken)
 */
async function register(userData) {
  try {
    const {email, password, role = 'user'} = userData;

    // Проверяем, не существует ли пользователь с таким email
    const existingUser = await userDAO.getByEmail(email);
    if (existingUser) {
      const err = new Error('User with this email already exists');
      err.status = 409;
      throw err;
    }

    // Валидация обязательных полей
    if (!email || !password ) {
      const err = new Error('Missing required fields: email, password');
      err.status = 400;
      throw err;
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error('Invalid email format');
      err.status = 400;
      throw err;
    }

    // Валидация пароля (минимум 6 символов)
    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.status = 400;
      throw err;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, bcryptConfig.saltRounds);
    
    // Создаем пользователя только с email и password
    // Остальные поля (firstname, lastname, gender, phone, bio) можно дополнить позже через PUT /api/users/:id
    const user = await userDAO.create({
      email,
      password: hashedPassword,
      role,
      firstname: null,
      lastname: null,
      gender: null,
      phone: null,
      bio: null
    });

    // Удаляем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    // Генерируем токены
    const tokens = generateTokens(user.id, user.email, user.role);

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    // Отправляем событие в Kafka для асинхронного оповещения
    try {
      await kafkaProducer.sendEvent('user-notifications', {
        eventType: 'user.registered',
        timestamp: new Date().toISOString(),
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          firstname: user.firstname,
          lastname: user.lastname
        }
      }, user.id.toString());
    } catch (err) {
      // Логируем ошибку, но не прерываем регистрацию
      logger.error({ err, userId: user.id }, 'Failed to send registration event to Kafka');
    }

    return {
      user: userWithoutPassword,
      ...tokens
    };
  } catch (err) {
    logger.error(err, 'Service: error registering user');
    throw err;
  }
}

/**
 * Вход пользователя
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль пользователя
 * @returns {Promise<Object>} - Пользователь (без пароля) и токены
 */
async function login(email, password) {
  try {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    // Находим пользователя по email
    const user = await userDAO.getByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // Удаляем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    // Генерируем токены
    const tokens = generateTokens(user.id, user.email, user.role);

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      user: userWithoutPassword,
      ...tokens
    };
  } catch (err) {
    logger.error(err, 'Service: error logging in user');
    throw err;
  }
}

/**
 * Обновление access токена с помощью refresh токена
 * @param {string} refreshToken - Refresh токен
 * @returns {Promise<Object>} - Новые токены
 */
async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      const err = new Error('Refresh token is required');
      err.status = 400;
      throw err;
    }

    // Проверяем refresh токен
    const decoded = jwt.verify(refreshToken, jwtConfig.secret);
    
    // Находим пользователя
    const user = await userDAO.getById(decoded.userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }

    // Генерируем новые токены
    const tokens = generateTokens(user.id, user.email, user.role);

    return tokens;
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      const error = new Error('Invalid or expired refresh token');
      error.status = 401;
      throw error;
    }
    logger.error(err, 'Service: error refreshing token');
    throw err;
  }
}

/**
 * Генерация access и refresh токенов
 * @param {number} userId - ID пользователя
 * @param {string} email - Email пользователя
 * @param {string} role - Роль пользователя
 * @returns {Object} - Объект с accessToken и refreshToken
 */
function generateTokens(userId, email, role) {
  const payload = {
    userId,
    email,
    role
  };

  const accessToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });

  const refreshToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn
  });

  return {
    accessToken,
    refreshToken
  };
}

export default {
  register,
  login,
  refreshAccessToken
};

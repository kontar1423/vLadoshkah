import Joi from 'joi';

// Схема для регистрации
export const registerSchema = Joi.object({
  email: Joi.string().email().max(100).required()
    .messages({
      'string.empty': 'Email обязателен для заполнения',
      'string.email': 'Email должен быть в правильном формате',
      'string.max': 'Email не должен превышать 100 символов',
      'any.required': 'Email обязателен'
    }),
  password: Joi.string().min(6).max(255).required()
    .messages({
      'string.empty': 'Пароль обязателен для заполнения',
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'string.max': 'Пароль не должен превышать 255 символов',
      'any.required': 'Пароль обязателен'
    }),
  role: Joi.string().valid('user', 'admin', 'shelter_admin').default('user').optional()
    .messages({
      'any.only': 'Роль должна быть одной из: user, admin, shelter_admin'
    })
});

// Схема для входа
export const loginSchema = Joi.object({
  email: Joi.string().email().max(100).required()
    .messages({
      'string.empty': 'Email обязателен для заполнения',
      'string.email': 'Email должен быть в правильном формате',
      'string.max': 'Email не должен превышать 100 символов',
      'any.required': 'Email обязателен'
    }),
  password: Joi.string().min(1).required()
    .messages({
      'string.empty': 'Пароль обязателен для заполнения',
      'any.required': 'Пароль обязателен'
    })
});

// Схема для обновления токена
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({
      'string.empty': 'Refresh токен обязателен для заполнения',
      'any.required': 'Refresh токен обязателен'
    })
});


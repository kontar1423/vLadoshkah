import Joi from 'joi';

// Схема для создания пользователя
export const createUserSchema = Joi.object({
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
  firstname: Joi.string().max(100).optional().allow(null, '')
    .messages({
      'string.max': 'Имя не должно превышать 100 символов'
    }),
  lastname: Joi.string().max(100).optional().allow(null, '')
    .messages({
      'string.max': 'Фамилия не должна превышать 100 символов'
    }),
  role: Joi.string().valid('user', 'admin', 'shelter_admin').default('user').optional()
    .messages({
      'any.only': 'Роль должна быть одной из: user, admin, shelter_admin'
    }),
  gender: Joi.string().max(30).optional().allow(null, '')
    .messages({
      'string.max': 'Пол не должен превышать 30 символов'
    }),
  phone: Joi.string().max(30).optional().allow(null, '')
    .messages({
      'string.max': 'Телефон не должен превышать 30 символов'
    }),
  bio: Joi.string().max(2000).optional().allow(null, '')
    .messages({
      'string.max': 'Bio не должна превышать 2000 символов'
    })
});

// Схема для обновления пользователя (все поля опциональны, кроме email - он вообще не должен обновляться через это API)
export const updateUserSchema = Joi.object({
  password: Joi.string().min(6).max(255).optional()
    .messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'string.max': 'Пароль не должен превышать 255 символов'
    }),
  firstname: Joi.string().max(100).optional().allow(null, '')
    .messages({
      'string.max': 'Имя не должно превышать 100 символов'
    }),
  lastname: Joi.string().max(100).optional().allow(null, '')
    .messages({
      'string.max': 'Фамилия не должна превышать 100 символов'
    }),
  role: Joi.string().valid('user', 'admin', 'shelter_admin').optional()
    .messages({
      'any.only': 'Роль должна быть одной из: user, admin, shelter_admin'
    }),
  gender: Joi.string().max(30).optional().allow(null, '')
    .messages({
      'string.max': 'Пол не должен превышать 30 символов'
    }),
  phone: Joi.string().max(30).optional().allow(null, '')
    .messages({
      'string.max': 'Телефон не должен превышать 30 символов'
    }),
  bio: Joi.string().max(2000).optional().allow(null, '')
    .messages({
      'string.max': 'Bio не должна превышать 2000 символов'
    })
}).min(1).messages({
  'object.min': 'Должно быть указано хотя бы одно поле для обновления'
});

// Схема для валидации ID (параметр маршрута)
export const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным числом',
      'any.required': 'ID обязателен'
    })
});

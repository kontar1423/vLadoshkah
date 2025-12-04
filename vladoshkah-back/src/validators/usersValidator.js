import Joi from 'joi';

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
});

export const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным числом',
      'any.required': 'ID обязателен'
    })
});

export const userFavoriteSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'user_id должен быть числом',
      'number.integer': 'user_id должен быть целым числом',
      'number.positive': 'user_id должен быть положительным числом'
    }),
  animal_id: Joi.number().integer().positive()
    .messages({
      'number.base': 'animal_id должен быть числом',
      'number.integer': 'animal_id должен быть целым числом',
      'number.positive': 'animal_id должен быть положительным числом'
    }),
  shelter_id: Joi.number().integer().positive()
    .messages({
      'number.base': 'shelter_id должен быть числом',
      'number.integer': 'shelter_id должен быть целым числом',
      'number.positive': 'shelter_id должен быть положительным числом'
    })
}).xor('animal_id', 'shelter_id')
  .messages({
    'object.xor': 'Укажите animal_id или shelter_id (только одно поле)'
  });

export const userFavoriteBulkSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'user_id должен быть числом',
      'number.integer': 'user_id должен быть целым числом',
      'number.positive': 'user_id должен быть положительным числом'
    }),
  animal_ids: Joi.array().items(
    Joi.number().integer().positive().required()
      .messages({
        'number.base': 'animal_id должен быть числом',
        'number.integer': 'animal_id должен быть целым числом',
        'number.positive': 'animal_id должен быть положительным числом',
        'any.required': 'animal_id обязателен'
      })
  ).min(1).required()
    .messages({
      'array.base': 'animal_ids должен быть массивом чисел',
      'array.min': 'animal_ids должен содержать хотя бы одно значение',
      'any.required': 'animal_ids обязателен'
    })
});

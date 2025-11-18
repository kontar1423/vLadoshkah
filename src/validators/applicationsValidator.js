import Joi from 'joi';

// Схема для создания заявки
export const createApplicationSchema = Joi.object({
  user_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID пользователя должен быть числом',
      'number.integer': 'ID пользователя должен быть целым числом',
      'number.positive': 'ID пользователя должен быть положительным числом',
      'any.required': 'ID пользователя обязателен'
    }),
  shelter_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом',
      'any.required': 'ID приюта обязателен'
    }),
  animal_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID животного должен быть числом',
      'number.integer': 'ID животного должен быть целым числом',
      'number.positive': 'ID животного должен быть положительным числом',
      'any.required': 'ID животного обязателен'
    }),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').default('pending').optional()
    .messages({
      'any.only': 'Статус должен быть одним из: pending, approved, rejected, cancelled'
    }),
  description: Joi.string().min(10).max(5000).required()
    .messages({
      'string.empty': 'Описание обязательно для заполнения',
      'string.min': 'Описание должно содержать минимум 10 символов',
      'string.max': 'Описание не должно превышать 5000 символов',
      'any.required': 'Описание обязательно'
    })
});

// Схема для обновления заявки
export const updateApplicationSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID пользователя должен быть числом',
      'number.integer': 'ID пользователя должен быть целым числом',
      'number.positive': 'ID пользователя должен быть положительным числом'
    }),
  shelter_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом'
    }),
  animal_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID животного должен быть числом',
      'number.integer': 'ID животного должен быть целым числом',
      'number.positive': 'ID животного должен быть положительным числом'
    }),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional()
    .messages({
      'any.only': 'Статус должен быть одним из: pending, approved, rejected, cancelled'
    }),
  description: Joi.string().min(10).max(5000).optional()
    .messages({
      'string.empty': 'Описание не может быть пустым',
      'string.min': 'Описание должно содержать минимум 10 символов',
      'string.max': 'Описание не должно превышать 5000 символов'
    })
}).min(1).messages({
  'object.min': 'Должно быть указано хотя бы одно поле для обновления'
});

// Схема для валидации ID (параметр маршрута)
export const applicationIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным числом',
      'any.required': 'ID обязателен'
    })
});


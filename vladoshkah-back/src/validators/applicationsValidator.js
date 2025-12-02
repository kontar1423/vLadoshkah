import Joi from 'joi';

const statusField = Joi.string().valid('pending', 'approved', 'rejected', 'cancelled')
  .messages({
    'any.only': 'Статус должен быть одним из: pending, approved, rejected, cancelled'
  });

export const createApplicationSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID пользователя должен быть числом',
      'number.integer': 'ID пользователя должен быть целым числом',
      'number.positive': 'ID пользователя должен быть положительным числом'
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
  status: statusField.default('pending').optional(),
  description: Joi.string().min(10).max(5000).required()
    .messages({
      'string.empty': 'Описание обязательно для заполнения',
      'string.min': 'Описание должно содержать минимум 10 символов',
      'string.max': 'Описание не должно превышать 5000 символов',
      'any.required': 'Описание обязательно'
    })
});

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
  status: statusField.optional(),
  description: Joi.string().min(10).max(5000).optional()
    .messages({
      'string.empty': 'Описание не может быть пустым',
      'string.min': 'Описание должно содержать минимум 10 символов',
      'string.max': 'Описание не должно превышать 5000 символов'
    })
}).min(1).messages({
  'object.min': 'Должно быть указано хотя бы одно поле для обновления'
});

export const createGiveApplicationSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID пользователя должен быть числом',
      'number.integer': 'ID пользователя должен быть целым числом',
      'number.positive': 'ID пользователя должен быть положительным числом'
    }),
  shelter_id: Joi.number().integer().positive().allow(null).optional()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом'
    }),
  name: Joi.string().max(255).required()
    .messages({
      'string.empty': 'Имя питомца обязательно',
      'string.max': 'Имя питомца не должно превышать 255 символов'
    }),
  species: Joi.string().max(100).required()
    .messages({
      'string.empty': 'Вид питомца обязателен',
      'string.max': 'Вид питомца не должен превышать 100 символов'
    }),
  breed: Joi.string().max(100).allow(null, '').optional(),
  character: Joi.string().max(255).allow(null, '').optional(),
  gender: Joi.string().max(30).allow(null, '').optional(),
  birth_date: Joi.date().iso().allow(null).optional(),
  vaccination_status: Joi.string().max(255).allow(null, '').optional(),
  health_status: Joi.string().max(255).allow(null, '').optional(),
  special_needs: Joi.string().max(500).allow(null, '').optional(),
  history: Joi.string().max(5000).allow(null, '').optional(),
  status: statusField.default('pending').optional(),
  description: Joi.string().max(5000).allow(null, '').optional()
});

export const updateGiveApplicationSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  shelter_id: Joi.number().integer().positive().allow(null).optional(),
  name: Joi.string().max(255).allow(null, '').optional(),
  species: Joi.string().max(100).allow(null, '').optional(),
  breed: Joi.string().max(100).allow(null, '').optional(),
  character: Joi.string().max(255).allow(null, '').optional(),
  gender: Joi.string().max(30).allow(null, '').optional(),
  birth_date: Joi.date().iso().allow(null).optional(),
  vaccination_status: Joi.string().max(255).allow(null, '').optional(),
  health_status: Joi.string().max(255).allow(null, '').optional(),
  special_needs: Joi.string().max(500).allow(null, '').optional(),
  history: Joi.string().max(5000).allow(null, '').optional(),
  status: statusField.optional(),
  description: Joi.string().max(5000).allow(null, '').optional()
}).min(1).messages({
  'object.min': 'Должно быть указано хотя бы одно поле для обновления'
});

export const applicationIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным числом',
      'any.required': 'ID обязателен'
    })
});

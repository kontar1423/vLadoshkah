import Joi from 'joi';

// Схема для создания приюта
export const createShelterSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.empty': 'Название приюта обязательно для заполнения',
      'string.min': 'Название должно содержать минимум 2 символа',
      'string.max': 'Название не должно превышать 255 символов',
      'any.required': 'Название приюта обязательно'
    }),
  address: Joi.string().max(500).optional().allow(null, '')
    .messages({
      'string.max': 'Адрес не должен превышать 500 символов'
    }),
  phone: Joi.string().max(50).optional().allow(null, '')
    .messages({
      'string.max': 'Телефон не должен превышать 50 символов'
    }),
  email: Joi.string().email().max(255).optional().allow(null, '')
    .messages({
      'string.email': 'Email должен быть в правильном формате',
      'string.max': 'Email не должен превышать 255 символов'
    }),
  website: Joi.string().uri().max(255).optional().allow(null, '')
    .messages({
      'string.uri': 'Веб-сайт должен быть валидным URL',
      'string.max': 'Веб-сайт не должен превышать 255 символов'
    }),
  description: Joi.string().optional().allow(null, '')
    .messages({
      'string.base': 'Описание должно быть строкой'
    }),
  capacity: Joi.number().integer().min(0).optional().allow(null)
    .messages({
      'number.base': 'Вместимость должна быть числом',
      'number.integer': 'Вместимость должна быть целым числом',
      'number.min': 'Вместимость не может быть отрицательной'
    }),
  working_hours: Joi.string().max(200).optional().allow(null, '')
    .messages({
      'string.max': 'Рабочие часы не должны превышать 200 символов'
    }),
  can_adopt: Joi.boolean().optional().allow(null)
    .messages({
      'boolean.base': 'Поле can_adopt должно быть булевым значением'
    }),
  admin_id: Joi.number().integer().positive().optional().allow(null)
    .messages({
      'number.base': 'ID администратора должен быть числом',
      'number.integer': 'ID администратора должен быть целым числом',
      'number.positive': 'ID администратора должен быть положительным числом'
    }),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active').optional()
    .messages({
      'any.only': 'Статус должен быть одним из: active, inactive, suspended'
    }),
    region: Joi.string().valid('cao', 'sao', 'svao', 'vao', 'yuvao', 'yao', 'yuzao', 'zao', 'szao', 'zelao', 'tinao', 'nao').optional().allow(null, '')
    .messages({
      'any.only': 'Регион должен быть одним из: cao, sao, svao, vao, yuvao, yao, yuzao, zao, szao, zelao, tinao, nao'
    }),
});

// Схема для обновления приюта (все поля опциональны)
export const updateShelterSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional()
    .messages({
      'string.empty': 'Название не может быть пустым',
      'string.min': 'Название должно содержать минимум 2 символа',
      'string.max': 'Название не должно превышать 255 символов'
    }),
  address: Joi.string().max(500).optional().allow(null, '')
    .messages({
      'string.max': 'Адрес не должен превышать 500 символов'
    }),
  phone: Joi.string().max(50).optional().allow(null, '')
    .messages({
      'string.max': 'Телефон не должен превышать 50 символов'
    }),
  email: Joi.string().email().max(255).optional().allow(null, '')
    .messages({
      'string.email': 'Email должен быть в правильном формате',
      'string.max': 'Email не должен превышать 255 символов'
    }),
  website: Joi.string().uri().max(255).optional().allow(null, '')
    .messages({
      'string.uri': 'Веб-сайт должен быть валидным URL',
      'string.max': 'Веб-сайт не должен превышать 255 символов'
    }),
  description: Joi.string().optional().allow(null, '')
    .messages({
      'string.base': 'Описание должно быть строкой'
    }),
  capacity: Joi.number().integer().min(0).optional().allow(null)
    .messages({
      'number.base': 'Вместимость должна быть числом',
      'number.integer': 'Вместимость должна быть целым числом',
      'number.min': 'Вместимость не может быть отрицательной'
    }),
  working_hours: Joi.string().max(200).optional().allow(null, '')
    .messages({
      'string.max': 'Рабочие часы не должны превышать 200 символов'
    }),
  can_adopt: Joi.boolean().optional().allow(null)
    .messages({
      'boolean.base': 'Поле can_adopt должно быть булевым значением'
    }),
  admin_id: Joi.number().integer().positive().optional().allow(null)
    .messages({
      'number.base': 'ID администратора должен быть числом',
      'number.integer': 'ID администратора должен быть целым числом',
      'number.positive': 'ID администратора должен быть положительным числом'
    }),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
    .messages({
      'any.only': 'Статус должен быть одним из: active, inactive, suspended'
    }),
  region: Joi.string().valid('cao', 'sao', 'svao', 'vao', 'yuvao', 'yao', 'yuzao', 'zao', 'szao', 'zelao', 'tinao', 'nao').optional().allow(null, '')
    .messages({
      'any.only': 'Регион должен быть одним из: cao, sao, svao, vao, yuvao, yao, yuzao, zao, szao, zelao, tinao, nao'
    }),
}).min(1).messages({
  'object.min': 'Должно быть указано хотя бы одно поле для обновления'
});

// Схема для валидации ID (параметр маршрута)
export const shelterIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным числом',
      'any.required': 'ID обязателен'
    })
});

export const shelterVoteSchema = Joi.object({
  shelter_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом',
      'any.required': 'ID приюта обязателен'
    }),
  vote: Joi.number().integer().min(1).max(5).required()
    .messages({
      'number.base': 'Голос должен быть числом',
      'number.integer': 'Голос должен быть целым числом',
      'number.min': 'Минимальное значение голоса 1',
      'number.max': 'Максимальное значение голоса 5',
      'any.required': 'Необходимо указать значение голоса'
    })
});

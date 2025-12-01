import Joi from 'joi';

// Схема для создания животного
export const createAnimalSchema = Joi.object({
  name: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': 'Имя животного обязательно для заполнения',
      'string.min': 'Имя должно содержать хотя бы 1 символ',
      'string.max': 'Имя не должно превышать 100 символов',
      'any.required': 'Имя животного обязательно'
    }),
  age: Joi.number().integer().min(0).max(30).required()
    .messages({
      'number.base': 'Возраст должен быть числом',
      'number.integer': 'Возраст должен быть целым числом',
      'number.min': 'Возраст не может быть отрицательным',
      'number.max': 'Возраст не может превышать 30 лет',
      'any.required': 'Возраст обязателен'
    }),
  type: Joi.string().min(1).max(50).required()
    .messages({
      'string.empty': 'Тип животного обязателен для заполнения',
      'string.min': 'Тип должен содержать хотя бы 1 символ',
      'string.max': 'Тип не должен превышать 50 символов',
      'any.required': 'Тип животного обязателен'
    }),
  shelter_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом',
      'any.required': 'ID приюта обязателен'
    }),
  health: Joi.string().max(30).optional().allow(null, '')
    .messages({
      'string.max': 'Здоровье не должно превышать 30 символов'
    }),
  gender: Joi.string().valid('male', 'female', 'unknown').optional().allow(null, '')
    .messages({
      'any.only': 'Пол должен быть одним из: male, female, unknown'
    }),
  color: Joi.string().max(50).optional().allow(null, '')
    .messages({
      'string.max': 'Цвет не должен превышать 50 символов'
    }),
  weight: Joi.number().positive().optional().allow(null)
    .messages({
      'number.base': 'Вес должен быть числом',
      'number.positive': 'Вес должен быть положительным числом'
    }),
  personality: Joi.string().max(100).optional().allow(null, '')
    .messages({
      'string.max': 'Характер не должен превышать 100 символов'
    }),
  animal_size: Joi.string().valid('small', 'medium', 'large').optional().allow(null, '')
    .messages({
      'any.only': 'Размер должен быть одним из: small, medium, large'
    }),
  history: Joi.string().max(1000).optional().allow(null, '')
    .messages({
      'string.max': 'История не должна превышать 1000 символов'
    })
});

// Схема для обновления животного (все поля опциональны)
export const updateAnimalSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional()
    .messages({
      'string.empty': 'Имя не может быть пустым',
      'string.min': 'Имя должно содержать хотя бы 1 символ',
      'string.max': 'Имя не должно превышать 100 символов'
    }),
  age: Joi.number().integer().min(0).max(30).optional()
    .messages({
      'number.base': 'Возраст должен быть числом',
      'number.integer': 'Возраст должен быть целым числом',
      'number.min': 'Возраст не может быть отрицательным',
      'number.max': 'Возраст не может превышать 30 лет'
    }),
  type: Joi.string().min(1).max(50).optional()
    .messages({
      'string.empty': 'Тип не может быть пустым',
      'string.min': 'Тип должен содержать хотя бы 1 символ',
      'string.max': 'Тип не должен превышать 50 символов'
    }),
  shelter_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом'
    }),
  health: Joi.string().max(30).optional().allow(null, '')
    .messages({
      'string.max': 'Здоровье не должно превышать 30 символов'
    }),
  gender: Joi.string().valid('male', 'female', 'unknown').optional().allow(null, '')
    .messages({
      'any.only': 'Пол должен быть одним из: male, female, unknown'
    }),
  color: Joi.string().max(50).optional().allow(null, '')
    .messages({
      'string.max': 'Цвет не должен превышать 50 символов'
    }),
  weight: Joi.number().positive().optional().allow(null)
    .messages({
      'number.base': 'Вес должен быть числом',
      'number.positive': 'Вес должен быть положительным числом'
    }),
  personality: Joi.string().max(100).optional().allow(null, '')
    .messages({
      'string.max': 'Характер не должен превышать 100 символов'
    }),
  animal_size: Joi.string().valid('small', 'medium', 'large').optional().allow(null, '')
    .messages({
      'any.only': 'Размер должен быть одним из: small, medium, large'
    }),
  history: Joi.string().max(1000).optional().allow(null, '')
    .messages({
      'string.max': 'История не должна превышать 1000 символов'
    })
}).min(1).messages({
  'object.min': 'Должно быть указано хотя бы одно поле для обновления'
});

// Схема для фильтров поиска животных
export const animalFiltersSchema = Joi.object({
  type: Joi.string().max(50).optional()
    .messages({
      'string.max': 'Тип не должен превышать 50 символов'
    }),
  gender: Joi.string().valid('male', 'female', 'unknown').optional()
    .messages({
      'any.only': 'Пол должен быть одним из: male, female, unknown'
    }),
  age_min: Joi.number().integer().min(0).max(30).optional()
    .messages({
      'number.base': 'Минимальный возраст должен быть числом',
      'number.integer': 'Минимальный возраст должен быть целым числом',
      'number.min': 'Минимальный возраст не может быть отрицательным',
      'number.max': 'Минимальный возраст не может превышать 30 лет'
    }),
  age_max: Joi.number().integer().min(0).max(30).optional()
    .messages({
      'number.base': 'Максимальный возраст должен быть числом',
      'number.integer': 'Максимальный возраст должен быть целым числом',
      'number.min': 'Максимальный возраст не может быть отрицательным',
      'number.max': 'Максимальный возраст не может превышать 30 лет'
    }),
  size: Joi.string().valid('small', 'medium', 'large').optional()
    .messages({
      'any.only': 'Размер должен быть одним из: small, medium, large'
    }),
  animal_size: Joi.string().valid('small', 'medium', 'large').optional()
    .messages({
      'any.only': 'Размер должен быть одним из: small, medium, large'
    }),
  health: Joi.string().max(30).optional()
    .messages({
      'string.max': 'Здоровье не должно превышать 30 символов'
    }),
  shelter_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID приюта должен быть числом',
      'number.integer': 'ID приюта должен быть целым числом',
      'number.positive': 'ID приюта должен быть положительным числом'
    }),
  search: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Поисковый запрос не должен превышать 500 символов'
    })
});

// Схема для валидации ID (параметр маршрута)
export const animalIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным числом',
      'any.required': 'ID обязателен'
    })
});


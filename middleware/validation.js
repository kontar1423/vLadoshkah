/**
 * Middleware для валидации запросов с помощью Joi
 * @param {Joi.Schema} schema - Схема валидации Joi
 * @param {string} source - Источник данных: 'body', 'query', 'params' (по умолчанию 'body')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query : 
                          source === 'params' ? req.params : 
                          req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Возвращать все ошибки, а не только первую
      stripUnknown: true, // Удалять неизвестные поля
      convert: true // Конвертировать типы, где возможно
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }

    // Заменяем оригинальные данные валидированными (с конвертацией типов)
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};


/**
 * Middleware для валидации запросов с помощью Joi
 * @param {Joi.Schema} schema - Схема валидации Joi
 * @param {string} source - Источник данных: 'body', 'query', 'params' (по умолчанию 'body')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    let dataToValidate = source === 'query' ? req.query : 
                          source === 'params' ? req.params : 
                          req.body;

    // Если body пустой или undefined, создаем пустой объект
    if (!dataToValidate || (source === 'body' && Object.keys(dataToValidate || {}).length === 0 && !req.file)) {
      dataToValidate = {};
    }

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
    // Не перезаписываем объекты напрямую, а обновляем свойства
    if (source === 'query') {
      if (req.query) {
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, value);
      }
    } else if (source === 'params') {
      if (req.params) {
        Object.keys(req.params).forEach(key => delete req.params[key]);
        Object.assign(req.params, value);
      }
    } else {
      if (!req.body) {
        req.body = {};
      }
      Object.keys(req.body).forEach(key => delete req.body[key]);
      Object.assign(req.body, value);
    }

    next();
  };
};


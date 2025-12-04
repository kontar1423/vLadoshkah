export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    let dataToValidate = source === 'query' ? req.query : 
                          source === 'params' ? req.params : 
                          req.body;

    if (!dataToValidate) {
      dataToValidate = {};
    }

    // Проверяем наличие файлов - если есть файлы и body пустой, пропускаем валидацию
    if (source === 'body') {
      // Более надежная проверка файлов
      let hasFiles = false;
      if (req.files) {
        if (req.files.photo) {
          hasFiles = Array.isArray(req.files.photo) ? req.files.photo.length > 0 : !!req.files.photo;
        }
        if (!hasFiles && req.files.photos) {
          hasFiles = Array.isArray(req.files.photos) ? req.files.photos.length > 0 : !!req.files.photos;
        }
        if (!hasFiles && Array.isArray(req.files) && req.files.length > 0) {
          hasFiles = true;
        }
      }
      if (!hasFiles && req.file) {
        hasFiles = Array.isArray(req.file) ? req.file.length > 0 : !!req.file;
      }
      
      const bodyKeys = Object.keys(dataToValidate || {});
      
      // Если есть файлы и нет полей в body, пропускаем валидацию
      if (hasFiles && bodyKeys.length === 0) {
        if (!req.body) {
          req.body = {};
        }
        // Временное логирование для отладки (можно убрать после исправления)
        console.log('[Validation] Skipping validation: hasFiles=true, bodyKeys=0', {
          hasFiles,
          filesKeys: req.files ? Object.keys(req.files) : null,
          bodyKeys
        });
        return next();
      }
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      // Проверяем, есть ли файлы, и если ошибка связана с .min(1), пропускаем её
      if (source === 'body') {
        let hasFiles = false;
        if (req.files) {
          if (req.files.photo) {
            hasFiles = Array.isArray(req.files.photo) ? req.files.photo.length > 0 : !!req.files.photo;
          }
          if (!hasFiles && req.files.photos) {
            hasFiles = Array.isArray(req.files.photos) ? req.files.photos.length > 0 : !!req.files.photos;
          }
        }
        if (!hasFiles && req.file) {
          hasFiles = Array.isArray(req.file) ? req.file.length > 0 : !!req.file;
        }
        
        const isMinError = error.details.some(detail => detail.type === 'object.min');
        
        // Если есть файлы и ошибка .min(1), пропускаем валидацию
        if (hasFiles && isMinError) {
          if (!req.body) {
            req.body = {};
          }
          // Временное логирование для отладки (можно убрать после исправления)
          console.log('[Validation] Skipping .min(1) error: hasFiles=true', {
            hasFiles,
            filesKeys: req.files ? Object.keys(req.files) : null,
            errorType: 'object.min'
          });
          return next();
        }
      }

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
      Object.assign(req.body, value || {});
    }

    next();
  };
};


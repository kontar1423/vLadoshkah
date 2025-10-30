// Jest setup файл для мокирования зависимостей перед запуском тестов
import { jest } from '@jest/globals';

// Мокаем pino чтобы не было логов в тестах
jest.mock('pino', () => {
  const noop = () => {};
  const mockLogger = {
    debug: noop,
    error: noop,
    info: noop,
    warn: noop,
    fatal: noop,
    trace: noop,
    child: () => mockLogger,
    level: 'silent'
  };
  
  const mockPino = () => mockLogger;
  mockPino.stdTimeFunctions = { isoTime: noop };
  mockPino.multistream = () => mockLogger;
  
  return mockPino;
});

// Мокаем pino-http чтобы не было логов в тестах
jest.mock('pino-http', () => {
  return () => (req, res, next) => {
    req.log = {
      debug: () => {},
      error: () => {},
      info: () => {},
      warn: () => {},
      fatal: () => {},
      trace: () => {},
      child: () => req.log
    };
    next();
  };
});

// Устанавливаем переменные окружения для MinIO
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY = 'test';
process.env.MINIO_SECRET_KEY = 'test';
process.env.MINIO_BUCKET = 'test-bucket';

// Устанавливаем переменные для других зависимостей
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Подавляем логи Pino в тестах
process.env.LOG_LEVEL = 'silent';

// Устанавливаем переменные для БД (чтобы не пытаться подключаться)
process.env.PGUSER = 'test';
process.env.PGHOST = 'localhost';
process.env.PGDATABASE = 'test_db';
process.env.PGPASSWORD = 'test';
process.env.PGPORT = '5432';

// Мокаем minioClient глобально
jest.mock('../minioClient.js', () => ({
  default: {
    putObject: jest.fn().mockResolvedValue({ etag: 'mock-etag' }),
    getObject: jest.fn(),
    removeObject: jest.fn().mockResolvedValue(undefined),
    bucketExists: jest.fn().mockResolvedValue(true)
  }
}));

// Мокаем Redis клиент глобально
jest.mock('../cache/redis-client.js', () => ({
  default: {
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    deleteByPattern: jest.fn().mockResolvedValue(0),
    isConnected: jest.fn().mockReturnValue(true),
    client: {
      isOpen: true,
      on: jest.fn()
    }
  }
}));

// Мокаем DB пул глобально (с правильными экспортами)
// ВАЖНО: query должен быть замокан с правильными значениями для всех тестов
const mockQueryFn = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });

jest.mock('../db.js', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const mockPool = {
    query: mockQuery,
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  };
  return {
    default: mockPool,
    query: mockQuery  // named export для dao - возвращает тот же mockQuery
  };
});

// Мокаем logger чтобы не создавать файлы логов и не выводить в консоль в тестах
jest.mock('../logger.js', () => {
  // Создаем пустую функцию, которая ничего не делает
  const noop = () => {};
  
  // Создаем мок-объект логгера со всеми методами
  const mockLogger = {
    debug: noop,
    error: noop,
    info: noop,
    warn: noop,
    fatal: noop,
    trace: noop,
    child: () => mockLogger,
    level: 'silent',
    // Методы bind для совместимости с оригинальным логгером
    bind: () => mockLogger
  };
  
  return {
    __esModule: true,
    default: mockLogger,
    debug: noop,
    error: noop,
    info: noop,
    warn: noop,
    fatal: noop,
    trace: noop
  };
});

// Глобальные моки для DAO используются только для тестов DAO
// Тесты сервисов используют jest.spyOn

// Мокаем usersDao для использования в authService тестах
jest.mock('../dao/usersDao.js', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
    getByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue({ id: 1 })
  }
}));

jest.mock('../services/photosService.js', () => ({
  default: {
    uploadPhoto: jest.fn().mockResolvedValue(undefined),
    deletePhotosOfEntity: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../dao/applicationsDao.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    getById: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue({ id: 1 }),
    countByStatus: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('../dao/photosDao.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    getById: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
    getByObjectName: jest.fn().mockResolvedValue(null),
    getByEntity: jest.fn().mockResolvedValue([]),
    getByEntityType: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue({ id: 1 })
  }
}));


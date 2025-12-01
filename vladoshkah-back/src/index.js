import 'dotenv/config';
import express, { json } from 'express';
import animalsRouter from './routes/animals.js';
import sheltersRouter from './routes/shelters.js';
import usersRouter from './routes/users.js';
import photosRouter from './routes/photos.js';
import applicationsRouter from './routes/applications.js';
import authRouter from './routes/auth.js';
import logger, { error as _error, info, warn, debug } from './logger.js';
import pinoHttp from 'pino-http';
import initMinio from './initMinio.js';
import cors from 'cors';
import redisClient from './cache/redis-client.js';
import pool from './db.js'; // импортируем пул подключений
import kafkaProducer from './messaging/kafka-producer.js';
import kafkaConsumer from './messaging/kafka-consumer.js';
import notificationService from './services/notificationService.js';
import createRateLimiter from './middleware/rateLimit.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const parseBool = (value, defaultValue = true) => {
  if (value === undefined) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(normalized);
};

const isGlobalRateLimitEnabled = parseBool(process.env.RATE_LIMIT_ENABLED, true);
const isAuthRateLimitEnabled = parseBool(
  process.env.RATE_LIMIT_AUTH_ENABLED,
  isGlobalRateLimitEnabled
);

const globalWindowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60;
const globalMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const authWindowSeconds = Number(process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS) || 300;
const authMaxRequests = Number(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 10;

info({
  rateLimit: {
    global: {
      enabled: isGlobalRateLimitEnabled,
      windowSeconds: globalWindowSeconds,
      maxRequests: globalMaxRequests
    },
    auth: {
      enabled: isAuthRateLimitEnabled,
      windowSeconds: authWindowSeconds,
      maxRequests: authMaxRequests
    }
  }
}, 'Rate limit configuration');

const globalRateLimiter = createRateLimiter({
  windowSeconds: globalWindowSeconds,
  maxRequests: globalMaxRequests,
  keyPrefix: 'rl:global'
});

const authRateLimiter = createRateLimiter({
  windowSeconds: authWindowSeconds,
  maxRequests: authMaxRequests,
  keyPrefix: 'rl:auth'
});

async function initializeRedis() {
  try {
    await redisClient.connect();
    info('Redis connected successfully');
  } catch (error) {
    _error(error, 'Redis connection failed');
    // Приложение может работать без Redis, но с предупреждением
    warn('Application running without Redis cache');
  }
}

async function initializeKafka() {
  try {
    // Подключаем producer
    await kafkaProducer.connect();
    
    // Регистрируем обработчики событий
    kafkaConsumer.registerHandler('user.registered', async (userData) => {
      try {
        await notificationService.sendWelcomeEmail(userData);
      } catch (error) {
        _error(error, 'Error processing user.registered event');
        // Здесь можно добавить retry логику или отправку в DLQ
      }
    });
    
    // Запускаем consumer для топика user-notifications
    await kafkaConsumer.start('user-notifications');
    info('Kafka initialized successfully');
  } catch (error) {
    _error(error, 'Kafka initialization failed');
    // Приложение может работать без Kafka, но с предупреждением
    warn('Application running without Kafka messaging');
  }
}

// Инициализируем Redis и Kafka при старте приложения (только если не в тестовом режиме)
if (process.env.NODE_ENV !== 'test') {
  initializeRedis();
  initializeKafka();
}

app.use(json());
app.use(express.urlencoded({ extended: true })); // для FormData
// Structured HTTP logging with request id
app.use(cors());
app.use(pinoHttp({
  genReqId: (req, res) => {
    const existing = req.id || req.headers['x-request-id'];
    if (existing) return existing;
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode })
  }
}));

// Global rate limit (fallback в память, если Redis недоступен)
if (isGlobalRateLimitEnabled) {
  app.use('/api', globalRateLimiter);
}

// Routes
if (isAuthRateLimitEnabled) {
  app.use('/api/auth', authRateLimiter, authRouter);
} else {
  app.use('/api/auth', authRouter);
}
app.use('/api/animals', animalsRouter);
app.use('/api/shelters', sheltersRouter);
app.use('/api/users', usersRouter);
app.use('/api/photos', photosRouter);
app.use('/api/applications', applicationsRouter);

// Liveness/Readiness probe
app.get('/healthz', async (req, res) => {
  try {
    // Проверяем подключение к БД
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const requestId = req.id || (req.log && req.log.bindings && req.log.bindings().req && req.log.bindings().req.id);
  _error({ err, requestId }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message, requestId });
});


// Функция для проверки подключения к БД с повторными попытками
async function waitForDatabase() {
  const maxRetries = 10;
  const retryInterval = 3000; // 3 секунды
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debug({ attempt, maxRetries }, 'Checking database connection');
      await pool.query('SELECT 1');
      info('Database connection established');
      return true;
    } catch (error) {
      warn({ attempt, maxRetries, error: error.message }, 'Database connection failed');
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      
      debug({ retryInterval: retryInterval / 1000 }, 'Retrying database connection');
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

// Start server
async function startServer() {
  try {
    info('Starting server initialization...');
    
    // 1. Ждем подключения к БД
    await waitForDatabase();
    
    // 2. Инициализируем MinIO
    await initMinio();
    info('MinIO initialization completed');
    
    // 3. Запускаем сервер
    app.listen(PORT, '0.0.0.0', () => {
      info({ port: PORT }, 'Server successfully running');
    });
    
  } catch (error) {
    _error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  info('Shutting down gracefully...');
  
  try {
    await kafkaProducer.disconnect();
    await kafkaConsumer.stop();
    info('Kafka connections closed');
  } catch (error) {
    _error(error, 'Error during Kafka shutdown');
  }
  
  try {
    if (redisClient.isConnected()) {
      await redisClient.client?.disconnect();
      info('Redis connection closed');
    }
  } catch (error) {
    _error(error, 'Error during Redis shutdown');
  }
  
  process.exit(0);
}

// Глобальные обработчики ошибок
process.on('unhandledRejection', (reason, promise) => {
  _error({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  _error(error, 'Uncaught Exception');
  process.exit(1);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Запускаем сервер только если не в test режиме
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;

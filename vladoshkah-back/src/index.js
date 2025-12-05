import 'dotenv/config';
import express, { json } from 'express';
import animalsRouter from './routes/animals.js';
import sheltersRouter from './routes/shelters.js';
import usersRouter from './routes/users.js';
import photosRouter from './routes/photos.js';
import applicationsRouter from './routes/applications.js';
import authRouter from './routes/auth.js';
import geocodingRouter from './routes/geocoding.js';
import logger, { error as _error, info, warn, debug } from './logger.js';
import pinoHttp from 'pino-http';
import initMinio from './initMinio.js';
import cors from 'cors';
import redisClient from './cache/redis-client.js';
import pool from './db.js';
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
    warn('Application running without Redis cache');
  }
}

async function initializeKafka() {
  try {
    await kafkaProducer.connect();
    
    kafkaConsumer.registerHandler('user.registered', async (userData) => {
      try {
        await notificationService.sendWelcomeEmail(userData);
      } catch (error) {
        _error(error, 'Error processing user.registered event');
      }
    });
    
    await kafkaConsumer.start('user-notifications');
    info('Kafka initialized successfully');
  } catch (error) {
    _error(error, 'Kafka initialization failed');
    warn('Application running without Kafka messaging');
  }
}

if (process.env.NODE_ENV !== 'test') {
  initializeRedis();
  initializeKafka();
}

app.use(json());
app.use(express.urlencoded({ extended: true }));
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

if (isGlobalRateLimitEnabled) {
  app.use('/api', globalRateLimiter);
}

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
app.use('/api/geocoding', geocodingRouter);

app.get('/healthz', async (req, res) => {
  try {
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

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  const requestId = req.id || (req.log && req.log.bindings && req.log.bindings().req && req.log.bindings().req.id);
  _error({ err, requestId }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message, requestId });
});


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

async function startServer() {
  try {
    info('Starting server initialization...');
    
    await waitForDatabase();
    
    await initMinio();
    info('MinIO initialization completed');
    
    app.listen(PORT, '0.0.0.0', () => {
      info({ port: PORT }, 'Server successfully running');
    });
    
  } catch (error) {
    _error(error, 'Failed to start server');
    process.exit(1);
  }
}

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

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;

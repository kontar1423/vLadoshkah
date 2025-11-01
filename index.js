import 'dotenv/config';
import express, { json } from 'express';
import animalsRouter from './routes/animals.js';
import sheltersRouter from './routes/shelters.js';
import usersRouter from './routes/users.js';
import photosRouter from './routes/photos.js';
import applicationsRouter from './routes/applications.js';
import authRouter from './routes/auth.js';
import { error as _error, info } from './logger.js';
import pinoHttp from 'pino-http';
import initMinio from './initMinio.js';
import cors from 'cors';
import redisClient from './cache/redis-client.js';
import pool from './db.js'; // импортируем пул подключений
import kafkaProducer from './messaging/kafka-producer.js';
import kafkaConsumer from './messaging/kafka-consumer.js';
import notificationService from './services/notificationService.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

async function initializeRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // Приложение может работать без Redis, но с предупреждением
    console.log('⚠️  Application running without Redis cache');
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
        console.error('Error processing user.registered event:', error);
        // Здесь можно добавить retry логику или отправку в DLQ
      }
    });
    
    // Запускаем consumer для топика user-notifications
    await kafkaConsumer.start('user-notifications');
    console.log('✅ Kafka initialized successfully');
  } catch (error) {
    console.error('❌ Kafka initialization failed:', error);
    // Приложение может работать без Kafka, но с предупреждением
    console.log('⚠️  Application running without Kafka messaging');
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

// Routes
app.use('/api/auth', authRouter);
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
      console.log(`⏳ Checking database connection (attempt ${attempt}/${maxRetries})...`);
      await pool.query('SELECT 1');
      console.log('✅ Database connection established');
      return true;
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      
      console.log(`🔄 Retrying in ${retryInterval/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting server initialization...');
    
    // 1. Ждем подключения к БД
    await waitForDatabase();
    
    // 2. Инициализируем MinIO
    await initMinio();
    console.log('✅ MinIO initialization completed');
    
    // 3. Запускаем сервер
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎉 Server successfully running on port ${PORT}`);
      info({ port: PORT }, 'Server running');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  
  try {
    await kafkaProducer.disconnect();
    await kafkaConsumer.stop();
    console.log('Kafka connections closed');
  } catch (error) {
    console.error('Error during Kafka shutdown:', error);
  }
  
  try {
    if (redisClient.isConnected()) {
      await redisClient.client?.disconnect();
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error('Error during Redis shutdown:', error);
  }
  
  process.exit(0);
}

// Глобальные обработчики ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Запускаем сервер только если не в test режиме
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
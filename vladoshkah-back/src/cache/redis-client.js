// cache/redis-client.js
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    
    // В тестовом режиме не создаем реальный клиент
    if (process.env.NODE_ENV === 'test') {
      this.client = null;
      this.isOpen = false;
      return;
    }
    
    console.log('Connecting to Redis:', redisUrl.replace(/:[^:]*@/, ':****@')); // Скрываем пароль в логах
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        timeout: 5000,
        reconnectStrategy: (retries) => {
          console.log(`Redis reconnecting, attempt ${retries}`);
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
    });
    
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });
    
    this.client.on('ready', () => {
      console.log('Redis client ready');
    });
  }

  async connect() {
    if (process.env.NODE_ENV === 'test' || !this.client) {
      return; // В тестовом режиме не подключаемся
    }
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    if (process.env.NODE_ENV === 'test' || !this.client) {
      return null; // В тестовом режиме просто возвращаем null
    }
    try {
      await this.connect();
      if (ttl) {
        return await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        return await this.client.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis set error:', error.message);
      return null;
    }
  }

  async get(key) {
    if (process.env.NODE_ENV === 'test' || !this.client) {
      return null; // В тестовом режиме просто возвращаем null
    }
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  async delete(key) {
    if (process.env.NODE_ENV === 'test' || !this.client) {
      return 0; // В тестовом режиме просто возвращаем 0
    }
    try {
      await this.connect();
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error.message);
      return 0;
    }
  }

  async deleteByPattern(pattern) {
    if (process.env.NODE_ENV === 'test' || !this.client) {
      return 0; // В тестовом режиме просто возвращаем 0
    }
    try {
      await this.connect();
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      return 0;
    } catch (error) {
      console.error('Redis deleteByPattern error:', error.message);
      return 0;
    }
  }

  isConnected() {
    if (process.env.NODE_ENV === 'test' || !this.client) {
      return false; // В тестовом режиме всегда false
    }
    return this.client?.isOpen || false;
  }
}

export default new RedisClient();
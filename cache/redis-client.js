// cache/redis-client.js
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    
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
      console.log('✅ Redis Client Connected');
    });
    
    this.client.on('ready', () => {
      console.log('✅ Redis Client Ready');
    });
  }

  async connect() {
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
    try {
      await this.connect();
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error.message);
      return 0;
    }
  }

  async deleteByPattern(pattern) {
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
    return this.client?.isOpen || false;
  }
}

export default new RedisClient();
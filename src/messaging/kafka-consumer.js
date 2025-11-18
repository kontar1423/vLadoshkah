// messaging/kafka-consumer.js
import { Kafka } from 'kafkajs';
import logger from '../logger.js';

class KafkaConsumer {
  constructor() {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
    
    // В тестовом режиме не создаем реальный consumer
    if (process.env.NODE_ENV === 'test') {
      this.consumer = null;
      this.isRunning = false;
      return;
    }
    
    const kafka = new Kafka({
      clientId: 'vladoshkah-api-consumer',
      brokers: brokers,
      retry: {
        retries: 5,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000
      }
    });
    
    this.consumer = kafka.consumer({ 
      groupId: 'vladoshkah-notification-consumer-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
    
    this.isRunning = false;
    this.messageHandlers = new Map();
    
    this.consumer.on('consumer.connect', () => {
      logger.info('Kafka Consumer connected');
    });
    
    this.consumer.on('consumer.disconnect', () => {
      logger.warn('Kafka Consumer disconnected');
      this.isRunning = false;
    });
    
    this.consumer.on('consumer.crash', (event) => {
      logger.error({ event }, 'Kafka Consumer crashed');
      this.isRunning = false;
    });
  }

  /**
   * Регистрирует обработчик для определенного типа события
   * @param {string} eventType - Тип события (например, 'user.registered')
   * @param {Function} handler - Функция-обработчик события
   */
  registerHandler(eventType, handler) {
    this.messageHandlers.set(eventType, handler);
    logger.info({ eventType }, 'Kafka event handler registered');
  }

  /**
   * Запускает consumer для указанного топика
   * @param {string} topic - Название топика
   */
  async start(topic) {
    if (process.env.NODE_ENV === 'test' || !this.consumer || this.isRunning) {
      return;
    }
    
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      this.isRunning = true;
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = JSON.parse(message.value.toString());
            const eventType = value.eventType;
            
            logger.debug({ topic, partition, eventType }, 'Received Kafka message');
            
            const handler = this.messageHandlers.get(eventType);
            if (handler) {
              await handler(value.data, value);
            } else {
              logger.warn({ eventType }, 'No handler registered for event type');
            }
          } catch (error) {
            logger.error({ err: error, topic, partition }, 'Error processing Kafka message');
            // В production можно добавить отправку в dead letter queue
          }
        }
      });
      
      logger.info({ topic }, 'Kafka Consumer started successfully');
    } catch (error) {
      logger.error({ err: error, topic }, 'Error starting Kafka Consumer');
      this.isRunning = false;
    }
  }

  async stop() {
    if (process.env.NODE_ENV === 'test' || !this.consumer || !this.isRunning) {
      return;
    }
    
    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      logger.info('Kafka Consumer stopped');
    } catch (error) {
      logger.error({ err: error }, 'Error stopping Kafka Consumer');
    }
  }
}

const kafkaConsumer = new KafkaConsumer();

export default kafkaConsumer;

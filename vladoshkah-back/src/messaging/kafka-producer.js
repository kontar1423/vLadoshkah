
import { Kafka } from 'kafkajs';
import logger from '../logger.js';

class KafkaProducer {
  constructor() {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];

    if (process.env.NODE_ENV === 'test') {
      this.producer = null;
      this.isConnected = false;
      return;
    }
    
    const kafka = new Kafka({
      clientId: 'vladoshkah-api-producer',
      brokers: brokers,
      retry: {
        retries: 5,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000
      }
    });
    
    this.producer = kafka.producer();
    this.isConnected = false;
    
    this.producer.on('producer.connect', () => {
      logger.info('Kafka Producer connected');
    });
    
    this.producer.on('producer.disconnect', () => {
      logger.warn('Kafka Producer disconnected');
      this.isConnected = false;
    });
    
    this.producer.on('producer.network.request_timeout', (payload) => {
      logger.error({ payload }, 'Kafka Producer network request timeout');
    });
  }

  async connect() {
    if (process.env.NODE_ENV === 'test' || !this.producer) {
      return;
    }
    
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka Producer connected successfully');
    } catch (error) {
      logger.error({ err: error }, 'Kafka Producer connection failed');

      logger.warn('Application running without Kafka messaging');
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (process.env.NODE_ENV === 'test' || !this.producer || !this.isConnected) {
      return;
    }
    
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka Producer disconnected');
    } catch (error) {
      logger.error({ err: error }, 'Error disconnecting Kafka Producer');
    }
  }

  
  async sendEvent(topic, message, key = null) {
    if (process.env.NODE_ENV === 'test' || !this.producer || !this.isConnected) {

      logger.debug({ topic, message, key }, 'Kafka event (not sent in test mode or not connected)');
      return;
    }
    
    try {
      const messages = [{
        key: key || null,
        value: JSON.stringify(message),
        timestamp: Date.now().toString()
      }];
      
      await this.producer.send({
        topic,
        messages
      });
      
      logger.debug({ topic, messageKey: key }, 'Kafka event sent successfully');
    } catch (error) {
      logger.error({ err: error, topic, message }, 'Error sending Kafka event');

    }
  }
}

const kafkaProducer = new KafkaProducer();

export default kafkaProducer;

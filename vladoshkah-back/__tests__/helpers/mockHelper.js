import { jest } from '@jest/globals';

/**
 * Хелперы для моков
 */

/**
 * Создает мок для Redis клиента
 */
export function mockRedisClient() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  };
}

/**
 * Создает мок для фото сервиса
 */
export function mockPhotosService() {
  return {
    uploadPhoto: jest.fn().mockResolvedValue({ id: 1, url: 'http://example.com/photo.jpg' }),
    deletePhotosOfEntity: jest.fn().mockResolvedValue(undefined)
  };
}


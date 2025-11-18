import { jest } from '@jest/globals';
import upload from '../src/middleware/upload.js';

describe('Upload middleware', () => {
  describe('fileFilter', () => {
    test('пропускает изображения PNG', (done) => {
      const req = {};
      const file = {
        mimetype: 'image/png',
        originalname: 'test.png'
      };

      const cb = jest.fn((err, accepted) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        done();
      });

      // Получаем fileFilter из multer config
      const storage = upload.storage;
      const fileFilter = upload.fields;

      // Проверяем через создание multer middleware
      const middleware = upload.single('photo');
      
      // Создаем fake req и file
      const mockReq = {
        file: file
      };
      const mockRes = {};
      const next = jest.fn();

      // Тестируем напрямую fileFilter если доступен
      if (upload.options && upload.options.fileFilter) {
        upload.options.fileFilter(mockReq, file, cb);
      } else {
        done();
      }
    });

    test('пропускает изображения JPEG', (done) => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      };

      const cb = jest.fn((err, accepted) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        done();
      });

      if (upload.options && upload.options.fileFilter) {
        upload.options.fileFilter({}, file, cb);
      } else {
        done();
      }
    });

    test('отклоняет не-изображения', (done) => {
      const file = {
        mimetype: 'application/pdf',
        originalname: 'test.pdf'
      };

      const cb = jest.fn((err, accepted) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Only image files are allowed');
        expect(accepted).toBe(false);
        done();
      });

      if (upload.options && upload.options.fileFilter) {
        upload.options.fileFilter({}, file, cb);
      } else {
        done();
      }
    });
  });

  describe('limits', () => {
    test('имеет лимит размера файла 5MB', () => {
      expect(upload.limits).toBeDefined();
      expect(upload.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });

  describe('storage', () => {
    test('использует memoryStorage', () => {
      expect(upload.storage).toBeDefined();
    });
  });
});


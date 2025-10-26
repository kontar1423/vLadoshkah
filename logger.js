// logger.js
import pino from 'pino';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Получаем текущую директорию для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

let logger;

if (process.env.NODE_ENV === 'production') {
  // В production используем нативный multistream из pino
  const streams = [
    { stream: process.stdout },
    { stream: createWriteStream(join(logsDir, 'app.log'), { flags: 'a' }) }
  ];

  logger = pino(
    {
      level: 'info',
      timestamp: pino.stdTimeFunctions.isoTime
    },
    pino.multistream(streams)
  );
} else {
  // In development: pretty console output
  logger = pino({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  });
}

// Правильный экспорт методов
export const debug = logger.debug.bind(logger);
export const error = logger.error.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const fatal = logger.fatal.bind(logger);
export const trace = logger.trace.bind(logger);

export default logger;
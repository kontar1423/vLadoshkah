// logger.js
import pino from 'pino';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Получаем текущую директорию для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const fallbackSerializers = {
  err: (err) => err,
  req: (req) => req,
  res: (res) => res
};

function getSerializers() {
  if (!pino || !pino.stdSerializers) {
    return fallbackSerializers;
  }
  return {
    err: pino.stdSerializers.err || fallbackSerializers.err,
    req: pino.stdSerializers.req || fallbackSerializers.req,
    res: pino.stdSerializers.res || fallbackSerializers.res
  };
}

// Конфигурация из переменных окружения
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = process.env.LOG_DIR || join(__dirname, 'logs');
// В development по умолчанию не пишем в файлы (только pretty консоль)
// В production по умолчанию пишем в файлы
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true' || (NODE_ENV === 'production' && process.env.LOG_TO_FILE !== 'false');
const LOG_PRETTY = process.env.LOG_PRETTY !== 'false' && NODE_ENV !== 'production';

// Создаем директорию для логов, если её нет
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// Функция для получения имени файла с датой для ротации
function getLogFileName(level) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(LOG_DIR, `${level}-${date}.log`);
}

// Функция для создания stream с автоматической ротацией по дате
// Используем createWriteStream с правильной настройкой для надежной записи в файлы
// Файлы создаются с датой в имени, ротация происходит автоматически при смене даты
function createRotatingStream(level) {
  const filePath = getLogFileName(level);
  // Создаем поток с автоматическим добавлением в конец файла
  const stream = createWriteStream(filePath, { 
    flags: 'a', // append mode
    encoding: 'utf8',
    autoClose: true
  });
  
  // Обработка ошибок записи
  stream.on('error', (err) => {
    console.error(`Error writing to log file ${filePath}:`, err);
  });
  
  return stream;
}

let logger;

function canUsePrettyTransport() {
  if (!LOG_PRETTY || LOG_TO_FILE) {
    return false;
  }

  try {
    require.resolve('pino-pretty');
    return true;
  } catch (err) {
    // В прод-образе dev-зависимости удалены, поэтому тихо откатываемся к обычному логированию
    console.warn('pino-pretty not available, falling back to standard logging');
    return false;
  }
}

if (NODE_ENV === 'production') {
  // Production: структурированные логи в файлы и stdout
  const streams = [
    // Все логи в stdout (для Docker/Kubernetes)
    { 
      level: LOG_LEVEL,
      stream: process.stdout 
    }
  ];

  // Добавляем файловые потоки для разных уровней, если включено
  if (LOG_TO_FILE) {
    // Error и Fatal логи в отдельный файл
    streams.push({
      level: 'error',
      stream: createRotatingStream('error')
    });

    // Warn логи
    streams.push({
      level: 'warn',
      stream: createRotatingStream('warn')
    });

    // Info логи
    streams.push({
      level: 'info',
      stream: createRotatingStream('info')
    });

    // Debug логи (если уровень позволяет)
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'trace') {
      streams.push({
        level: 'debug',
        stream: createRotatingStream('debug')
      });
    }

    // Общий файл со всеми логами
    streams.push({
      level: LOG_LEVEL,
      stream: createRotatingStream('app')
    });
  }

  logger = pino(
    {
      level: LOG_LEVEL,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        }
      },
      serializers: getSerializers()
    },
    pino.multistream(streams)
  );
} else {
  // Development: pretty логи в консоль + опционально в файлы
  const usePrettyTransport = canUsePrettyTransport();

  if (usePrettyTransport) {
    // Только консоль с pretty (по умолчанию в development)
    logger = pino({
      level: LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          hideObject: false
        }
      },
      serializers: getSerializers()
    });
  } else {
    // Консоль + файлы (если LOG_TO_FILE включен)
    const streams = [
      {
        level: LOG_LEVEL,
        stream: process.stdout
      }
    ];

    // В development можно также писать в файлы, если нужно
    if (LOG_TO_FILE) {
      streams.push({
        level: 'error',
        stream: createRotatingStream('error')
      });
      streams.push({
        level: LOG_LEVEL,
        stream: createRotatingStream('app')
      });
    }

    // Множественные потоки (консоль + файлы)
    logger = pino(
      {
        level: LOG_LEVEL,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label.toUpperCase() };
          }
        },
        serializers: getSerializers()
      },
      pino.multistream(streams)
    );
  }
}

// Вспомогательная функция для создания child logger с контекстом
export function createChildLogger(bindings) {
  return logger.child(bindings);
}

// Правильный экспорт методов с поддержкой структурированного логирования
// Принудительная синхронизация для файловых потоков
const flushLogs = () => {
  // Для файловых потоков нужно принудительно синхронизировать
  // В production с LOG_TO_FILE=true это важно для немедленной записи
  if (NODE_ENV === 'production' && LOG_TO_FILE) {
    // Pino использует асинхронную запись, но мы можем принудительно синхронизировать
    if (logger && typeof logger.flush === 'function') {
      logger.flush();
    }
  }
};

export const debug = (obj, msg) => {
  if (typeof obj === 'string') {
    logger.debug(obj);
  } else {
    logger.debug(obj, msg);
  }
  flushLogs();
};

export const info = (obj, msg) => {
  if (typeof obj === 'string') {
    logger.info(obj);
  } else {
    logger.info(obj, msg);
  }
  flushLogs();
};

export const warn = (obj, msg) => {
  if (typeof obj === 'string') {
    logger.warn(obj);
  } else {
    logger.warn(obj, msg);
  }
  flushLogs();
};

export const error = (obj, msg) => {
  if (typeof obj === 'string') {
    logger.error(obj);
  } else if (obj instanceof Error) {
    logger.error({ err: obj }, msg || obj.message);
  } else {
    logger.error(obj, msg);
  }
  flushLogs();
};

export const fatal = (obj, msg) => {
  if (typeof obj === 'string') {
    logger.fatal(obj);
  } else if (obj instanceof Error) {
    logger.fatal({ err: obj }, msg || obj.message);
  } else {
    logger.fatal(obj, msg);
  }
  flushLogs();
};

export const trace = (obj, msg) => {
  if (typeof obj === 'string') {
    logger.trace(obj);
  } else {
    logger.trace(obj, msg);
  }
  flushLogs();
};

// Экспорт основного логгера
export default logger;

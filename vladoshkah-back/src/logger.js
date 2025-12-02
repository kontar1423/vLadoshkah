import pino from 'pino';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

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

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = process.env.LOG_DIR || join(__dirname, 'logs');
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true' || (NODE_ENV === 'production' && process.env.LOG_TO_FILE !== 'false');
const LOG_PRETTY = process.env.LOG_PRETTY !== 'false' && NODE_ENV !== 'production';

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFileName(level) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(LOG_DIR, `${level}-${date}.log`);
}

function createRotatingStream(level) {
  const filePath = getLogFileName(level);
  const stream = createWriteStream(filePath, { 
    flags: 'a',
    encoding: 'utf8',
    autoClose: true
  });
  
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
    console.warn('pino-pretty not available, falling back to standard logging');
    return false;
  }
}

if (NODE_ENV === 'production') {
  const streams = [
    { 
      level: LOG_LEVEL,
      stream: process.stdout 
    }
  ];

  if (LOG_TO_FILE) {
    streams.push({
      level: 'error',
      stream: createRotatingStream('error')
    });

    streams.push({
      level: 'warn',
      stream: createRotatingStream('warn')
    });

    streams.push({
      level: 'info',
      stream: createRotatingStream('info')
    });

    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'trace') {
      streams.push({
        level: 'debug',
        stream: createRotatingStream('debug')
      });
    }

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
  const usePrettyTransport = canUsePrettyTransport();

  if (usePrettyTransport) {
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
    const streams = [
      {
        level: LOG_LEVEL,
        stream: process.stdout
      }
    ];

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

export function createChildLogger(bindings) {
  return logger.child(bindings);
}

const flushLogs = () => {
  if (NODE_ENV === 'production' && LOG_TO_FILE) {
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

export default logger;

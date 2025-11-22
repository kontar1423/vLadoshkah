// logger.js
const pino = require('pino');
const { multistream } = require('pino-multi-stream');
const fs = require('fs');

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

let logger;

if (process.env.NODE_ENV === 'production') {
  // In production write to both file and stdout
  const streams = [
    { stream: process.stdout }, // console (for docker/k8s)
    { stream: fs.createWriteStream('./logs/app.log', { flags: 'a' }) } // file log
  ];

  logger = pino(
    {
      level: 'info',
      timestamp: pino.stdTimeFunctions.isoTime
    },
    multistream(streams)
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

module.exports = logger;

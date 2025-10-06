require('dotenv').config();
const express = require('express');
const animalsRouter = require('./routes/animals');
const sheltersRouter = require('./routes/shelters');
const usersRouter = require('./routes/users');
const photosRouter = require('./routes/photos');
const logger = require('./logger');
const pinoHttp = require('pino-http');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Structured HTTP logging with request id
app.use(pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.id || req.headers['x-request-id'];
    if (existing) return existing;
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode })
  }
}));

// Routes
app.use('/animals', animalsRouter);
app.use('/shelters', sheltersRouter);
app.use('/users', usersRouter);
app.use('/photos',photosRouter)

// Liveness/Readiness probe
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const requestId = req.id || (req.log && req.log.bindings && req.log.bindings().req && req.log.bindings().req.id);
  logger.error({ err, requestId }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message, requestId });
});

// Start server (skip in tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info({ port: PORT }, 'Server running'));
}

module.exports = app;

# Backend Service

Этот каталог содержит весь исполняемый код API. Ниже приведены инструкции по запуску и тестированию бэкенда.

## Требования

- Node.js ≥ 20 и npm ≥ 10
- Docker + Docker Compose
- PostgreSQL, Redis, MinIO и Kafka (можно поднять через `docker-compose.yml`)

## Быстрый старт

1. Установите зависимости  
   `npm install`
2. Настройте `.env` (см. пример в корне).
3. Примените миграции  
   `npm run migrate`
4. Запустите приложение  
   `npm run dev` — режим разработки  
   `npm start` — production-режим

Полный стек:

```
docker compose up --build
```

## Тесты

```
npm test
```

Jest покрывает DAO/роуты/сервисы/миддлвары (20 suites). `NODE_OPTIONS=--experimental-vm-modules` задаётся автоматически.

## Структура

- `index.js` — точка входа сервера
- `controllers/`, `routes/`, `services/`, `dao/` — основной слой API
- `middleware/`, `validators/` — проверка входных данных
- `config/` — конфигурация (JWT и т.д.)
- `messaging/`, `cache/`, `utils/` — интеграции Kafka/Redis и утилиты
- `logger.js`, `db.js`, `initMinio.js`, `minioClient.js` — инфраструктурные модули

## Полезные команды

- `npm run migrate` / `npm run migrate:down` — управление миграциями
- `npm test` — запуск всех тестов
- `npm run dev` — разработка
- `npm start` — production

## Rate limit

По умолчанию действует лимит на IP: 100 запросов в минуту на все `/api/*` и 10 запросов за 5 минут на `/api/auth/*`. Настройки можно изменить переменными окружения `RATE_LIMIT_WINDOW_SECONDS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_AUTH_WINDOW_SECONDS`, `RATE_LIMIT_AUTH_MAX_REQUESTS`.

Отключение: `RATE_LIMIT_ENABLED=false` выключит глобальный лимит; `RATE_LIMIT_AUTH_ENABLED=false` отключит только `/api/auth` (по умолчанию следует за глобальной настройкой).

Документация по REST API находится в `README.md` в корне.

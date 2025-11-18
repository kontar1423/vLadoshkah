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

Документация по REST API находится в `README.md` в корне.


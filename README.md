# В Ладошках

Сервис, который помогает приютам и людям быстрее находить друг друга: карточки животных, заявки на отдачу и поиск дома, рейтинг приютов, медиа-хранилище и авторизация по ролям. Здесь лежат и фронтенд, и API.

## Структура репозитория
- `vladoshkah-front/` — клиент на React/Vite/Tailwind; инструкции по запуску и сборке в `vladoshkah-front/README.md`.
- `vladoshkah-back/` — API на Node.js/Express с Postgres, Redis, MinIO и Kafka; схема эндпоинтов в `vladoshkah-back/README.md`, подробности по развёртыванию в `vladoshkah-back/src/README.md`.

## Быстрый старт
1. Требования: Node.js ≥ 20, npm ≥ 10; для бэкенда — Docker Compose (PostgreSQL, Redis, MinIO, Kafka).
2. Бэкенд: `cd vladoshkah-back && cp .envExample .env && npm install && docker compose up -d && npm run migrate && npm run dev` (API поднимается на `http://localhost:4000/api`, health-check — `GET /healthz`).
3. Фронтенд: `cd vladoshkah-front && npm install && npm run dev` (Vite слушает `http://localhost:5173`).
4. Прод: `npm run build` в `vladoshkah-front` и `npm start` в `vladoshkah-back` после настройки окружения.

## Полезные материалы
- Краткое руководство для фронта: `vladoshkah-front/README.md`.
- Описание API и ролей: `vladoshkah-back/README.md`.
- Детали запуска и тестов бэкенда: `vladoshkah-back/src/README.md`.
- Дополнительные заметки DevOps: `vladoshkah-front/DEVOPS.md`.

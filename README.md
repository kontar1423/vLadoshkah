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

## CI/CD на сервер
- Workflow `.github/workflows/deploy.yml` срабатывает на пуш в `main`, запускается на self-hosted runner (на вашем сервере) и собирает только изменившиеся части.
- Требования к серверу: Linux, Docker + Docker Compose, Node.js >= 20 и npm >= 10.
- Логика сборки: код синхронизируется в `/etc/webapp`; при изменениях в `vladoshkah-back/**` выполняется `docker compose up --build -d` в `/etc/webapp/vladoshkah-back`; при изменении `vladoshkah-front/package*.json` или первой сборке выполняется `npm ci`; при изменении `vladoshkah-front/**` выполняется `npm run build` в `/etc/webapp/vladoshkah-front`.
- Self-hosted runner: установите GitHub Actions runner на сервере (GitHub → Settings → Actions → Runners → New self-hosted runner, OS Linux), запустите его как сервис. Раннер должен иметь лейбл `self-hosted` (используется в workflow).
- Настройка окружения: храните `.env` в `/etc/webapp/vladoshkah-back/.env` (и при необходимости `/etc/webapp/vladoshkah-front/.env`); при синхронизации `rsync` пропускает `.env` и `node_modules`.

## Бэкапы
- Скрипт `scripts/backup.sh` делает архив кода из `/etc/webapp` (без `node_modules`), дамп Postgres из Docker Compose сервиса `db`, архивы MinIO и Redis volumes (если найдены) в `/var/backups/vladoshkah/<timestamp>`.
- Запуск (нужны права на Docker): `sudo APP_ROOT=/etc/webapp BACKUP_DIR=/var/backups/vladoshkah ./scripts/backup.sh`. Можно добавить в cron, используя путь до репозитория на сервере (например, `/opt/actions-runner/_work/vLadoshkah/vLadoshkah/scripts/backup.sh`).

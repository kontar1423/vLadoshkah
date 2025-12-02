# Технологический стек vLadoshkah

## Frontend

### Основные технологии
- **React 18.2** - UI библиотека
- **Vite 5.0** - сборщик и dev-сервер
- **React Router DOM 6.20** - маршрутизация
- **Axios 1.13** - HTTP клиент

### Стилизация
- **Tailwind CSS 3.4** - utility-first CSS фреймворк
- **PostCSS 8.5** - обработка CSS
- **Autoprefixer 10.4** - автоматические префиксы

### Дополнительные библиотеки
- **React Helmet Async 2.0** - управление мета-тегами
- **Leaflet 1.9** - карты
- **React Leaflet 4.2** - React обертка для Leaflet

## Backend

### Основной стек
- **Node.js ≥20** - runtime
- **Express 5.1** - веб-фреймворк
- **PostgreSQL 16** - реляционная БД
- **Redis 7** - кэш и rate limiting

### Аутентификация и безопасность
- **jsonwebtoken 9.0** - JWT токены
- **bcryptjs 2.4** - хеширование паролей
- **joi 18.0** - валидация данных

### Файловое хранилище
- **MinIO** - S3-совместимое объектное хранилище
- **multer 2.0** - обработка multipart/form-data

### Асинхронная обработка
- **KafkaJS 2.2** - интеграция с Apache Kafka
- **nodemailer 6.10** - отправка email

### Работа с БД
- **pg 8.16** - PostgreSQL клиент
- **node-pg-migrate 8.0** - миграции БД

### Логирование
- **pino 9.9** - быстрый логгер
- **pino-http 10.5** - HTTP логирование
- **pino-pretty 13.1** - форматирование логов (dev)

### Утилиты
- **dotenv 16.6** - переменные окружения
- **uuid 13.0** - генерация уникальных ID
- **cors 2.8** - CORS middleware

### Тестирование
- **Jest 29.7** - тестовый фреймворк
- **Supertest 7.1** - HTTP тестирование

## Инфраструктура

### Контейнеризация
- **Docker** - контейнеризация приложений
- **Docker Compose** - оркестрация контейнеров

### Сервисы (через Docker)
- **PostgreSQL 16 Alpine** - база данных
- **Redis 7 Alpine** - кэш
- **MinIO Latest** - объектное хранилище
- **Apache Kafka 7.5** - message broker
- **Zookeeper 7.5** - координация Kafka

## Инструменты разработки

### Backend
- **nodemon 3.1** - автоперезагрузка при разработке
- **ES Modules** - современный JavaScript

### Frontend
- **Vite Dev Server** - HMR (Hot Module Replacement)
- **React DevTools** - отладка React

## Версии и требования

### Минимальные требования
- Node.js ≥ 20
- npm ≥ 10
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Рекомендуемые версии
- Node.js 20.x LTS
- npm 10.x
- Docker 24.x
- PostgreSQL 16.x

## Зависимости проекта

### Backend dependencies (production)
- 14 основных зависимостей
- Общий размер: ~50MB

### Frontend dependencies (production)
- 6 основных зависимостей
- React экосистема: ~15MB

### Dev dependencies
- Backend: Jest, nodemon, pino-pretty
- Frontend: Vite plugins, TypeScript types

## Производительность

### Оптимизации
- **Кэширование**: Redis для часто запрашиваемых данных
- **Пулы соединений**: PostgreSQL connection pooling
- **Ленивая загрузка**: React lazy loading компонентов
- **Code splitting**: Vite автоматический code splitting

### Мониторинг
- **Логирование**: структурированные логи через Pino
- **Health checks**: `/healthz` эндпоинт
- **Rate limiting**: защита от перегрузки

## Безопасность

### Используемые практики
- JWT с коротким временем жизни access токенов
- Хеширование паролей через bcrypt (12 rounds)
- Валидация всех входных данных
- Rate limiting для защиты от атак
- CORS настройка
- SQL injection защита через параметризованные запросы


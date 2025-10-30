# Используем официальный Node.js alpine для меньшего размера
FROM node:22-alpine AS base

# Создаём рабочую директорию
WORKDIR /usr/src/app

# Этап 1: Установка зависимостей (кэшируется отдельно)
FROM base AS dependencies

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости (производственные + dev для миграций)
RUN npm ci --include=dev

# Этап 2: Сборка приложения
FROM base AS build

# Копируем зависимости из предыдущего этапа
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Этап 3: Production образ
FROM base AS production

# Устанавливаем системные зависимости для проверок
RUN apk add --no-cache \
    postgresql-client \
    curl \
    redis \
    && rm -rf /var/cache/apk/*

# Копируем только production зависимости
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Копируем и делаем исполняемым скрипт ожидания
COPY wait-for-services.sh /usr/src/app/wait-for-services.sh
RUN chmod +x /usr/src/app/wait-for-services.sh

# Создаём пользователя без root прав для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Пробрасываем порт
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/healthz || exit 1

CMD ["/usr/src/app/wait-for-services.sh"]
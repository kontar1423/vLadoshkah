# Используем официальный Node.js
FROM node:22

# Создаём рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Устанавливаем netcat (для проверки готовности сервисов)
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Пробрасываем порт
EXPOSE 4000

# Скрипт запуска: ждём БД и MinIO, затем миграции и старт
CMD ["sh", "-c", "\
  echo '⏳ Waiting for database...'; \
  until nc -z db 5432; do \
    echo 'Database is unavailable - sleeping'; \
    sleep 1; \
  done; \
  echo '✅ Database is up'; \
  \
  echo '⏳ Waiting for MinIO...'; \
  until nc -z minio 9000; do \
    echo 'MinIO is unavailable - sleeping'; \
    sleep 1; \
  done; \
  echo '✅ MinIO is up'; \
  \
  echo '🚀 Running migrations...'; \
  npx node-pg-migrate up; \
  \
  echo '🚀 Starting server...'; \
  npm run dev \
"]

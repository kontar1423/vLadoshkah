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

# Пробрасываем порт
EXPOSE 4000

# Команда по умолчанию — миграции, seed и запуск сервера
CMD ["sh", "-c", "npx node-pg-migrate up && npm run dev"]

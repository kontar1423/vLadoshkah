# Используем официальный Node.js
FROM node:22-alpine

# Создаём рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь проект
COPY . .

# Устанавливаем зависимости для проверок
RUN apk add --no-cache postgresql-client curl

# Пробрасываем порт
EXPOSE 4000

# Скрипт для проверки готовности БД (более надежный чем netcat)
COPY wait-for-services.sh /usr/src/app/
RUN chmod +x /usr/src/app/wait-for-services.sh

CMD ["/usr/src/app/wait-for-services.sh"]
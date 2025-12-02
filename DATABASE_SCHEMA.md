# Схема базы данных vLadoshkah

## Основные таблицы

### users
Хранение информации о пользователях системы.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| email | VARCHAR(100) UNIQUE | Email пользователя |
| password | VARCHAR(255) | Хешированный пароль |
| role | VARCHAR(20) | Роль: user, shelter_admin, admin |
| firstname | VARCHAR(100) | Имя |
| lastname | VARCHAR(100) | Фамилия |
| gender | VARCHAR(30) | Пол |
| phone | VARCHAR(30) | Телефон |
| bio | TEXT | Биография (до 2000 символов) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### shelters
Информация о приютах для животных.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| name | VARCHAR(255) | Название приюта |
| description | TEXT | Описание |
| address | VARCHAR(500) | Адрес |
| district | VARCHAR(100) | Район (Москва) |
| latitude | DECIMAL(10,8) | Широта для карты |
| longitude | DECIMAL(11,8) | Долгота для карты |
| admin_id | INTEGER REFERENCES users(id) | Администратор приюта |
| rating | DECIMAL(3,2) | Средний рейтинг (1-5) |
| total_ratings | INTEGER | Количество оценок |
| inn | VARCHAR(20) | ИНН приюта |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### animals
Информация о животных в приютах.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| name | VARCHAR(255) | Имя животного |
| type | VARCHAR(50) | Тип: dog, cat, bird, rodent, fish, reptile |
| age | INTEGER | Возраст в годах |
| gender | VARCHAR(20) | Пол: male, female |
| size | VARCHAR(20) | Размер: small, medium, large |
| health | VARCHAR(50) | Здоровье: healthy, needs_treatment, special_needs |
| color | VARCHAR(100) | Окрас |
| personality | TEXT | Характер |
| description | TEXT | Описание |
| shelter_id | INTEGER REFERENCES shelters(id) | Приют |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### photos
Метаданные о фотографиях.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| original_name | VARCHAR(255) | Оригинальное имя файла |
| object_name | VARCHAR(255) | Имя объекта в MinIO |
| bucket | VARCHAR(100) | Бакет MinIO |
| size | INTEGER | Размер файла в байтах |
| mimetype | VARCHAR(100) | MIME тип |
| entity_type | VARCHAR(50) | Тип сущности: animal, shelter, user |
| entity_id | INTEGER | ID сущности |
| url | VARCHAR(500) | URL фотографии |
| uploaded_at | TIMESTAMP | Дата загрузки |

### applications
Заявки на усыновление и отдачу животных.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| type | VARCHAR(20) | Тип: take, give |
| user_id | INTEGER REFERENCES users(id) | Пользователь |
| shelter_id | INTEGER REFERENCES shelters(id) | Приют |
| animal_id | INTEGER REFERENCES animals(id) | Животное (для take) |
| description | TEXT | Описание заявки (10-5000 символов) |
| status | VARCHAR(20) | Статус: pending, approved, rejected, cancelled |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### favorite_animals
Избранные животные пользователей.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| user_id | INTEGER REFERENCES users(id) | Пользователь |
| animal_id | INTEGER REFERENCES animals(id) | Животное |
| created_at | TIMESTAMP | Дата добавления |
| UNIQUE(user_id, animal_id) | | Уникальная пара |

### votes
Голоса за рейтинг приютов.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| shelter_id | INTEGER REFERENCES shelters(id) | Приют |
| user_id | INTEGER REFERENCES users(id) | Пользователь |
| rating | INTEGER | Оценка (1-5) |
| created_at | TIMESTAMP | Дата оценки |
| UNIQUE(shelter_id, user_id) | | Один голос от пользователя |

### animals_to_give
Животные, которых отдают пользователи (для заявок give).

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| application_id | INTEGER REFERENCES applications(id) | Заявка |
| name | VARCHAR(255) | Имя животного |
| type | VARCHAR(50) | Тип |
| age | INTEGER | Возраст |
| description | TEXT | Описание |
| created_at | TIMESTAMP | Дата создания |

## Связи между таблицами

```
users (1) ──< (N) shelters (admin_id)
users (1) ──< (N) applications (user_id)
users (1) ──< (N) favorite_animals (user_id)
users (1) ──< (N) votes (user_id)

shelters (1) ──< (N) animals (shelter_id)
shelters (1) ──< (N) applications (shelter_id)
shelters (1) ──< (N) votes (shelter_id)

animals (1) ──< (N) applications (animal_id)
animals (1) ──< (N) favorite_animals (animal_id)
animals (1) ──< (N) photos (entity_id, entity_type='animal')

shelters (1) ──< (N) photos (entity_id, entity_type='shelter')
users (1) ──< (N) photos (entity_id, entity_type='user')

applications (1) ──< (1) animals_to_give (application_id)
```

## Индексы

- `users.email` - UNIQUE индекс для быстрого поиска
- `animals.shelter_id` - индекс для фильтрации по приюту
- `applications.user_id` - индекс для поиска заявок пользователя
- `applications.shelter_id` - индекс для поиска заявок приюта
- `photos.entity_type, entity_id` - составной индекс для поиска фотографий
- `favorite_animals(user_id, animal_id)` - уникальный индекс
- `votes(shelter_id, user_id)` - уникальный индекс

## Миграции

Все изменения схемы БД выполняются через миграции:
- `node-pg-migrate up` - применение миграций
- `node-pg-migrate down` - откат миграций

Миграции находятся в `vladoshkah-back/migrations/`

## Нормализация

База данных нормализована до 3NF:
- Нет дублирования данных
- Связи через внешние ключи
- Отдельная таблица для фотографий (полиморфная связь)
- Отдельная таблица для избранного

## Производительность

- Использование индексов для частых запросов
- Connection pooling для управления соединениями
- Кэширование через Redis для часто запрашиваемых данных


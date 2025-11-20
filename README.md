# vLadoshkah API – Frontend Guide

Это краткое руководство для разработки клиентских приложений. Здесь описаны доступные эндпоинты, правила авторизации и структура данных. Техническая документация по запуску бэкенда находится в `src/README.md`.

---

## Быстрый запуск для презентации

1. `cp .envExample .env` и при необходимости обновите пароли/хосты.
2. Запустите инфраструктуру: `docker compose up -d` (Postgres, Redis, MinIO, Kafka).
3. Примените миграции: `npm run migrate`.
4. Запустите API: `npm start` (порт `4000`).
5. Для показа интерфейса откройте `front_test/admin.html` и авторизуйтесь любым валидным админ-аккаунтом.

---

## Базовые сведения

- **Базовый URL:** `/api`
- **Формат:** JSON
- **Аутентификация:** JWT в заголовке `Authorization: Bearer <token>`
- **Срок действия токенов:** access – 7 дней, refresh – 30 дней

---

## Аутентификация (`/api/auth`)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST  | `/register` | Регистрация пользователя (`email`, `password`, `role?`) |
| POST  | `/login` | Авторизация, возвращает пару токенов |
| POST  | `/refresh` | Обновление access-токена по refresh-токену |

Пример ответа на `/login`:

```json
{
  "success": true,
  "user": { "id": 1, "email": "user@example.com", "role": "user" },
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

---

## Пользователи (`/api/users`)

- `GET /api/users` — публичный список пользователей.
- `GET /api/users/:id` — профиль пользователя.
- `POST /api/users` — создание пользователя администратором (поддерживается `multipart/form-data` с фото).
- `PUT/PATCH /api/users/:id` — обновление данных (требуется авторизация).
- `DELETE /api/users/:id` — удаление (только `admin`).

Валидация:

- email/пароль обязательные для POST
- пароль ≥ 6 символов
- роли: `user`, `shelter_admin`, `admin`

---

## Приюты (`/api/shelters`)

- `GET /api/shelters` — публичный список, включает новые поля:
  - `can_adopt` (boolean) — принимает ли приют заявки на усыновление
  - `region` (строка: `cao`, `sao`, `svao`, `vao`, `yuvao`, `yao`, `yuzao`, `zao`, `szao`, `zelao`, `tinao`, `nao`)
- `GET /api/shelters/:id` — подробности приюта.
- `POST /api/shelters` — создание (роль `admin`). Поля: `name`, `address?`, `phone?`, `email?`, `website?`, `description?`, `capacity?`, `working_hours?`, `can_adopt?`, `region?`, `admin_id?`, `status?`.
- `PUT/PATCH /api/shelters/:id` — обновление тех же полей.
- `DELETE /api/shelters/:id` — удаление приюта.

Создание с учётом новых атрибутов:

```json
{
  "name": "Добрые руки",
  "address": "ул. Ленина, 10",
  "phone": "+79998887766",
  "email": "new@shelter.ru",
  "capacity": 80,
  "working_hours": "Пн-Пт 09:00–19:00",
  "can_adopt": true,
  "region": "zao",
  "admin_id": 12,
  "status": "active"
}
```

---

## Животные (`/api/animals`)

Публичные GET-эндпоинты:

- `/api/animals` — список.
- `/api/animals/:id` — карточка.
- `/api/animals/filters` — фильтр по `type`, `gender`, `age_min/max`, `animal_size`, `health`, `shelter_id`, `search`.
- `/api/animals/shelter/:shelterId` — животные конкретного приюта.
- `/api/animals/search/:term` — поиск по имени/типу.

Админские эндпоинты (`admin` или `shelter_admin`, `multipart/form-data` при создании):

- `POST /api/animals` — требует минимум `name`, `age`, `type`, `shelter_id`; допускает фото (поле `photo`).
- `PUT/PATCH /api/animals/:id` — обновление данных.
- `DELETE /api/animals/:id` — удаление.

Пример ответа списка:

```json
[
  {
    "id": 9,
    "name": "Барсик",
    "type": "cat",
    "age": 2,
    "shelter_id": 4,
    "animal_size": "medium",
    "health": "здоров",
    "photos": [{ "url": "/uploads/7d...jpg" }]
  }
]
```

---

## Фото (`/api/photos`)

- `POST /api/photos/upload` — загрузка файла (`photo`), авторизация обязательна.
- `GET /api/photos` — список фото.
- `GET /api/photos/info/:id` — метаданные.
- `GET /api/photos/file/:objectName` — получение файла.
- `GET /api/photos/entity/:entityType/:entityId` — фото, привязанные к `animal`, `shelter` или `user`.
- `DELETE /api/photos/:id` — удаление (требуется авторизация).

Ответ загрузки:

```json
{
  "id": 12,
  "object_name": "animal_12_abc.jpg",
  "url": "/uploads/animal_12_abc.jpg"
}
```

---

## Заявки (`/api/applications`)

Все операции требуют авторизации.

- `POST /api/applications` — создать заявку (`user_id`, `shelter_id`, `animal_id`, `description`, `status?`).
- `GET /api/applications` — список по текущему пользователю.
- `GET /api/applications/:id` — одна заявка.
- `PUT /api/applications/:id` — полное обновление.
- `PATCH /api/applications/:id` — частичное обновление.
- `DELETE /api/applications/:id` — отмена.
- `GET /api/applications/count/approved` — количество одобренных заявок (для дашбордов).

Валидация описания — 10–5000 символов, `status` ∈ `pending|approved|rejected|cancelled`.

---

## Фотогалерея и медиа в админке

`admin.html` и `animal.html` используют те же эндпоинты:

- загрузка фотографий приютов и животных реализована через `/api/photos/upload`.
- вкладка “Приюты” в админке хранит `can_adopt` и `region`, а также поддерживает множественную загрузку фото.

---

## Ошибки и коды ответа

```json
{
  "success": false,
  "error": "Validation error",
  "details": [{ "field": "email", "message": "Email обязателен" }]
}
```

| Код | Значение |
|-----|----------|
| 400 | Ошибка валидации / некорректный запрос |
| 401 | Требуется валидный JWT |
| 403 | Недостаточно прав |
| 404 | Ресурс не найден |
| 409 | Конфликт (например, дубликат данных) |
| 500 | Внутренняя ошибка |

---

## Дополнительно

- Кэширование через Redis: животные/приюты — 1 час, пользователи — 30 минут, заявки — 5 минут.
- Kafka и MinIO используются на серверной стороне для нотификаций и хранения файлов; клиентской интеграции не требуется.
- Все пароли хранятся только в хешированном виде, API никогда не возвращает поле `password`.

Для вопросов по запуску окружения, тестированию или структуре каталогов смотрите `src/README.md` или обращайтесь к команде бэкенда.

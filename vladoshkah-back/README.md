# vLadoshkah API — руководство для фронтенда

Подробное описание, как подключаться к API, какие эндпоинты доступны и что ожидать в ответах. Инструкции по развёртыванию сервера находятся в `src/README.md`.

## Подключение

- Базовый URL: `http://<host>:<port>/api` (по умолчанию порт `4000`).
- Формат: `application/json`, для загрузки файлов — `multipart/form-data`.
- Аутентификация: JWT в заголовке `Authorization: Bearer <accessToken>`.
- Срок жизни токенов: access — 7d, refresh — 30d (по умолчанию из `.env`).
- Готовность сервера: `GET /healthz` (200 OK при доступной БД).
- Общие заголовки: `Accept: application/json`; для форм — `Content-Type: multipart/form-data` (браузер ставит сам).
- Авторизация на фронте: сохраняйте `accessToken` (для запросов) и `refreshToken` (для обновления) в защищённом месте; при 401 с причиной `Token expired` обновляйте через `/api/auth/refresh`.

## Роли и доступ

Три роли: `user`, `shelter_admin`, `admin`.
- Публичные GET для животных/приютов/фотографий доступны всем.
- Создание/обновление/удаление животных — `admin` или `shelter_admin` (админ приюта может работать только со “своими” животными).
- CRUD по приютам — `admin`; `shelter_admin` может редактировать/удалять только свои приюты (по `admin_id`).
- CRUD по пользователям — только `admin`, кроме `/users/me`.
- Все заявки (`/api/applications`) требуют авторизации любой роли.

## Структура ошибок

Чаще всего возвращается объект с полем `error` и статус-кодом:

```json
{ "error": "Invalid token" }
```

Коды: 400 (валидация), 401 (нет/просрочен токен), 403 (нет прав), 404 (не найдено), 409 (конфликт), 500 (ошибка сервера).

Пример ответа валидации (Joi):

```json
{
  "error": "Validation error",
  "details": [
    { "message": "\"email\" is required", "path": ["email"] }
  ]
}
```

## Аутентификация (`/api/auth`)

| Метод | Путь | Тело запроса | Ответ |
|-------|------|--------------|-------|
| POST  | `/register` | `email` (обяз.), `password` (обяз., ≥6), `role?` (`user`/`admin`/`shelter_admin`) | 201 `{ success, message, user, accessToken, refreshToken }` |
| POST  | `/login` | `email`, `password` | 200 `{ success, message, user, accessToken, refreshToken }` |
| POST  | `/refresh` | `refreshToken` | 200 `{ success, message, accessToken, refreshToken }` |

Пример запроса логина:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "secret123" }
```

Типичный ответ:

```json
{
  "success": true,
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com", "role": "user" },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

Обновление токена:

```http
POST /api/auth/refresh
Authorization: Bearer <старый accessToken> (можно без)
Content-Type: application/json

{ "refreshToken": "<refreshToken>" }
```

## Пользователи (`/api/users`)

- `GET /api/users` — публичный список пользователей без паролей, с массивом `photos` (если есть). Поля профиля: `firstname`, `lastname`, `gender`, `phone`, `bio`.
- `GET /api/users/:id` — публичный профиль.
- `GET /api/users/me` — профиль по access токену.
- `PUT|PATCH /api/users/me` — частичное/полное обновление текущего пользователя (только поля профиля, без email). Токен обязателен. Поддерживает `bio`.
- `POST /api/users` — создание пользователя (роль `admin`). Тело: `email` (обяз.), `password` (обяз., ≥6), `firstname?`, `lastname?`, `role?`, `gender?`, `phone?`, `bio?`. Поддерживает `multipart/form-data` с файлом `photo` (загружается в MinIO).
- `PUT|PATCH /api/users/:id` — обновление пользователя (только `admin`). Принимает те же текстовые поля, включая `bio` (файл сейчас не обрабатывается).
- `DELETE /api/users/:id` — удалить пользователя (только `admin`).

Ответы `GET/POST/PUT` — объект пользователя с массивом `photos: [{ url }]`. Обёртка `success` есть только у POST/PUT в контроллере (`{ success, user, message }`).

### Избранные животные (`/api/users/favorite`)

- Требуется авторизация; `user_id` должен совпадать с токеном (кроме `admin`).
- Поля запроса: `user_id` и `animal_id` (можно передать `shelter_id` как alias для `animal_id`).
- `GET /api/users/favorite?user_id=1&animal_id=9` — проверить, есть ли лайк у пользователя на животное. Ответ: `{ "isFavorite": true|false }` (404 если не существует пользователь или животное).
- `POST /api/users/favorite` — добавить лайк; JSON-тело: `{ "user_id": 1, "animal_id": 9 }`. Ответ 201 при создании, 200 если лайк уже существовал: `{ "message": "Favorite added|Already in favorites", "isFavorite": true }`.
- `DELETE /api/users/favorite` — убрать лайк; JSON-тело как выше. Ответ всегда 200, тело `{ "message": "Favorite removed|Favorite not found", "isFavorite": false }`.
- `POST /api/users/favorite/animals` — массовая проверка. Тело: `{ "user_id": 1, "animal_ids": [9, 10, 11] }`. Ответ: объект-мэп, где каждому `id` сопоставлен `true|false`, например `{ "9": true, "10": false, "11": true }`.

Пример запроса создания с фото (admin):

```
POST /api/users
Authorization: Bearer <token>
Content-Type: multipart/form-data

email=user@example.com
password=secret123
firstname=Jane
role=admin
photo=<file>
```

Пример ответа `GET /api/users/1`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "user",
  "firstname": "Jane",
  "lastname": "Doe",
  "bio": "О себе",
  "photos": [{ "url": "/uploads/<object>" }]
}
```

## Приюты (`/api/shelters`)

- `GET /api/shelters` — публичный список. Поля: `name`, `address?`, `phone?`, `email?`, `inn?` (10 или 12 цифр), `website?`, `description?`, `capacity?`, `working_hours?`, `can_adopt?`, `region?`, `admin_id?`, `status`, `rating`, `total_ratings`, `photos` (если прикреплены). Дополнительно можно передать `?limit=10`, чтобы ограничить количество записей.
- `GET /api/shelters/admin/:adminId` — получить приют по `admin_id` (это `user_id` пользователя с ролью `shelter_admin`; используется для личного кабинета администратора приюта).
- `GET /api/shelters/:id` — подробности по ID (+ `photos`).
- `POST /api/shelters` — создать приют (`admin`; `shelter_admin` создаёт приют только для себя, `admin_id` берётся из токена). Тело как в списке полей выше (ИНН валидируется как строка из 10 или 12 цифр). Маршрут принимает `multipart/form-data`, но переданный файл `photo` сейчас сервером не сохраняется.
- `PUT|PATCH /api/shelters/:id` — обновить приют (`admin`; `shelter_admin` может редактировать только приюты, где он указан в `admin_id`, смена владельца запрещена).
- `DELETE /api/shelters/:id` — удалить приют (`admin`; `shelter_admin` может удалить только свой приют), связанные фото также удаляются.
- `POST /api/shelters/vote` — голос за приют (любая авторизованная роль). Тело: `shelter_id` (int), `vote` (1–5). Ответ: `{ message, rating, vote }`, повторный голос того же пользователя обновит предыдущий (статус 200) и пересчитает рейтинг; `total_ratings` увеличивается только при первом голосе пользователя за приют.

Пример запроса голосования:

```http
POST /api/shelters/vote
Authorization: Bearer <token>
Content-Type: application/json

{ "shelter_id": 3, "vote": 5 }
```

Пример ответа `GET /api/shelters/3`:

```json
{
  "id": 3,
  "name": "Добрые руки",
  "inn": "7701234567",
  "region": "zao",
  "rating": "4.67",
  "total_ratings": 12,
  "can_adopt": true,
  "photos": [{ "url": "/uploads/..." }]
}
```

## Животные (`/api/animals`)

Публичные:
- `GET /api/animals` — список животных с `photos` и `shelter_name`; можно передать `?limit=N`, чтобы ограничить выдачу.
- `GET /api/animals/:id` — карточка по ID.
- `GET /api/animals/shelter/:shelterId` — животные конкретного приюта.
- `GET /api/animals/filters` — фильтры: `type`, `gender` (`male|female|unknown`), `age_min`, `age_max`, `animal_size` (`small|medium|large`), `health`, `shelter_id`, `search` (по имени/цвету/описанию).
- `GET /api/animals/search/:term` — роут для поиска; на практике использует те же `query` что и `/filters` (значение `:term` не применяется).

Изменение данных (требуется `admin` или `shelter_admin`; приютный админ может трогать только свои объекты и не может менять `shelter_id` при обновлении):
- `POST /api/animals` — `multipart/form-data` c обязательными `name`, `age`, `type`, `shelter_id` и опциональным файлом `photo`. Доп.поля: `health?`, `gender?`, `color?`, `weight?`, `personality?`, `animal_size?`, `history?`.
- `PUT|PATCH /api/animals/:id` — обновление любых полей выше (текст/числа, без файла).
- `DELETE /api/animals/:id` — удаляет животное и его фото.

Пример ответа списка:

```json
[{
  "id": 9,
  "name": "Барсик",
  "type": "cat",
  "age": 2,
  "shelter_id": 4,
  "animal_size": "medium",
  "health": "здоров",
  "photos": [{ "url": "/uploads/7d...jpg" }]
}] 
```

Фильтры `GET /api/animals/filters` (query):
- `type=cat|dog|...`
- `gender=male|female|unknown`
- `age_min`, `age_max` (int)
- `animal_size=small|medium|large`
- `health=<строка>`
- `shelter_id=<int>`
- `search=<строка>` (ищет в name/color/type/personality/history)

Пример создания с фото:

```
POST /api/animals
Authorization: Bearer <token>
Content-Type: multipart/form-data

name=Барсик
age=2
type=cat
shelter_id=4
animal_size=small
photo=<file>
```

## Фото (`/api/photos`)

- `POST /api/photos/upload` — загрузка файла `photo` (обязательно), токен обязателен. Тело `multipart/form-data` также требует `entity_type` (`animal|shelter|user`) и `entity_id` (int). Ответ: `{ id, original_name, object_name, url, entity_type, entity_id, size, mimetype }`.
- `GET /api/photos` — все фото.
- `GET /api/photos/info/:id` — метаданные по ID.
- `GET /api/photos/file/:objectName` — сам файл (стрим с корректным `Content-Type`).
- `GET /api/photos/entity/:entityType/:entityId` — фото конкретной сущности.
- `DELETE /api/photos/:id` — удалить фото (авторизация нужна).

Поле `url` в ответах возвращается без хоста (например, `/uploads/<object>`); можно использовать его напрямую, если MinIO доступен по тому же домену, или собрать ссылку вручную на `http://<host>:9000/uploads/<objectName>`. Надёжнее для фронтенда забирать файл через `GET /api/photos/file/:objectName`.

Пример загрузки:

```
POST /api/photos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

entity_type=animal
entity_id=12
photo=<file>
```

Пример отдачи файла:

```
GET /api/photos/file/7a1c...jpg
```

Если нужен прямой линк без API: `http://<host>:9000/uploads/7a1c...jpg` при доступности MinIO с фронта.

## Заявки (`/api/applications`)

В таблице заявок теперь есть поле `type` (`take`/`give`). По умолчанию создаётся `take`.

### Взять питомца (`/api/applications/take`)

Все маршруты требуют авторизации:
- `POST /api/applications/take` — создать заявку на принятие. Тело (`application/json`): `shelter_id`, `animal_id`, `description` (10–5000), `status?` (`pending|approved|rejected|cancelled`). `user_id` берётся из токена.
- `GET /api/applications/take` — все заявки на принятие.
- `GET /api/applications/take/:id` — заявка по ID.
- `PUT /api/applications/take/:id` — обновление, те же поля.
- `DELETE /api/applications/take/:id` — удалить.
- `GET /api/applications/take/count/approved` — количество approved (публично).

Ответ — объект заявки с `type: "take"`.

Пример запроса:

```http
POST /api/applications/take
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "shelter_id": 3,
  "animal_id": 9,
  "description": "Хочу забрать питомца домой",
  "status": "pending"
}
```

### Отдать питомца (`/api/applications/give`)

Все маршруты требуют авторизации. При создании записывается питомец в таблицу `animals_to_give`, создаётся заявка с `type="give"`, и опционально сохраняется фото с `entity_type=animal_to_give`.

- `POST /api/applications/give` — создать заявку и питомца. `multipart/form-data` или `application/json`; поля питомца: `name`, `species`, `breed?`, `character?`, `gender?`, `birth_date?` (`YYYY-MM-DD`), `vaccination_status?`, `health_status?`, `special_needs?`, `history?`; общие поля заявки: `shelter_id?`, `status?` (`pending|approved|rejected|cancelled`), `description?` (если не указать — возьмётся из history/special_needs), `user_id` берётся из токена. Опциональное поле файла `photo` (image/*); поле `photos` тоже принимается.
- `GET /api/applications/give` — все заявки на отдачу (каждая содержит `animal` с `photos`).
- `GET /api/applications/give/:id` — заявка по ID с данными питомца и фото.
- `PUT /api/applications/give/:id` — обновить статус/описание и/или поля питомца; можно приложить новый `photo` (добавится ещё одно фото).
- `DELETE /api/applications/give/:id` — удалить заявку и связанные `animals_to_give` + фото.

Пример создания:

```http
POST /api/applications/give
Authorization: Bearer <token>
Content-Type: multipart/form-data

user_id=5
name=Барсик
species=cat
gender=male
birth_date=2020-01-01
health_status=здоров
history=Дружелюбный
photo=<image>
```

Ответ: объект заявки с `type: "give"` и вложенным `animal` со свойствами и `photos: [{ url }]`.

## Медиа и URL

У животных/приютов/пользователей в ответах есть `photos: [{ url }]`. Значение `url` уже относительное (без `http://localhost`). Для отображения:
- либо подставьте домен MinIO (`http://<host>:9000${url}`), 
- либо возьмите `object_name` из `url` и запросите файл через `/api/photos/file/:objectName`.

## Шпаргалка для фронта

- Авторизация: после логина кладите `accessToken` в `Authorization` заголовок, обновляйте по `/api/auth/refresh` при 401 `Token expired`.
- Загрузка файлов: используйте `FormData` (`photo` поле + `entity_type`, `entity_id`), метод `POST /api/photos/upload`.
- Кеширование на бэке прозрачно; фронту ничего делать не нужно.
- Приютный админ (`shelter_admin`) может CRUD только животных своего приюта; ошибки `403` приходят при попытке изменить чужие записи.
- В ответах числовые идентификаторы приходят числами, кроме `rating` (numeric(3,2) в БД) — может прийти строкой, учитывайте при отображении. `total_ratings` — целое число голосов, растёт только на новых уникальных голосах.

## Примеры запросов (fetch/axios)

### Auth: логин и работа с токенами (fetch)

```js
// login
const login = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json(); // { user, accessToken, refreshToken }
};

// refresh
const refresh = async (refreshToken) => {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
};
```

### Retry при 401 Token expired (fetch)

```js
const withAuth = (getAccess, getRefresh, saveTokens) => async (url, options = {}) => {
  const call = async (token) => fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  });

  let res = await call(getAccess());
  if (res.status === 401) {
    const refreshed = await refresh(getRefresh());
    saveTokens(refreshed.accessToken, refreshed.refreshToken);
    res = await call(refreshed.accessToken);
  }
  return res;
};
```

### Получить список животных (axios)

```js
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const animals = await api.get('/animals', {
  params: { type: 'cat', animal_size: 'small' }
});
console.log(animals.data); // [{ id, name, photos: [...] }, ...]
```

### Загрузка фото животного (axios + FormData)

```js
const uploadAnimalPhoto = async (animalId, file) => {
  const form = new FormData();
  form.append('entity_type', 'animal');
  form.append('entity_id', animalId);
  form.append('photo', file);

  const res = await api.post('/photos/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data; // { id, object_name, url, ... }
};
```

### Создать заявку (fetch)

```js
const createApplication = async (token, payload) => {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create application');
  return res.json();
};
// payload: { user_id, shelter_id, animal_id, description, status? }
```

### Обработка 403

- 403 означает отсутствие прав (например, `shelter_admin` пытается изменить чужое животное). Это не вопрос токена — не надо рефрешить, показывайте пользователю понятное сообщение.

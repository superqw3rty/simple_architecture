# Backend

Свой сервер в `server/` (D-58): прокси к TVmaze с кешем, поиск с пагинацией и фильтром по жанрам, избранное. Данные хранятся в памяти процесса, базы нет. Тот же Simple Architecture: тонкий транспорт, бизнес-логика в тасках.

## Стек

- **Node 24, TypeScript без сборки**: Node сам снимает типы (type stripping). Отсюда ограничения: импорты с расширением `.ts`, `import type` для типов, только стираемый синтаксис (`erasableSyntaxOnly`: без `enum`, `namespace`, parameter properties). Алиасов `@/` нет — относительные пути.
- **Hono** + `@hono/node-server`. Hono держим только в `server/app.ts` и `server/routes/`: таски о нём не знают, фреймворк заменяется переписыванием одного слоя.
- Тесты — тот же Vitest; роуты тестируются через `app.request()` без запуска порта.

## Структура и слои

```
server/
  main.ts                 # запуск: serve(app, PORT)
  app.ts                  # Hono app: cors, clientId-middleware, подключение роутов, обработка ошибок
  routes/                 # транспорт («презентер» сервера): разобрать запрос → вызвать таску → ответ и статус
    shows.ts  favorites.ts
  tasks/                  # бизнес-логика: обычные функции, без Hono (tasks.md)
    searchShows/          # таска-папка: searchShows.ts + шаги filterByGenre, countGenres, paginate + тесты
    fetchWithCache.ts     # «взять из кеша или сходить в TVmaze»
    addToFavorites.ts  removeFromFavorites.ts  getFavorites.ts
  entities/               # хранилища в памяти (Entity): данные + функции их изменения
    cache.ts              # const cache: Record<string, CacheEntry> = {}
    favorites.ts          # const favorite: Record<ClientId, Record<ShowId, Show>> = {}
  tvmaze/                 # клиент внешнего API: request, типы ответа, mapShow, stripHtml
shared/                   # контракт API: только типы (Show, ShowsPage, FavoritesList…)
```

Зависимости только вниз: `routes → tasks → entities, tvmaze`. Роут не ходит в `entities` и `tvmaze` напрямую, таска не импортирует Hono и не знает про HTTP-статусы.

```ts
// ✅ server/routes/favorites.ts — транспорт тонкий
favorites.put('/:id', async (c) => {
  const id = parseShowId(c.req.param('id'));
  if (id === null) {
    return c.json({ error: 'Invalid show id' }, 400);
  }
  return c.json(await addToFavorites(c.get('clientId'), id));
});
```

❌ Фильтрация, пагинация, проверка кеша или обращение к `favorite` прямо в обработчике роута.

## Контракт API

- Все ответы JSON, префикс `/api`. Типы ответа описаны в `shared/` и импортируются и сервером, и фронтом (`@shared` на фронте). Контракт меняется только вместе с типом в `shared/`.
- Модель в ответе — доменная (`Show`), без UI-строк (D-53): сырые ответы TVmaze наружу не уходят, их переводит `server/tvmaze/mapShow.ts`.
- Ошибки: `{ error: string }` со статусом. 400 — неверный запрос (пустой `q`, кривой id, нет `X-Client-Id`), 404 — шоу нет в TVmaze, 502 — TVmaze недоступен. Текст ошибки — для разработчика, пользователю его не показывают.
- Пишущие методы идемпотентны: `PUT /api/favorites/:id` повторно не дублирует, `DELETE` отсутствующего не падает.

## Кеш (Entity `cache`)

- Ключ — полный URL запроса к TVmaze. Запись: `{ data, expiresAt }`, TTL 5 минут.
- Свежая запись → ответ из кеша без сети. Нет записи или протухла → запрос к TVmaze и перезапись.
- Ошибка TVmaze не кешируется.
- Время передаётся параметром (`now = Date.now()`), чтобы тесты не ждали 5 минут.

## Избранное и клиент (D-59)

- Логина нет. Фронт один раз создаёт UUID, хранит в `localStorage` и шлёт в заголовке `X-Client-Id` с каждым запросом.
- Middleware в `app.ts` проверяет формат UUID и кладёт его в контекст. Ручки избранного без валидного заголовка отвечают 400. Поиск без заголовка работает, просто все `isFavorite: false`.
- Хранилище ограничено (лимит шоу на клиента), чтобы память не росла бесконечно. Это учебное решение без защиты: кто знает ID, видит список.

## CORS и окружение

- `PORT` (по умолчанию 3001), `CORS_ORIGIN` — origin фронта (`https://<user>.github.io`). В `allowHeaders` есть `X-Client-Id`.
- Локально фронт ходит через Vite proxy `/api` → `http://localhost:3001`, CORS не нужен.
- Деплой — `docs/homework/hw2-plan.md`, раздел «Хостинг» (D-60).

## Тесты

- Таски и шаги — юнит-тесты рядом (`fetchWithCache`: попадание, протухание, ошибка не кешируется; `searchShows`: фильтр, страницы, счётчики жанров, `isFavorite`; избранное: идемпотентность, изоляция клиентов).
- `entities` сбрасываются между тестами функцией `reset…()` из того же файла.
- Роуты — через `app.request()`: статусы и форма ответа. TVmaze в тестах не вызывается: `vi.stubGlobal('fetch', …)`.

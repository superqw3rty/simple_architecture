# Backend

Свой сервер в `server/` (D-58): прокси к TVmaze с кешем, поиск с пагинацией и фильтром по жанрам, избранное. Данные хранятся в памяти процесса, базы нет. Тот же Simple Architecture: тонкий транспорт, бизнес-логика в тасках.

## Стек

- **Node 24, TypeScript без сборки**: Node сам снимает типы (type stripping). Отсюда ограничения: импорты с расширением `.ts`, `import type` для типов, только стираемый синтаксис (`erasableSyntaxOnly`: без `enum`, `namespace`, parameter properties).
- **Импорты (D-63)**: из другой папки — алиасы `#server/*` и `#shared` (поле `"imports"` в `package.json`), рядом — `./` и один `../`. Цепочки `../../`, `@/`, `@shared`, `@server` запрещены. Почему: Node понимает только `"imports"`, а `paths` из tsconfig и алиасы Vite не читает — с ними сервер упадёт при запуске.

```ts
// ✅ server/tasks/fetchWithCache/fetchWithCache.ts
import { requestTvMaze } from '#server/tvmaze/request.ts'; // другая папка — алиас
import { getOrLoad } from '../getOrLoad/index.ts'; // соседняя таска — один ../

// ✅ server/tvmaze/mapShow.ts
import type { Show, ShowStatus } from '#shared';
import { stripHtml } from './utils/stripHtml/index.ts'; // внутри своей папки — ./
```

❌ `import { requestTvMaze } from '@server/tvmaze/request.ts'` — tsc и Node такой модуль не найдут.
- **Hono** + `@hono/node-server`. Hono держим только в `server/app.ts` и `server/routes/`: таски о нём не знают, фреймворк заменяется переписыванием одного слоя.
- Тесты — тот же Vitest; роуты тестируются через `app.request()` без запуска порта.

## Структура и слои

```
server/
  main.ts                 # запуск: serve(app, PORT)
  app.ts                  # Hono app: cors, clientId-middleware, подключение роутов, обработка ошибок
  routes/                 # транспорт («презентер» сервера): разобрать запрос → вызвать таску → ответ и статус
    shows/  favorites/    # роут — папка: shows.ts, shows.test.ts, index.ts (D-67)
    utils/handleError/    # доменная ошибка → HTTP-статус, подключается в app.ts через app.onError
  tasks/                  # бизнес-логика: обычные функции, без Hono (tasks.md); раскладка — ниже (D-65)
    searchShows/          # searchShows.ts + utils/{filterByGenre,countGenres,paginate}/
    getOrLoad/            # механика кеша: свежая запись или load → запомнить (не знает про TVmaze)
    fetchWithCache/       # правило ДЗ: запрос к TVmaze не чаще раза в 5 минут (getOrLoad + requestTvMaze)
    addToFavorites/  removeFromFavorites/  getFavorites/
  entities/               # хранилища в памяти (Entity): данные + функции их изменения
    cache.ts              # const cache = new Map<string, CacheEntry>() (D-64)
    favorites.ts          # const favorite: Record<ClientId, Record<ShowId, Show>> = {}
  tvmaze/                 # клиент внешнего API: request, types, mapShow (D-66)
    utils/stripHtml/      # внутренние чистые помощники клиента — по папкам, как шаги таски
shared/                   # контракт API: только типы (Show, ShowsPage, FavoritesList…)
```

### Раскладка `tasks/` (D-65)

- **Таска — папка** `tasks/<taskName>/`: `<taskName>.ts`, `<taskName>.test.ts`, `index.ts` (только реэкспорт). Других файлов в корне таски нет.
- **Шаг таски — чистая функция в своей папке** `tasks/<taskName>/utils/<utilName>/`: `<utilName>.ts`, `<utilName>.test.ts`, `index.ts`. Нужен одной таске — живёт внутри неё.
- Снаружи таску и шаг импортируют через `index.ts`: `'../fetchWithCache/index.ts'`, `'./utils/paginate/index.ts'`.
- **Почему:** папка — граница единицы кода. Файл, тест и вход лежат вместе, открыв `tasks/`, видишь список use case'ов, а шаги таски видны как её внутренность. Так же устроены `src/tasks/<name>/` и `src/hooks/<name>/` на фронте. На фронте `logic/utils/` остаётся плоским (D-55): правило только для `server/`.

```
// ✅ server/tasks/searchShows/
searchShows.ts  searchShows.test.ts  index.ts
utils/paginate/  paginate.ts  paginate.test.ts  index.ts
```

В `server/tvmaze/` так же (D-66): в корне — то, что берут снаружи (`request`, `mapShow`, `types`, `constants`); внутренний чистый помощник — `tvmaze/utils/<name>/`. Маппер — не утилита: это вход слоя, которым таски переводят DTO в `Show`.

В `server/routes/` тоже (D-67): роут — папка `routes/<name>/` (`<name>.ts`, `<name>.test.ts`, `index.ts`), общий помощник транспорта — `routes/utils/<name>/`. `app.ts` импортирует их через `index.ts`.

❌ `server/tasks/searchShows/paginate.ts` рядом с таской, ❌ `server/tasks/getOrLoad.ts` файлом в корне `tasks/`. Проверяет `pnpm check:arch`.

Зависимости только вниз: `routes → tasks → entities, tvmaze`. Роут не ходит в `entities` и `tvmaze` напрямую, таска не импортирует Hono и не знает про HTTP-статусы.

```ts
// ✅ server/routes/favorites/favorites.ts — транспорт тонкий
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

- Все ответы JSON, префикс `/api`. Типы ответа описаны в `shared/` и импортируются и сервером, и фронтом (`#shared` и там, и там, D-63). Контракт меняется только вместе с типом в `shared/`.
- Модель в ответе — доменная (`Show`), без UI-строк (D-53): сырые ответы TVmaze наружу не уходят, их переводит `server/tvmaze/mapShow.ts`.
- Ошибки: `{ error: string }` со статусом. 400 — неверный запрос (пустой `q`, кривой id, нет `X-Client-Id`), 404 — шоу нет в TVmaze, 502 — TVmaze недоступен. Текст ошибки — для разработчика, пользователю его не показывают.
- Ошибку в статус переводит только `handleError` (`server/routes/utils/handleError/`, подключён в `app.ts` через `app.onError`): `NotFoundError` → 404, `UpstreamError` → 502, `HTTPException` → его статус, остальное → 500 с общим текстом и `console.error`. Нижние слои бросают доменные ошибки из `server/error.ts` (без Hono), роуты и таски не ловят их ради статуса.
- Пишущие методы идемпотентны: `PUT /api/favorites/:id` повторно не дублирует, `DELETE` отсутствующего не падает.

## Кеш (Entity `cache`)

- Хранилище — `Map` (D-64), лимит `MAX_CACHE_ENTRIES` (500): при переполнении вытесняется самая старая запись. Удаления по таймеру нет: протухшая запись лежит, пока её не перезапишут или не вытеснят.
- Ключ — источник и путь запроса: `tvmaze:/search/shows?q=murder`. Префикс источника — потому что кеш общий (`getOrLoad`), а ключи разных источников не должны пересекаться. Запись: `{ data, expiresAt }`.
- Слои: Entity `cache.ts` только хранит; `tasks/getOrLoad/` — механика «свежая запись или загрузить»; `tasks/fetchWithCache/` — правило ДЗ (TVmaze, 5 минут). Кешируются ответы TVmaze, а не наши ответы клиенту: в них `isFavorite` свой у каждого клиента.
- Свежая запись → ответ из кеша без сети. Нет записи или протухла → `load` и перезапись. Ошибка `load` не кешируется.
- Время передаётся параметром (`now = Date.now()`), чтобы тесты не ждали 5 минут.

## Избранное и клиент (D-59)

- Логина нет. Фронт один раз создаёт UUID, хранит в `localStorage` и шлёт в заголовке `X-Client-Id` с каждым запросом.
- Middleware в `app.ts` проверяет формат UUID и кладёт его в контекст. Ручки избранного без валидного заголовка отвечают 400. Поиск без заголовка работает, просто все `isFavorite: false`.
- Хранилище ограничено (лимит шоу на клиента), чтобы память не росла бесконечно. Это учебное решение без защиты: кто знает ID, видит список.

## CORS и окружение

- `PORT` (по умолчанию 3001), `CORS_ORIGIN` — origin фронта (`https://<user>.github.io`; по умолчанию `http://localhost:5173`). Без запасного значения Hono получает `origin: undefined` и падает на каждом запросе. В `allowHeaders` есть `X-Client-Id`.
- Локально фронт ходит через Vite proxy `/api` → `http://localhost:3001`, CORS не нужен.
- Скрипты: `pnpm dev` запускает параллельно `dev:client` (Vite) и `dev:server` (`node --watch`); `pnpm start` — сервер без watch (прод). Для preview в `.claude/launch.json` — отдельные конфиги `dev` и `server`.
- Деплой — `docs/homework/hw2-plan.md`, раздел «Хостинг» (D-60).

## Тесты

- Таски и шаги — юнит-тесты рядом (`cache`: лимит и вытеснение; `getOrLoad`: попадание, протухание, ошибка не кешируется; `fetchWithCache`: путь, 5 минут; `searchShows`: фильтр, страницы, счётчики жанров, `isFavorite`; избранное: идемпотентность, изоляция клиентов).
- `entities` сбрасываются между тестами функцией `reset…()` из того же файла.
- Роуты — через `app.request()`: статусы и форма ответа. TVmaze в тестах не вызывается: `vi.stubGlobal('fetch', …)`.

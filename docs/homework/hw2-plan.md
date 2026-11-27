# Неделя 2: Tasks + ДЗ-2 (backend, кеш, избранное)

**Статус (2026-11-25):** шаг 1 (правила) сделан. Шаг 2: макеты сделаны агентом в новом файле `fQvS5QfBtUC7AWGkEH9YC9` (Pro), долг D-35/D-43 закрыт; макет согласован 2026-11-25 (что где — `docs/design/figma.md`). Шаг 3: код переехал в `logic/`, проверки в `check:arch` и ESLint добавлены. Шаг 4: каркас сделан агентом по просьбе пользователя — `hono`, скрипты (`pnpm dev` = клиент + сервер), `shared/` с типами контракта, `tsconfig.server.json`, alias `#shared` (D-63), proxy, Vitest-проекты `client`/`server`, ESLint для `server/` и `shared/`, `server/main.ts` + `app.ts` с `GET /api/health`; `tvmaze/` переезжает в шаге 5. Шаг 6 (2026-11-28): фронт ходит в `/api/shows`, `src/api` разложен по папкам (D-68); 6.4–6.6 сделаны одним заходом, потому что удалить старое можно только после перевода экрана. Шаги 5–12 пользователь делает сам; правила для них — в `docs/ai/` (D-54…D-62).

## Context

Лекция 2 вводит слой **Tasks** (use cases / interactor) и папку `logic/` в компоненте. ДЗ-2: обновить AI-правила, поднять свой backend, перенести на него TVmaze, пагинацию и фильтр по жанрам, добавить кеш на 5 минут (`const cache = {}`) и избранное (`const favorite = {}`, звёздочка, toast, кнопка со счётчиком, список). Ветка сейчас `feature/docs-sync` — работу ведём в новой `feature/hw2-backend`.

---

## 1. Что говорит автор (тезисы)

1. **Бизнес-правила** — то, на чём бизнес зарабатывает или экономит. Они существуют и без программы (процент по кредиту можно считать на счётах).
2. В коде мы пишем не бизнес-правила, а **варианты использования** (use cases) — правила *конкретного приложения*: что пользователь вводит, что получает в ответ и какие шаги выполняются между этим. По сути это user story / задача в Jira.
3. В описании use case **нет технологий**: «купить товар» одинаково и на React, и на Android. Стек вторичен.
4. Use case всегда называется **глаголом** (login, buy, addUser). Каждое действие пользователя — это задача для системы, отсюда название **Tasks**.
5. Форма такая: вход → порядок действий → выход. Значит, **таска — это обычная JS-функция**. Одна таска = одна функция снаружи, внутри её можно дробить, в том числе на другие таски (`logout` вызывает `unsubscribeFromPush`).
6. С сетью таска работает **через абстракцию** (`api.logout()`), а не через fetch или сокеты напрямую.
7. **Сторы — напрямую, без посредников** (thunk, saga): `import { store }` → `store.dispatch` / `getState`. Так умеют Redux, MobX и Zustand, и это описано в их документации. Таска может быть `async` и возвращать результат, поэтому loading и error живут локально в презентере, а не в глобальном сторе.
8. **В тасках нет React.** При переезде на Angular переписываются только View и Presenter.
9. VIPER целиком: **V**iew; **I**nteractor = Tasks; **P**resenter — мост между UI и тасками («на какое событие какую таску вызвать»); **E**ntity = state-менеджер (данные + методы их обновления); **R**outer — навигация. Навигацию делаем **в презентере**: она зависит от среды (веб или мобилка), это не бизнес-логика.
10. Раскладка: `Component/logic/` хранит презентер, хуки и `tasks/`. Таска — файлом или папкой (если не влезает в 120 строк). Переиспользуемые таски лежат в глобальном `src/tasks/`, правило то же, что для `components/`.

## 2. Утилиты сейчас — это таски? В основном нет

Таска — это **действие пользователя** (глагол с его точки зрения: «найти сериалы», «добавить в избранное»). Она оркестрирует побочные эффекты (API, стор) и возвращает результат. Утилита — **чистое преобразование** без эффектов, им пользуются таски или презентеры. То, что `formatX` тоже глагол, ничего не решает: пользователь не просит «отформатировать заголовок».

| Файл | Что это | Куда пойдёт |
|---|---|---|
| `formatPageRange`, `formatResultsTitle`, `formatEmptyTitle`, `getAnnouncement`, `formatShowMeta` | форматирование для view | `logic/utils/` компонента (остаются на фронте) |
| `getPageItems`, `toViewItem`, `getGenreChips` | сборка view-модели (ChipProps, PageViewItem) | `logic/utils/` |
| `filterByGenre`, `countGenres`, `paginate` | ближе всего к бизнес-правилам, но это **шаги**, а не use case | **на backend**, внутрь таски `searchShows` |
| `mapShow`, `stripHtml`, `types/api/tvmaze` | адаптер внешнего API | на backend, в клиент TVmaze |
| `searchShows` + `showQueries` | вот это и есть use case «найти сериалы» | на backend это таска; на фронте остаётся query-фабрика |

Настоящих тасок на фронте пока нет. Первая появится с избранным: `toggleFavorite`. Так и должно быть: ДЗ про то, что бизнес-логика уезжает на backend.

## 3. От TanStack Query не отказываемся

- Автор критикует **посредников для действий** (thunk, saga): они прячут, что функцию можно `await`-ить и получить из неё результат. TanStack Query — это **Entity** для серверного состояния: кеш и стор. Его `QueryClient` взят из `query-core` и **от React не зависит**.
- **Чтение** остаётся как было: `useQuery(showQueries.page(...))`, `useQuery(favoriteQueries.list())`.
- **Запись** идёт через таски, `useMutation` не используем (это React-обёртка того же рода, что thunk). Таска `toggleFavorite(show)` — обычная `async`-функция: вызывает `@/api`, затем обновляет кеш через **импортированный синглтон `queryClient`**, тот самый «трюк со стором» из лекции. Loading и error держит презентер в своём `useState`, toast показывает он же, потому что тексты UI не живут в модели (D-53).
- API-слой меняется частично: TVmaze уходит на сервер, фронт ходит в свой `/api`, а `http.ts` учится `method`/`body`.

### Слои на фронте
```
Presenter ──▶ Task ──▶ @/api (функции addFavorite, fetchShowsPage) ──▶ http.ts ──▶ fetch
    │           └────▶ queryClient (Entity: кеш)        ▲
    └─ useQuery(фабрика) ─▶ queryFn ────────────────────┘
```
«Абстракция сети» из лекции (`api.logout()`) — это уже существующий `@/api`: обычные async-функции поверх `request()`, без классов. TanStack Query эту абстракцию не заменяет и не оборачивает: он стоит рядом с ней как стор.

```ts
// src/tasks/toggleFavorite/toggleFavorite.ts — без React
import { addFavorite, removeFavorite, favoriteQueries, showQueries, queryClient } from '@/api';

export async function toggleFavorite(show: Show): Promise<ToggleFavoriteResult> {
  const result = show.isFavorite ? await removeFavorite(show.id) : await addFavorite(show.id);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: showQueries.all() }),
    queryClient.invalidateQueries({ queryKey: favoriteQueries.all() }),
  ]);
  return result;
}
```

### Что именно TanStack Query даёт после переезда на backend
Серверный кеш **не заменяет** клиентский: первый экономит запросы к TVmaze, второй — запросы к нашему серверу и состояния UI. Query по-прежнему отвечает за:
- кеш страниц выдачи по ключу `[term, genre, page]`: вернулся на страницу 1 — она уже есть;
- отмену прошлого запроса при наборе (`signal`) и защиту от гонок, когда поздний ответ перетирает свежий;
- `isLoading` / `isError` / `refetch` для скелетона и кнопки «Повторить», retry при 5xx;
- `keepPreviousData` при листании: нет мигания скелетоном;
- **инвалидацию после звёздочки**: одним вызовом `invalidateQueries` обновляются флаг в карточке, счётчик на кнопке и список в диалоге.

Без Query всё это пришлось бы писать заново (в ДЗ-1 так и было: свой `useRequest`, D-8). Оставляем.

### TanStack Router — нужен, раз избранное живёт на странице `/favorites`
- Почему TanStack Router, а не React Router: типизированные маршруты и **search-параметры с валидацией**, и он из одной экосистемы с Query. Пакет `@tanstack/react-router`, маршруты описываем в коде, без файлового роутинга и codegen.
- **Состояние поиска переезжает в URL:** `/?q=murder&genre=Comedy&page=2`. Иначе при уходе на `/favorites` страница поиска размонтируется, и «Назад» вернёт пустой экран. Заодно ссылкой на выдачу можно поделиться. `query` в поле ввода остаётся локальным, в URL пишется уже `term` после debounce.
- **GitHub Pages** не умеет SPA-фолбэк, а превью PR лежат по подпутям, поэтому используем **hash history**: `/#/favorites`, `/#/?q=murder`. Без хаков с 404.html.
- **R из VIPER (по лекции):** навигацию вызывает только презентер (`useNavigate`, `useSearch`). Во view допустим `<Link>`, потому что это JSX. Таски про роутер ничего не знают. Описание маршрутов лежит в `src/router/`.

### Zustand — пока не нужен
- Серверные данные (выдача, избранное) по условию ДЗ живут на backend, а на клиенте их кеширует Query. Положить их ещё и в Zustand значит держать две копии и синхронизировать их вручную.
- Клиентское состояние сейчас такое: `query` / `genre` / `page` — это локальный `useState` в презентере, плюс очередь toast-ов — единственное глобальное состояние, ~30 строк своего стора на `useSyncExternalStore`.
- Zustand хорошо ложится на идею лекции (`createStore` из `zustand/vanilla` с `getState`/`setState` вне React), но `dependencies.md` запрещает state-менеджер без реальной потребности. **Когда брать:** появится второе глобальное клиентское состояние (тема, фильтры, синхронизированные с несколькими ветками, черновики форм) — тогда заменяем свой toast-стор на Zustand и фиксируем это в decisions.

## 4. Backend: варианты

Транспорт на сервере — это аналог презентера (разобрать запрос, вызвать таску, отдать статус). Бизнес-логика в тасках не зависит от выбора, поэтому фреймворк потом можно заменить, переписав один слой.

| | Плюсы | Минусы |
|---|---|---|
| **node:http** (0 зависимостей) | Видно весь HTTP без магии. Соответствует `dependencies.md`. Нативный запуск `.ts` в Node 24 | Самим писать роутер, парсинг body и query, CORS, JSON-ошибки (~80–100 строк инфраструктуры). Для тестов нужно поднимать сервер на порту 0. Валидации нет |
| **Hono** (рекомендую) | ~14 KB, без транзитивных зависимостей. API на Web-стандартах (`Request`/`Response`, как `fetch` на фронте). Тесты через `app.request()` без порта. Встроены `cors()` и `logger()`. Запускается на Node, Bun, Deno и Workers, то есть переносим между хостингами | +2 пакета (`hono`, `@hono/node-server`). Нужно освоить контекст `c`. Экосистема моложе, чем у Express и Fastify |
| **Fastify** | Зрелый и быстрый. JSON-schema валидация и сериализация, `inject()` для тестов, плагины (cors, static), логгер pino | Тяжелее, модель плагинов и инкапсуляции, декораторы, многословные дженерики в типах. Для 5 эндпоинтов избыточен |
| Express | Его все знают | Устаревшая middleware-модель, медленнее, типы отдельным пакетом. Не рекомендую |

**Выбрано: Hono** (`hono` + `@hono/node-server`, записать в реестр `dependencies.md`).

## 5. Хостинг — Oracle Cloud Always Free (выбрано)

VM с постоянно живущим процессом: память не обнуляется, подходит под in-memory `cache` и `favorite`. Здесь только краткие шаги, подробности разберём в отдельной сессии, когда будешь настраивать машину.

1. Создать инстанс (Ubuntu; Ampere A1, а если пишет «Out of capacity» — AMD micro), добавить свой SSH-ключ.
2. Открыть порты 80 и 443 в двух местах: Security List сети (VCN) и `iptables` на самой VM.
3. Поставить Node 24 и pnpm, склонировать репозиторий.
4. Запустить API как systemd-сервис (`PORT`, `CORS_ORIGIN`, автоперезапуск).
5. Поставить Caddy как reverse proxy с автоматическим HTTPS. Нужен домен, без своего подойдёт `<ip>.sslip.io`. HTTPS обязателен: со страницы на github.io браузер не пустит запросы на `http://`.
6. Деплой: GitHub Actions по SSH (`git pull`, `pnpm install`, перезапуск сервиса). Ключ и хост храним в secrets.

Важно: Oracle может забрать Always Free-машину, если она неделю простаивает.

**Схема:** фронт остаётся на GitHub Pages (вместе с превью PR), API живёт на `https://api.<домен>`. `VITE_API_URL` подставляется при сборке в workflow Pages. Локально Vite проксирует `/api` → `localhost:3001`.

## 6. Раскладка `logic/` (твоё решение, с моими уточнениями)

```
ShowCard/
  index.ts  ShowCard.tsx  ShowCard.module.scss  constants.ts  types.ts
  CardImage/ FavoriteToggle/ ...          # дочерние компоненты
  logic/
    useShowCard.ts                        # презентер
    hooks/useSomething.ts + .test.ts      # доп. хуки презентера
    utils/formatShowMeta.ts + .test.ts    # чистые функции для view
    tasks/doSomething.ts + .test.ts       # таски компонента (или папка таски)
src/tasks/toggleFavorite/                 # общие таски (как src/components)
```

Решено (D-55): презентер лежит в корне `logic/`, вспомогательные хуки — в `hooks/`, форматтеры — в `utils/` (бывший D-38).

---

## 7. План работ (коммиты ≤ 25 файлов, D-47)

### Шаг 1. Правила (ДЗ п.1) — skill `add-rule`
- Новый `docs/ai/tasks.md`: что такое таска, глагол, без React, сторы напрямую, вход/выход, где лежит, тесты, связь с презентером и навигацией.
- Новый `docs/ai/backend.md`: структура `server/`, роуты → таски → entities (кеш, избранное) → клиент TVmaze, коды ошибок.
- Обновить `architecture.md` (слои VIPER, стрелка зависимостей View → Presenter → Tasks → api/entities), `structure.md` (`logic/`, `src/tasks/`, `server/`, `shared/`), `data-fetching.md` (запись через таски, `queryClient`-синглтон, без `useMutation`), `api-layer.md`, индекс в `AGENTS.md`.
- `decisions.md`: D-54 Tasks, D-55 `logic/{hooks,utils,tasks}` (заменяет D-38), D-56 запись без `useMutation`, D-57 backend и хостинг, D-58 toast. D-10 пометить как заменённое.
- Обновить skills `new-component` и `arch-review` под `logic/`.
- `docs/homework/hw2.md` — чек-лист ДЗ (по нему потом проверяем).

### Шаг 2. Figma: макеты нового функционала (агент через Figma MCP) — до вёрстки
- **Почему так рано:** вёрстка звезды, toast-уведомлений, верхней панели и страницы `/favorites` будет опираться на макет. Для новых элементов Figma — источник (D-34 дополняем записью в `decisions.md`). Переезд на `logic/` (3), backend (4, 5, 7) и перевод фронта на свой API (6) от макета не зависят и идут параллельно.
- **Кто:** отдельный субагент с Figma MCP. Файл `fQvS5QfBtUC7AWGkEH9YC9` (до 2026-11-25 — `o9svDdIlDyX4q4rzkUwHMn` на Starter). Перед `use_figma` — `create_session` и skill `figma-use`.
- **Лимит Starter-тарифа:** вызовов мало, 24.11 квота уже была исчерпана. Поэтому всё делается одним-двумя скриптами `use_figma`, скриншотов минимум, и этим же заходом закрывается долг из `docs/design/figma.md` (D-35: шрифты, радиусы, размеры; D-43: цвета). Если квота кончилась, тот же скрипт оформляем локальным плагином (manifest.json + code.js) и запускаешь его ты.
- **Что добавить:**
  - компонент `FavoriteToggle`: варианты `State=Off/On/Pending`, hover и focus;
  - `ShowCard` (`Default` / `Compact`) со звездой;
  - компонент `Toast`: «добавлено», «удалено», ошибка;
  - верхняя панель `AppLayout`: логотип и ссылка «★ N», активное состояние на `/favorites`;
  - экраны **Favorites**: List / Empty / Loading / Error на 1440, 1200, 768, 375;
  - на существующих экранах Start/Results — новая панель, звёзды в карточках и счётчик.
- Всё строится на существующих переменных `Tokens`. Если понадобится новый токен, он заводится в Figma с code syntax и потом зеркально в `tokens.scss`.
- **Контрольная точка:** ты смотришь макет и согласовываешь его (или присылаешь правки), только потом начинаются шаги 8–9. После согласования обновить `docs/design/figma.md` («Что в файле», закрытый долг) и сохранить в память расход квоты.

### Шаг 3. Переезд фронта на `logic/` (только перемещение, без изменения поведения)
- Каждый `useX.ts` → `logic/useX.ts`, доп. хуки → `logic/hooks/`, `utils/` → `logic/utils/`. Делим на коммиты по веткам дерева (Header, MainContent/Results, components).
- `scripts/check-architecture.mjs`: в корне папки компонента допустимы только `index.ts`, `X.tsx`, `*.scss`, `constants.ts`, `types.ts` и папки-компоненты. Хуки только в `logic/`, `logic/hooks/` содержит `use*`, `logic/tasks/` без React-импортов.
- `eslint.config.js`: запрет `react` и `@tanstack/react-query` в `**/tasks/**`. Проверить пути исключений.

### Шаг 4. Каркас backend
- `server/` в корне. Запуск `node --watch server/main.ts` (type stripping). `tsconfig.server.json` с `erasableSyntaxOnly`, `allowImportingTsExtensions`, `verbatimModuleSyntax` и ссылкой из `tsconfig.json`, чтобы его покрывал `tsc -b`.
- `shared/` — только типы контракта (`Show`, `ShowsPage`, `GenreCount`, `FavoritesList`). Фронт и сервер импортируют через `#shared` (D-63). `src/types/show.ts` реэкспортирует.
- Скрипты `dev:server` и `start`, Vite proxy `/api`, `.claude/launch.json` (+ конфиг `server`), Vitest `include` дополнить `server/**`, ESLint — node globals для `server/`.
- Структура:
  ```
  server/
    main.ts  app.ts                         # Hono app, cors, роуты подключаются тут
    routes/shows/  routes/favorites/  routes/utils/handleError/   # «презентер»: парсинг → таска → статус (D-67)
    tasks/searchShows/  searchShows.ts + utils/{filterByGenre,countGenres,paginate}/   # раскладка D-65
    tasks/addToFavorites/  removeFromFavorites/  getFavorites/
    tasks/getOrLoad/  tasks/fetchWithCache/  # кеш 5 мин
    entities/cache.ts       # Map с лимитом 500 (D-64)
    entities/favorites.ts   # const favorite: Record<number, Show> = {}
    tvmaze/{request.ts, mapShow.ts, stripHtml.ts, types.ts}   # переезжают из src/
  ```

### Шаг 5. Backend: поиск, кеш, пагинация, жанры
- `GET /api/shows?q=&genre=&page=` → `{ items, page, totalPages, total, pageSize: 3, genres: [{ name, count }], totalAll }`. Счётчики жанров считаются по **всей** выдаче до фильтра, чтобы чипсы вели себя как сейчас. У `items` есть поле `isFavorite`.
- `fetchWithCache(url, now = Date.now())`: если запись свежее 5 минут — отдаёт её, иначе идёт в TVmaze и перезаписывает. Тесты с подменой `now`: попадание в кеш, протухание, ошибка не кешируется.
- Валидация `q`/`page`/`genre` в роуте: 400 при пустом `q`, нормализация `page`.

### Шаг 6. Фронт на свой API (без нового UI)
- `src/api/core/http/`: `method`, JSON `body`, базовый URL из `import.meta.env.VITE_API_URL ?? ''`.
- `src/api/tvmaze/` → `src/api/shows/` (`fetchShowsPage`, `showQueries.page({ term, genre, page })` с `placeholderData: keepPreviousData`). Удалить с фронта `mapShow`, `stripHtml`, `types/api/tvmaze`, `utils/paginate`, `filterByGenre`, `countGenres` вместе с тестами (тесты уехали на сервер).
- `src/api/core/queryClient/`: `export const queryClient = createQueryClient()`, `QueryProvider` использует синглтон.
- Состояние `genre`/`page` поднимается туда, где делается запрос (`MainContent/logic/`), при смене `term` сбрасывается. `Results` получает готовые `items`, `chips`, `page`, `totalPages`. `getGenreChips` строит чипсы из `genres` сервера.

### Шаг 7. Backend: избранное по ID браузера
- Каждый запрос к `/api` несёт заголовок `X-Client-Id` (UUID). Middleware проверяет формат: без него или при кривом значении ручки избранного отвечают 400. В CORS добавляем `allowHeaders: ['X-Client-Id']`.
- Entity: `const favorite: Record<ClientId, Record<ShowId, Show>> = {}`, лимит — например, 200 шоу на клиента, чтобы память не росла бесконечно.
- `GET /api/favorites` → `{ items: Show[], count }`. `PUT /api/favorites/:id` идемпотентно: шоу берётся через `fetchWithCache` по `/shows/:id`. `DELETE /api/favorites/:id` тоже идемпотентно. Оба возвращают `{ isFavorite, count }`.
- `searchShows` помечает `isFavorite` по избранному конкретного клиента. Тесты: у двух клиентов списки не пересекаются.

### Шаг 8. Роутер и каркас страниц (по макету)
- `@tanstack/react-router` + запись в реестр `dependencies.md`. `src/router/`: корневой маршрут, `/` с валидацией search `{ q?, genre?, page? }`, `/favorites`, hash history.
- `src/AppLayout/`: верхняя панель (Logo, ссылка «★ N» на `/favorites`), `<Outlet />`, Toaster.
- Страницы: `src/ShowsExplorer/` (маршрут `/`; `term`/`genre`/`page` читаются из URL через `useSearch` в презентере, пишутся через `navigate`) и `src/FavoritesPage/` (маршрут `/favorites`).
- `ShowCard` нужна обеим страницам, поэтому переезжает в `src/components/ShowCard/` (правило переиспользования, D-42).

### Шаг 9. Фронт: избранное (по макету)
- `src/api/core/clientId/`: `getClientId()` создаёт `crypto.randomUUID()` один раз и хранит его в `localStorage`. `request()` добавляет заголовок ко всем запросам `/api`.
- `src/api/favorites/` — папка на модуль (D-68): `addFavorite/`, `removeFavorite/`, `fetchFavorites/`, `favoriteQueries/` (`favoriteQueries.list()`).
- **Таска** `src/tasks/toggleFavorite/toggleFavorite.ts` (общая: звезда в выдаче и на странице избранного). Вызывает API, затем `queryClient.invalidateQueries` для `showQueries.all()` и `favoriteQueries.all()`, возвращает `{ isFavorite }`. Тест с замоканным `@/api`.
- `src/components/FavoriteToggle/`: звезда (`StarIcon`), `aria-pressed`, презентер `logic/useFavoriteToggle.ts` с локальным `isPending` и вызовом таски, по результату — `showToast(...)`.
- Toast: свой стор `src/stores/toasts/` (модульный синглтон + `subscribe`, по лекции это Entity) и хук `@/hooks/useToasts` (`useSyncExternalStore`). Компонент `src/components/Toaster/` с `role="status"` и автоскрытием.
- `FavoritesPage`: список карточек со звездой «убрать», пустое состояние со ссылкой на поиск, скелетон и ошибка с повтором. Вёрстка по макету из шага 2.

### Шаг 10. Проверка функционала (я, потом ты)
- **Я:** `pnpm check`, затем в preview прохожу сценарии из раздела Verification на 1440, 768 и 375. Для каждого нового экрана сверяю вёрстку с макетом (`get_screenshot` по одному кадру на экран, чтобы беречь квоту) и прикладываю скриншоты.
- **Ты:** ручной прогон по чек-листу `docs/homework/hw2.md` (он появится в шаге 1), с клавиатуры и в двух браузерах. Расхождения с макетом решаем по D-34: исправляем код или макет.

### Шаг 11. Деплой
- `deploy/Caddyfile`, `deploy/tv-shows-api.service` (systemd), `deploy/README.md` с первичной настройкой VM (Node 24, порты в VCN и iptables, Caddy, sslip.io или свой домен).
- Workflow: job `deploy-api` по SSH на push в `main`; job Pages получает `VITE_API_URL` из `vars`. Секреты (`SSH_HOST`, `SSH_KEY`) заводишь ты.

### Шаг 12. Сдача
- Отметить чек-лист `docs/homework/hw2.md`. Skill `arch-review`.

## Verification

- `pnpm check` зелёный (format, typecheck фронта и сервера, lint, check:arch, Vitest фронта и сервера).
- Тесты сервера: кеш (hit, expire, ошибка), `searchShows` (фильтр, пагинация, счётчики жанров, `isFavorite`), избранное (add/remove идемпотентны, счётчик).
- Ручная проверка через preview (`dev` + `server`): поиск `Murder` → 10 шоу, 3 на страницу; `Comedy` → 1 (на 2026-11-27, выдача TVmaze меняется); повторный поиск в пределах 5 минут не идёт в TVmaze (тест `routes/shows/shows.test.ts`); звезда → toast и счётчик +1; переход на `/#/favorites` и обратно кнопкой «Назад» возвращает ту же выдачу (q, жанр, страница); удаление на странице избранного работает; во втором профиле браузера своё, пустое избранное; ошибка сервера → состояние ошибки с повтором.
- После деплоя: `curl https://api.<домен>/api/shows?q=murder` отвечает JSON с валидным сертификатом; фронт на Pages ходит в API без ошибок CORS и mixed content.

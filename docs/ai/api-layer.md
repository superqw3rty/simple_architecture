# API-слой

Всё общение фронта с сервером живёт в `src/api/`. Слой ничего не знает о React, компонентах и тасках — это обычные асинхронные функции, которые можно вызвать из теста, таски или Node. Это и есть «абстракция сети» из лекции: таска вызывает `addFavorite(id)` и не знает, HTTP там или сокет.

Фронт ходит только в **свой** backend (`/api`, D-58). TVmaze, его DTO и маппер живут на сервере (`backend.md`): фронт получает готовую модель и ничего не маппит.

## Структура: папка на модуль (D-68)

```
src/api/
  index.ts                  # единственный вход: import { showQueries, queryClient } from '@/api'
  core/                     # инфраструктура, не знает про ресурсы; своего index.ts нет
    http/                   # http.ts, http.test.ts, index.ts — request(): единственное место с fetch
    ApiError/               # ApiError, isAbortError()
    config/                 # API_URL из VITE_API_URL
    queryClient/            # createQueryClient() + синглтон queryClient (D-56)
    clientId/               # getClientId(): UUID браузера (D-59) — шаг 9
  shows/                    # один ресурс нашего API = одна папка
    fetchShowsPage/         # fetchShowsPage.ts, fetchShowsPage.test.ts, index.ts
    showQueries/            # фабрика запросов ресурса
    index.ts                # наружу: эндпоинты и фабрика ресурса
  favorites/                # шаг 9: addFavorite/, removeFavorite/, fetchFavorites/, favoriteQueries/, index.ts
shared/                     # контракт API: типы ответов, общие с сервером (#shared)
```

- **Модуль = папка** `<name>/` с `<name>.ts`, `<name>.test.ts` и `index.ts` (только реэкспорт). Других файлов и подпапок в ней нет. Так же устроен сервер (D-65…D-67).
- В корне `src/api/` — только `index.ts`, `core/` и папки ресурсов. В `core/` — только папки модулей, в ресурсе — папки модулей и `index.ts`.
- Внутри `src/api` модули импортируют друг друга через папку (`'../../core/http'`), а не через файл.
- **Снаружи — только `@/api`.** Пути вида `@/api/core/...` и `@/api/shows` вне слоя запрещены: что торчит наружу, решает `src/api/index.ts`.

**Почему:** решение пользователя — плоский `src/api/` с тестами рядом стал нечитаемым. Папка — граница модуля: файл, тест и вход вместе, в свёрнутом дереве видны только имена.

## Правила

1. **`fetch` только в `core/http`.** В остальном `src/` он запрещён ESLint-правилом. Заголовки, базовая обработка ошибок, будущая авторизация — всё в одном месте.
2. **Эндпоинт передаёт путь** (`'/api/shows'`), а `request()` ставит перед ним `API_URL`. Локально он пустой, и Vite проксирует `/api` на `pnpm dev:server`. Абсолютные URL уходят как есть.
3. **Каждая функция эндпоинта принимает `signal`** последним аргументом и пробрасывает его в `request` — без этого не работает отмена.
4. **Тип ответа — из контракта `#shared`** (`ShowsPage`, `FavoritesList`), маппинга на фронте нет. Компоненты берут те же типы через `@/types/show`. Изменился ответ — меняется `shared/`, и `tsc` покажет оба конца.
5. **Ошибки — всегда `ApiError`** с понятным пользователю `message` и `status`. `AbortError` пробрасывается как есть — TanStack Query распознаёт отмену сам.
6. **Чтение из React — только через фабрику запросов** и `useQuery` в хуке (см. `data-fetching.md`). **Запись — только из таски** (`tasks.md`, D-56). View, презентеры напрямую и чистые функции API не вызывают.
7. **API-слой не импортирует** `react`, компоненты, хуки, таски, сторы. Из `@tanstack/react-query` — только `QueryClient` и `queryOptions` (обычные функции без React; `keepPreviousData` тоже нельзя). Зависимость направлена только внутрь: `hooks → api → types`. Проверяет ESLint.
8. URL и параметры не склеиваются руками — параметры передаются в `request(url, { params })`; `undefined` в URL не попадает.
9. **Фабрика запросов** `<entity>Queries/` — объект с методами: уровни ключа (`all()`, `pages()`) и `queryOptions` на каждый эндпоинт. `queryFn` пробрасывает `signal` из контекста запроса.

## Пример эндпоинта и фабрики

```ts
// src/api/shows/fetchShowsPage/fetchShowsPage.ts (без JSDoc)
export interface ShowsPageParams {
  term: string;
  genre: string | null;
  page: number;
}

export function fetchShowsPage(
  { term, genre, page }: ShowsPageParams,
  signal?: AbortSignal,
): Promise<ShowsPage> {
  return request<ShowsPage>('/api/shows', {
    params: { q: term, genre: genre ?? undefined, page },
    signal,
  });
}

// src/api/shows/showQueries/showQueries.ts (без JSDoc и типов ключей)
export const showQueries = {
  all: (): ShowsKey => ['shows'] as const,

  pages: (): ShowsPagesKey => [...showQueries.all(), 'page'] as const,

  page: ({ term, genre, page }: ShowsPageParams): ShowsPageOptions =>
    queryOptions({
      queryKey: [...showQueries.pages(), { term, genre, page }] as const,
      queryFn: ({ signal }) => fetchShowsPage({ term, genre, page }, signal),
      enabled: term.length > 0,
      staleTime: PAGE_STALE_TIME,
      // Прошлая страница того же term остаётся на экране, пока грузится следующая.
      placeholderData: (previous, previousQuery) =>
        previousQuery?.queryKey[2].term === term ? previous : undefined,
    }),
};
```

## Модели

- Модель описывает то, что нужно приложению, а не всё, что отдаёт сервер. Не нужное сейчас поле не добавляем.
- Поля модели — в `camelCase`, без `null`-сюрпризов там, где можно дать значение по умолчанию.
- Модель не содержит UI-строк («No rating», «Untitled») — их готовит презентер. Нет значения — `null` или пустая строка (D-53).

## Тесты

- Функции эндпоинтов тестируются с `vi.stubGlobal('fetch', ...)`: правильный путь и параметры, `signal`, ответ как есть, ошибка → `ApiError`.
- Фабрики запросов: форма ключа, `enabled`, `placeholderData` и — через `new QueryClient().fetchQuery(...)` — что `signal` дошёл до `fetch`.
- Как TanStack Query применяет опции фабрики (placeholder при листании, сброс при новом `term`), проверяет тест фичевого хука через `renderHook` (`useShowsSearch.test.ts`): в `src/api` React и `QueryObserver` запрещены.
- Мапперы и «дырявые» DTO — на сервере (`backend.md`).

## Рантайм-валидация

Схемы (zod и т.п.) пока не используем: ответ приходит от нашего же сервера, типы общие через `shared/`. Вернуться к вопросу, если появятся ответы сложной формы или недоверенные источники — решение фиксируется в `decisions.md`.

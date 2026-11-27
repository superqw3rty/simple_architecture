# API-слой

Всё общение фронта с сервером живёт в `src/api/`. Слой ничего не знает о React, компонентах и тасках — это обычные асинхронные функции, которые можно вызвать из теста, таски или Node. Это и есть «абстракция сети» из лекции: таска вызывает `addFavorite(id)` и не знает, HTTP там или сокет.

**Целевая схема (ДЗ-2, D-58):** фронт ходит только в **свой** backend (`/api`). TVmaze, его DTO и маппер переезжают на сервер (`backend.md`). До шага 6 `docs/homework/hw2-plan.md` в коде ещё живёт `src/api/tvmaze/` — примеры ниже описывают его.

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
shared/                     # типы ответов нашего API, общие с сервером
```

- **Модуль = папка** `<name>/` с `<name>.ts`, `<name>.test.ts` и `index.ts` (только реэкспорт). Других файлов и подпапок в ней нет. Так же устроен сервер (D-65…D-67).
- В корне `src/api/` — только `index.ts`, `core/` и папки ресурсов. В `core/` — только папки модулей, в ресурсе — папки модулей и `index.ts`.
- Внутри `src/api` модули импортируют друг друга через папку (`'../../core/http'`), а не через файл.
- **Снаружи — только `@/api`.** Пути вида `@/api/core/...` и `@/api/shows` вне слоя запрещены: что торчит наружу, решает `src/api/index.ts`.

**Почему:** решение пользователя — плоский `src/api/` с тестами рядом стал нечитаемым. Папка — граница модуля: файл, тест и вход вместе, в свёрнутом дереве видны только имена.

`src/api/tvmaze/` — старый клиент, лежит плоско и импортируется как `@/api/tvmaze` до шага 6.4 `docs/homework/hw2-plan.md`, потом удаляется. Его DTO — `src/types/api/tvmaze.ts`.

Типы ответов (DTO) описывают ответ **полностью и честно**: все поля, которые отдаёт сервер, с `| null` везде, где сервер может вернуть `null`. Проверяй форму на реальном ответе, а не по догадке. Имена типов — с префиксом сервиса (`TvMaze*`), чтобы не путать с доменными.

## Правила

1. **`fetch` только в `core/http`.** В остальном `src/` он запрещён ESLint-правилом. Заголовки, базовая обработка ошибок, будущая авторизация — всё в одном месте.
2. **Каждая функция эндпоинта принимает `signal`** последним аргументом и пробрасывает его в `request` — без этого не работает отмена.
3. **Наружу — только доменные модели.** Типы из `@/types/api` используются только внутри `src/api` и не попадают в хуки и компоненты (ESLint, D-52). Сервер переименовал поле — меняется один маппер.
4. **Маппер терпим к данным**: любое поле может прийти `null` или отсутствовать. Маппер подставляет значения по умолчанию (`genres ?? []`, `image?.medium ?? null`), чистит HTML (`stripHtml`), приводит форматы (год из даты).
5. **Ошибки — всегда `ApiError`** с понятным пользователю `message` и `status`. `AbortError` пробрасывается как есть — TanStack Query распознаёт отмену сам.
6. **Чтение из React — только через фабрику запросов** и `useQuery` в хуке (см. `data-fetching.md`). **Запись — только из таски** (`tasks.md`, D-56). View, презентеры напрямую и чистые функции API не вызывают.
7. **API-слой не импортирует** `react`, компоненты, хуки, таски, сторы. Из `@tanstack/react-query` — только `QueryClient` и `queryOptions` (обычные функции без React). Зависимость направлена только внутрь: `hooks → api → types`. Проверяет ESLint.
8. URL и параметры не склеиваются руками — параметры передаются в `request(url, { params })`.
9. **Фабрика запросов** `<entity>Queries/` — объект с методами: уровни ключа (`all()`, `searches()`) и `queryOptions` на каждый эндпоинт. `queryFn` пробрасывает `signal` из контекста запроса.

## Пример эндпоинта и фабрики

```ts
// src/api/tvmaze/searchShows.ts
import type { TvMazeSearchResponse } from '@/types/api/tvmaze';
import type { Show } from '@/types/show';
import { request } from '../http';
import { BASE_URL } from './config';
import { mapShow } from './mapShow';

export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  const results = await request<TvMazeSearchResponse>(`${BASE_URL}/search/shows`, {
    params: { q: query },
    signal,
  });

  return results.map((result) => mapShow(result.show));
}

// src/api/tvmaze/showQueries.ts (без JSDoc)
const SEARCH_STALE_TIME = 5 * 60_000;

type ShowsKey = readonly ['shows'];
type ShowsSearchesKey = readonly [...ShowsKey, 'search'];
type ShowsSearchKey = readonly [...ShowsSearchesKey, string];
type ShowsSearchOptions = ReturnType<typeof queryOptions<Show[], Error, Show[], ShowsSearchKey>>;

export const showQueries = {
  all: (): ShowsKey => ['shows'] as const,

  searches: (): ShowsSearchesKey => [...showQueries.all(), 'search'] as const,

  search: (term: string): ShowsSearchOptions =>
    queryOptions({
      queryKey: [...showQueries.searches(), term] as const,
      queryFn: ({ signal }) => searchShows(term, signal),
      enabled: term.length > 0,
      staleTime: SEARCH_STALE_TIME,
    }),
};
```

## Модели

- Модель описывает то, что нужно приложению, а не всё, что отдаёт сервер. Не нужное сейчас поле не добавляем.
- Поля модели — в `camelCase`, без `null`-сюрпризов там, где можно дать значение по умолчанию.
- Модель не содержит UI-строк («No rating», «Untitled») — их готовит презентер. Нет значения — `null` или пустая строка (D-53).

## Тесты

- Мапперы — обязательные юнит-тесты, включая «дырявый» DTO.
- Функции эндпоинтов тестируются с `vi.stubGlobal('fetch', ...)`: правильный URL и параметры, маппинг ответа.
- Фабрики запросов: форма ключа, `enabled` и — через `new QueryClient().fetchQuery(...)` — что `signal` дошёл до `fetch`.

## Рантайм-валидация

Схемы (zod и т.п.) пока не используем: API публичный и стабильный, маппер защищён от `null`. Вернуться к вопросу, если появятся ответы сложной формы или недоверенные источники — решение фиксируется в `decisions.md`.

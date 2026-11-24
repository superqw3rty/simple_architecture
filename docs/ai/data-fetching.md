# Загрузка данных

Запросы из React идут через TanStack Query (`@tanstack/react-query` v5): кэш, дедупликация, отмена, повторы. Своих механизмов запросов (кэшей, `useEffect` + `fetch`, ручных `AbortController`) не пишем — D-22.

## Из чего состоит запрос

1. **Функция эндпоинта** в `src/api/<service>/` принимает `signal` и возвращает доменную модель (`api-layer.md`).
2. **Фабрика запросов** `src/api/<service>/<entity>Queries.ts` — единственное место, где собираются `queryKey`, `queryFn` (с пробросом `signal`), `enabled` и `staleTime` через `queryOptions()`.
3. **Фичевый хук** рядом с презентером вызывает `useQuery(showQueries.search(term))`. Презентер переводит результат в флаги для view; view про запросы не знает.

```ts
// src/ShowsExplorer/useShowsExplorer.ts — debounce до ключа, рядом с решением о раскладке (D-36);
// пустое поле сбрасывает term сразу, без ожидания
const trimmed = query.trim();
const debounced = useDebouncedValue(trimmed, trimmed ? SEARCH_DEBOUNCE_MS : 0);
const term = trimmed ? debounced : '';

// src/ShowsExplorer/MainContent/useShowsSearch.ts
export function useShowsSearch(term: string): UseShowsSearchResult {
  const search = useQuery(showQueries.search(term));

  return { shows: search.data ?? NO_SHOWS, isLoading: search.isLoading /* … */ };
}
```

✅ `useQuery(showQueries.search(term))`
❌ `useQuery({ queryKey: ['shows', term], queryFn: () => searchShows(term) })` — ключ собран руками, `signal` потерян, отмена не работает.

**Почему фабрика:** ключ и функция запроса всегда меняются вместе. Если их собирает каждая фича, рано или поздно ключ разойдётся с параметрами (чужие данные из кэша) или забудется `signal`.

## Ключи

- Иерархия `[сущность, действие, ...параметры]`: `['shows', 'search', 'batman']`. Уровни отдаются методами фабрики: `showQueries.all()`, `showQueries.searches()`.
- Всё, от чего зависит ответ, — в ключе. То, что не влияет на ответ (страница клиентской пагинации, выбранный жанр), — не в ключе.
- Инвалидация — по префиксу из фабрики: `queryClient.invalidateQueries({ queryKey: showQueries.all() })`.

## Статусы v5 → UI

| Состояние экрана | Условие в `useQuery` |
|---|---|
| начальное (запрос выключен) | `status === 'pending' && fetchStatus === 'idle'` (или `!enabled`) |
| первая загрузка → скелетоны | `isLoading` (= `isPending && isFetching`) |
| ошибка с повтором | `isError`, кнопка → `refetch()`; текст — константы экрана, не `error.message` (D-53) |
| данные / «ничего не найдено» | `isSuccess`, `data.length` |
| фоновое обновление | `isFetching && isSuccess` — старые данные остаются на экране |

`isPending` ≠ «идёт загрузка»: выключенный запрос тоже `pending`. Для скелетонов — только `isLoading`.

**Повтор после ошибки, когда данных нет:** `refetch()` возвращает запрос в `pending`. Пока он идёт, `isLoading === true`, а `isError === false`, поэтому на экране скелетон, а не ошибка. Флаг вида «ошибка + идёт повтор» (`isError && isFetching`) в этом случае никогда не станет `true`. Если повтор должен показываться иначе, это отдельное решение, и оно проверяется тестом (`useShowsSearch.test.ts`).

**Поведение библиотеки, на которое опирается код, подтверждается тестом.** Утверждение из памяти о том, как ведёт себя TanStack Query, в комментарий не пишется. Сначала — тест или ссылка на документацию.

Презентер переводит это в `isLoading`, `isEmpty`, `hasError`, `onRetry` — view не сравнивает строки статусов.

## Клиент

`createQueryClient()` в `src/api/queryClient.ts`, провайдер — `src/QueryProvider` в `main.tsx`.

- Повторы: сетевая ошибка и 5xx — до 2 повторов с backoff, 4xx — без повторов (`shouldRetry`).
- `refetchOnWindowFocus: false`. `staleTime` задаётся в фабрике для каждого запроса (поиск — 5 минут).
- Кэш живёт до перезагрузки страницы; персистентность не подключаем, пока нет требования.

## Обязательный UX запросов

- **Debounce** пользовательского ввода (`useDebouncedValue`, 300–500 мс) **до** ключа запроса.
- **Отмена**: при смене ключа TanStack отменяет предыдущий запрос через `signal`, если он проброшен до `fetch` (фабрика это гарантирует). Ручные `AbortController` в фичах запрещены.
- **Гонки** решает TanStack: каждый ключ — своя запись в кэше, поздний ответ не попадёт в чужой ключ.
- **Пустой ввод** → `enabled: false`, в сеть не идём.
- **Все четыре состояния** имеют UI: начальное, загрузка, ошибка с повтором, «ничего не найдено».

## Чего не делать

- Не импортировать `useQuery`/`useQueryClient` во view (ESLint) и не передавать результат `useQuery` во view целиком — только готовые поля.
- Не собирать `queryKey` и `queryFn` вне фабрики в `src/api`.
- Не копировать `data` в `useState` и не синхронизировать через `useEffect` — производные данные считаются при рендере.
- Не вызывать `fetch` и функции эндпоинтов из `useEffect`.
- Не глотать ошибки: `catch` без показа пользователю запрещён.

## Когда что подключать

- `useMutation` + `invalidateQueries` по ключу фабрики — когда появятся изменения данных.
- `placeholderData: keepPreviousData` — если понадобится серверная пагинация без мигания.
- `@tanstack/react-query-devtools` — по запросу, через `dependencies.md`.

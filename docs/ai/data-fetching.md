# Загрузка данных

Чтение данных из React идёт через TanStack Query (`@tanstack/react-query` v5): кэш, дедупликация, отмена, повторы. Своих механизмов запросов (кэшей, `useEffect` + `fetch`, ручных `AbortController`) не пишем — D-22. Кэш TanStack Query — это **Entity** для серверных данных; изменения данных делают таски (D-56, раздел ниже).

## Из чего состоит запрос

1. **Функция эндпоинта** в `src/api/<resource>/<name>/` принимает `signal` и возвращает доменную модель (`api-layer.md`).
2. **Фабрика запросов** `src/api/<resource>/<entity>Queries/` — единственное место, где собираются `queryKey`, `queryFn` (с пробросом `signal`), `enabled` и `staleTime` через `queryOptions()`.
3. **Фичевый хук** в `logic/hooks/` компонента вызывает `useQuery(showQueries.page(params))`. Презентер переводит результат в флаги для view; view про запросы не знает.

```ts
// src/ShowsExplorer/useShowsExplorer.ts — debounce до ключа, рядом с решением о раскладке (D-36);
// пустое поле сбрасывает term сразу, без ожидания
const trimmed = query.trim();
const debounced = useDebouncedValue(trimmed, trimmed ? SEARCH_DEBOUNCE_MS : 0);
const term = trimmed ? debounced : '';

// src/ShowsExplorer/MainContent/logic/hooks/useShowsSearch.ts
export function useShowsSearch(term: string): UseShowsSearchResult {
  const [state, setState] = useState<ShowsPageParams>({ term, ...FIRST_PAGE });
  // Новый term начинает со всех жанров и первой страницы — при рендере, не в эффекте.
  const params = state.term === term ? state : { term, ...FIRST_PAGE };
  const search = useQuery(showQueries.page(params));

  return { results: search.data ?? null, isLoading: search.isLoading /* … */ };
}
```

✅ `useQuery(showQueries.page({ term, genre, page }))`
❌ `useQuery({ queryKey: ['shows', term], queryFn: () => fetchShowsPage({ term, genre, page }) })` — ключ собран руками, `signal` потерян, отмена не работает.

**Почему фабрика:** ключ и функция запроса всегда меняются вместе. Если их собирает каждая фича, рано или поздно ключ разойдётся с параметрами (чужие данные из кэша) или забудется `signal`.

## Ключи

- Иерархия `[сущность, действие, ...параметры]`: `['shows', 'page', { term, genre, page }]`. Уровни отдаются методами фабрики: `showQueries.all()`, `showQueries.pages()`.
- Всё, от чего зависит ответ, — в ключе. Пагинация и жанр считаются на сервере (D-58), поэтому они в ключе: `['shows', 'page', { term, genre, page }]`. То, что не влияет на ответ (открыт ли диалог, текст поля до debounce), — не в ключе.
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

`createQueryClient()` в `src/api/core/queryClient/` создаёт **один модульный синглтон** `export const queryClient`, его же отдаёт `src/QueryProvider` (D-56). Синглтон нужен таскам: они импортируют кеш напрямую, как стор (`tasks.md`). В тестах — `queryClient.clear()` в `beforeEach`.

- Повторы: сетевая ошибка и 5xx — до 2 повторов с backoff, 4xx — без повторов (`shouldRetry`).
- `refetchOnWindowFocus: false`. `staleTime` задаётся в фабрике для каждого запроса (поиск — 5 минут).
- Кэш живёт до перезагрузки страницы; персистентность не подключаем, пока нет требования.

## Изменение данных — через таски (D-56)

`useMutation` не используем. Изменение — это действие пользователя, то есть таска (`tasks.md`): обычная `async`-функция вызывает функцию эндпоинта из `@/api` и потом обновляет кеш через импортированный `queryClient`.

| Что нужно после записи | Метод `queryClient` |
|---|---|
| перезапросить всё затронутое | `invalidateQueries({ queryKey: favoriteQueries.all() })` — по префиксу из фабрики |
| сразу показать известный результат | `setQueryData(key, updater)` / `setQueriesData({ queryKey }, updater)` |
| прочитать текущее значение (снимок, без подписки) | `getQueryData(key)` |
| получить данные через кеш внутри сценария | `fetchQuery(options)` / `ensureQueryData(options)` |

Презентер вызывает таску, держит `isPending` и ошибку в своём `useState` и показывает результат (toast, переход). Компоненты по-прежнему читают данные через `useQuery`: `getQueryData` в таске — разовый снимок, на изменения он не подписывает.

**Почему не `useMutation`:** это React-обёртка над действием того же рода, что thunk в лекции. Логика оказывается привязана к хуку и компоненту, её нельзя вызвать из другой таски или теста без React.

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

- `placeholderData: keepPreviousData` — для серверной пагинации и смены жанра без мигания скелетоном (запрос выдачи).
- `@tanstack/react-query-devtools` — по запросу, через `dependencies.md`.

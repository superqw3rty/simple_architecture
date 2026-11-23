# Этап 2 — ShowsExplorer: гайд для самостоятельной реализации

Костяк и API готовы. Фичу (хуки, презентеры, вёрстку, расположение компонентов) ты пишешь сам. Здесь собрано всё, что для этого нужно: что уже есть, предлагаемое дерево, контракты, переход поиска, подводные камни и чек-лист.

Требования задания — в [hw1.md](hw1.md). Правила — в [docs/ai](../ai/). Макет — [Figma](https://www.figma.com/design/o9svDdIlDyX4q4rzkUwHMn).

## 1. Что уже готово

### Данные и логика

| Нужно | Бери | Откуда |
|---|---|---|
| Найти сериалы | `searchShows(query: string, signal?: AbortSignal): Promise<Show[]>` | `@/api/tvmaze` |
| Запрос из React с кэшем и отменой | `useQuery(showQueries.search(term))` → `{ data, error, isLoading, isError, isSuccess, refetch, … }` | `useQuery` — `@tanstack/react-query`, `showQueries` — `@/api/tvmaze` ([data-fetching.md](../ai/data-fetching.md)) |
| Не слать запрос на каждую букву | `useDebouncedValue(value, delayMs)` | `@/hooks/useDebouncedValue` |
| Вырезать страницу | `paginate(items, page, pageSize)` → `{ items, page, totalPages }`; страница вне диапазона зажимается сама | `@/utils/paginate` |
| Тип сериала | `Show { id, name, genres, imageUrl, rating, year, language, status, summary }` | `@/types/show` |

`Show` приходит уже очищенным: `genres` всегда массив, `summary` — простой текст без HTML (может быть пустой строкой), `imageUrl` / `rating` / `year` / `language` могут быть `null`.

### Компоненты

| Компонент | Пропсы | Откуда |
|---|---|---|
| `TextInput` | `label` (обязателен, для скринридеров), `icon?` + нативные\| 'lg'` + нативные пропсы `<input>`: `value`, `onChange`, `placeholder`, `type`… | `@/components/ui/TextInput` |
| `SearchIcon` | — | `@/components/ui/SearchIcon` |
| `Chip` | `label`, `count?`, `isActive?`, `onClick?` | `@/components/ui/Chip` |
| `Button` | `variant?: 'primary' \| 'ghost'` + нативные пропсы `<button>` | `@/components/ui/Button` |
| `Skeleton` | `width?`, `height?`, `shape?: 'block' \| 'text' \| 'pill'` | `@/components/ui/Skeleton` |
| `Pagination` | `page`, `totalPages`, `onChange(page)`; при одной странице не рендерится | `@/components/Pagination` |
| `StatusMessage` | `title`, `description?`, `symbol?`, `tone?: 'neutral' \| 'danger'`, `actionLabel?`, `actionVariant?`, `onAction?` | `@/components/StatusMessage` |

Временная витрина `src/App` с примерами каждого компонента удалена, когда `main.tsx` начал рендерить `<ShowsExplorer />`. Живые примеры теперь — в самой фиче.

`TextInput.onChange` — нативный: презентер получает событие и сам достаёт `event.target.value`.

Токены для стилей — [src/styles/tokens.scss](../../src/styles/tokens.scss). В модулях используй только `var(--...)`.

## 2. Предлагаемое дерево

Это ориентир, а не требование — спроектировать дерево самому и есть часть упражнения.

```
src/ShowsExplorer/
  index.ts
  ShowsExplorer.tsx              view
  useShowsExplorer.ts            презентер-«оглавление»
  ShowsExplorer.module.scss
  useShowsSearch.ts              запрос
  useGenreFilter.ts              жанры
  collectGenres.ts (+ test)      чистая функция
  constants.ts                   PAGE_SIZE, SEARCH_DEBOUNCE_MS
  components/
    SearchHeader/                бренд + hero + поле поиска; здесь живёт переход
      components/Hero/
      components/Suggestions/
    GenreFilter/
    ShowList/
      components/ShowCard/
      components/ShowListSkeleton/
```

Почему так (дерево решений из [structure.md](../ai/structure.md)):
- `ShowsExplorer` сам добывает данные → `src/ShowsExplorer/`.
- Всё остальное используется одним родителем → `Parent/components/Child/`.
- В `src/components` ничего нового не нужно: переиспользуемое уже там.

Вопросы для самопроверки:
- У каких компонентов презентер обязателен, а каким он не нужен (D-5)?
- `ShowCard` — это `ShowList/components` или `ShowsExplorer/components`? Что изменится, если карточка понадобится ещё где-то?
- Скелетон списка — отдельный компонент или ветка внутри `ShowList`? Что из этого даёт view без условий?

Новый компонент создавай по skill `new-component` (или вручную по тому же шаблону).

**Как получилось в итоге:** `ShowsExplorer` → `Header` (`Logo`, `Hero`, `SearchInput`, `ExampleChips`) и `MainContent` (`ErrorComponent`, `Results` → `GenreChips`, `ShowList` → `ShowCard`, скелетоны рядом с компонентами, D-31). Запрос живёт в `MainContent/useShowsSearch.ts`, жанры и страницы — в `Results`.

## 3. Контракты

Что должно получиться. Реализация — твоя.

### `useShowsSearch(term)`
- `term` = `query` после `trim` и debounce (400 мс). Считается в `useShowsExplorer`: от него же зависит раскладка (D-36).
- `useQuery(showQueries.search(term))` — ключ `['shows', 'search', term]`, проброс `signal`, `enabled: term.length > 0` и `staleTime` 5 минут уже внутри фабрики.
- Отмену и защиту от гонок вручную делать **не нужно** — это делает TanStack Query при смене ключа.
- Скелетоны — по `isLoading`, не по `isPending`: выключенный запрос (пустое поле) тоже `pending`.
- Возвращает как минимум: список (`data ?? []`), `term`, `status`, `error`, `refetch`.

### `collectGenres(shows)`
- `[{ name, count }]` — уникальные жанры текущей выдачи с количеством сериалов. В реализации (`getGenreChips`) — по убыванию количества, при равенстве по алфавиту, как в макете (D-34).
- Чистая функция → тест рядом.

### `useGenreFilter(shows, term)`
- Один выбранный жанр или `null`.
- Сброс: чип «All» и повторный клик по активному чипу.
- Новый поисковый запрос сбрасывает жанр. Сделай это **без `useEffect`**: храни в state пару «жанр + `term`, для которого он выбран»; если `term` другой — жанр считается невыбранным.
- Отдаёт готовые чипы (`label`, `count`, `isActive`, `onSelect`) и отфильтрованный список.

### Пагинация
- `PAGE_SIZE = 3`.
- `paginate(filtered, page, PAGE_SIZE)` — возвращает и элементы, и уже зажатый номер страницы; в `Pagination` передавай именно его.
- Смена жанра ставит страницу 1. Смена запроса — тоже (или положись на зажатие, но тогда проверь сценарий «страница 3 → новый запрос с 4+ страницами»).

### `useShowsExplorer()`
Отдаёт view только готовое. View не сравнивает строки статусов и ничего не считает.

| Группа | Что отдаёт |
|---|---|
| Поиск | `query`, `onQueryChange`, `isCompact` |
| Состояние | `isLoading`, `isEmpty`, `errorMessage`, `onRetry` |
| Жанры | `chips` |
| Список | `visibleShows`, `resultsTitle` |
| Страницы | `page`, `totalPages`, `onPageChange` |

### Состояния экрана

| Состояние `useQuery` | Данные | Что на экране |
|---|---|---|
| выключен (`fetchStatus === 'idle'`, нет данных) | — | hero и поле поиска |
| `isLoading` | — | скелетоны (3 карточки) |
| `isSuccess` | есть | жанры, список, пагинация |
| `isSuccess` | пусто | `StatusMessage` «ничего не найдено» |
| `isError` | — | `StatusMessage tone="danger"` с кнопкой → `refetch` |

После «Try again» запрос без данных снова становится `isLoading`, поэтому показывается скелетон, а не ошибка ([data-fetching.md](../ai/data-fetching.md)).

Смена состояния объявляется скринридеру через постоянный визуально скрытый `aria-live`-регион с короткой фразой, а не через `aria-live` на всей области: иначе будет прочитан весь список (D-37).

## 4. Переход поиска из центра в шапку

Решение — без анимации (D-36). Анимированный вариант (схлопывание через `grid-template-rows`, View Transitions) рассматривался и отклонён как ненужный.

**Главное правило: поле поиска — один DOM-узел, вокруг которого нет условного рендера.** Тогда фокус, каретка и набранный текст сохраняются сами. Два инпута (один в hero, другой в шапке) или `isCompact ? <A /> : <B />` вокруг поля — и фокус потеряется на середине ввода. Условно рендерятся только соседи поля: `{!isCompact && <Hero />}`, `{!isCompact && <ExampleChips />}`. Раскладку шапки меняют классы.

### Когда переключать

`isCompact = term.length > 0`, где `term` — значение **после** debounce. Тогда:
- клик в поле и первые буквы ничего не двигают;
- раскладка меняется один раз — в момент, когда запрос реально уходит, и сразу показывается скелетон;
- очистка поля возвращает hero сразу: пустое поле `term` обнуляет без ожидания.

Если переключать по `query` (до debounce), экран дёрнется на первой же букве, и 400 мс под шапкой будет пусто.

## 5. Подводные камни

- **Логика во view.** Склейка `className`, `filter`/`sort`/`map` с преобразованием, условия сложнее одного готового флага, обработчики с телом — всё это уходит в презентер ([architecture.md](../ai/architecture.md), D-15). Линтер ловит только хуки и импорты, остальное — на твоей совести и на `arch-review`.
- **`memo` на `ShowCard`** бесполезен, если презентер каждый рендер отдаёт новые ссылки на объекты и обработчики.
- **Постер.** `imageUrl` бывает `null` — нужен фолбэк (в макете градиент с первой буквой названия). У `<img>`: осмысленный `alt`, `loading="lazy"`, фиксированные пропорции (`aspect-ratio`), чтобы карточки не прыгали при загрузке.
- **Описание.** `summary` уже без HTML: `dangerouslySetInnerHTML` не нужен. Обрезка по строкам — `-webkit-line-clamp`.
- **Рейтинг и год** бывают `null` — что показать вместо них, решает презентер, а не view.
- **Жанров может не быть** — сериал с пустым `genres` виден только под «All».
- **Ключ запроса.** Всё, от чего зависит ответ, — в `key`. Забудешь `term` — получишь чужие результаты из кэша.
- **Лимит 120 строк, фигурные скобки, Prettier** — `pnpm format` и `pnpm exec eslint . --fix` перед проверкой.

## 6. Порядок работы

1. `useShowsSearch` + минимальный `ShowsExplorer`, который выводит названия списком. Проверь debounce и отмену в Network.
2. `collectGenres` с тестом → `useGenreFilter` → чипы.
3. Пагинация по 3.
4. Состояния: скелетоны, пусто, ошибка с повтором.
5. Вёрстка `ShowCard`.
6. `SearchHeader` и переход.
7. Ширина 375px.
8. Удалить `src/App/`, обновить `main.tsx`.

## 7. Чек-лист перед сдачей

Вручную в браузере:
- [ ] Старт: только hero и поле; клик и фокус ничего не двигают.
- [ ] `murder` → через ~400 мс шапка переходит в компактный вид (без анимации, D-36); фокус и каретка на месте, можно печатать дальше.
- [ ] По 3 карточки, страницы переключаются.
- [ ] `Comedy` → только комедии, страница 1; «All» и повторный клик сбрасывают фильтр.
- [ ] Быстро `kill` → `kill bill`: в Network предыдущий запрос отменён, на экране результаты второго.
- [ ] Повторный ввод прежнего запроса — без нового запроса в Network (кэш).
- [ ] `qwertyzxcv` → «ничего не найдено».
- [ ] Offline в DevTools → ошибка; online + «Try again» → результаты.
- [ ] Очистка поля → hero возвращается сразу, без ожидания debounce.
- [ ] 375px: ничего не вылезает за экран.
- [ ] Клавиатура: Tab проходит поле → чипы → карточки → пагинацию, фокус виден.

Автоматически:
- [ ] `pnpm check` зелёный.
- [ ] Skill `arch-review` по `src/ShowsExplorer`.
- [ ] Чек-лист требований в [hw1.md](hw1.md) закрыт.

И вторая цель домашки: каждый нюанс, на котором споткнулся («а это логика или нет?», «куда это положить?»), запиши в [decisions.md](../ai/decisions.md) — решением или открытым вопросом. Из этого и вырастают твои AI Rules.

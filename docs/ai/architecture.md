# Архитектура: слои VIPER

Simple Architecture = Clean Architecture + VIPER. Слои и где они живут:

| Буква | Слой | Где | Подробно |
|---|---|---|---|
| **V** | View — JSX компонента | `Component/Component.tsx` | ниже |
| **I** | Interactor = **Tasks** — бизнес-логика, варианты использования | `Component/logic/tasks/`, `src/tasks/`, `server/tasks/` | `tasks.md` |
| **P** | Presenter — мост между UI и тасками | `Component/logic/useComponent.ts` | ниже |
| **E** | Entity — стор: данные + методы их изменения | кеш TanStack Query (`queryClient`), `src/stores/`, `server/entities/` | `data-fetching.md`, `backend.md` |
| **R** | Router — навигация | `src/router/`, вызовы — в презентере | `routing.md` |

Цель архитектуры — уменьшить трудозатраты на создание и, главное, на **сопровождение**. Код читают чаще, чем пишут: оптимизируй под того, кто откроет файл через два месяца.

## View — `ComponentName.tsx`

View отвечает только за то, **что увидит пользователь**.

Разрешено:
- JSX;
- один вызов своего презентера: `const { ... } = useComponentName(props)`;
- деструктуризация пропсов;
- тривиальный рендер-синтаксис: `condition && <X />`, тернарник, `items.map(...)` по уже готовому списку;
- сборка `className` из классов (шаблонная строка, тернарник по готовому флагу) — D-29;
- `ref={…}` из презентера и `key` по значению для сброса состояния дочернего компонента: `<Results key={term} />` (D-50);
- `memo`, `forwardRef`, `Fragment`, `Suspense`, импорт типов из `react`;
- импорт дочерних компонентов, стилей и типов;
- статичный текст интерфейса прямо в JSX.

Запрещено:
- любые хуки React (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`…) и хуки из `@/hooks`;
- вызов чужого презентера или второго хука;
- импорт из `@/api`, `@/tasks`, `@/stores` и папки `logic/` кроме своего презентера;
- вычисления и преобразования данных: `filter`, `sort`, `reduce`, форматирование дат/чисел, сборка строк для отображения (кроме `className`), арифметика;
- обработчики с телом: `onClick={() => { setA(1); track(); }}`;
- условия сложнее одного готового булева флага: `a && b.length > 0 && !c` — это логика, презентер должен отдать `isListVisible`.

Проверка: если из `.tsx` убрать JSX и останется что-то кроме импортов и вызова презентера — это логика, её место в презентере.

```tsx
// ✅ src/ShowsExplorer/MainContent/Results/Results.tsx (сокращено)
export const Results: FC<ResultsProps> = (props) => {
  const { title, headingRef, hasGenres, chips, visibleShows, page, totalPages, pageCaption, onPageChange } =
    useResults(props);

  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className={styles.title} aria-live="polite">{title}</h2>
      {hasGenres && <GenreChips chips={chips} />}
      <ShowList shows={visibleShows} />
      <Pagination page={page} totalPages={totalPages} caption={pageCaption} onChange={onPageChange} />
    </>
  );
};
```

```tsx
// ❌ логика во view
export const GenreChips: FC<Props> = ({ shows, selected, onChange }) => {
  const genres = [...new Set(shows.flatMap((s) => s.genres))].sort(); // вычисление
  return genres.map((g) => (
    <Chip key={g} isActive={g === selected} onClick={() => onChange(g === selected ? null : g)} />
  ));
};
```

## Presenter — `logic/useComponentName.ts`

Презентер забирает **100% логики** компонента: достаёт данные и готовит их для отображения.

- Принимает пропсы компонента, возвращает плоский объект «всё, что нужно JSX»: готовые значения, флаги `is*`/`has*`, обработчики `on*`, `ref` для управления фокусом.
- Отдаёт данные **в форме, удобной view**: не `shows` + `page`, а `visibleShows`; не `status`, а `isLoading`, `isEmpty`, `hasError`.
- Не возвращает JSX и не импортирует компоненты и стили. Типы пропсов своего и дочерних компонентов импортирует через `import type` (D-50).
- Не делает всё сам: презентер — это «оглавление». Куски логики выносятся в хуки (`logic/hooks/useGenreFilter.ts`), чистые функции (`logic/utils/formatPageRange.ts`) и таски (`logic/tasks/`, `@/tasks`). Презентер их только соединяет.
- Знает, **на какое событие какую таску вызвать**, держит состояние вызова (`isPending`, ошибка) в своём `useState` и решает, что показать после: toast, переход на другую страницу (`tasks.md`, `routing.md`).
- Бизнес-правила (что считается избранным, как фильтровать, как кешировать) в презентере не пишутся: им место в таске, а для серверных данных — на backend (D-54).

```ts
// ✅ src/ShowsExplorer/MainContent/Results/logic/useResults.ts — читается как оглавление
// (paginate уходит на сервер в шаге 6 hw2-plan)
export function useResults({ term, shows }: ResultsProps): UseResultsResult {
  const [page, setPage] = useState(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const genres = useGenreFilter(shows, () => setPage(1));
  const total = genres.filteredShows.length;
  const paged = paginate(genres.filteredShows, page, PAGE_SIZE);
  // …onPageChange
  return {
    title: formatResultsTitle(total, term),
    hasGenres: genres.chips.length > 0,
    visibleShows: paged.items,
    pageCaption: formatPageRange(paged.page, PAGE_SIZE, total),
    // …
  };
}
```

### Когда презентер обязателен

| Компонент | Презентер |
|---|---|
| Самодостаточный (`src/ComponentName`) и его дочерние с любой логикой | обязателен |
| Переиспользуемый со своей логикой (`components/Pagination`) | обязателен |
| «Глупый» (`components/ui/*`) | запрещён: только пропсы → JSX |
| Компонент, у которого логики действительно нет (пропсы → JSX) | не нужен; пустой хук не создаём |

Как только в компоненте без презентера появляется первая строка логики — создаётся `useComponentName.ts`.

## Куда течёт зависимость

```
View (.tsx) ──▶ Presenter (logic/useX.ts) ──▶ хуки, utils ──▶ useQuery(фабрика из @/api)
                       │
                       └──▶ Tasks ──▶ @/api (функции эндпоинтов) ──▶ http.ts ──▶ сеть
                              └────▶ Entity (queryClient, src/stores)
```

Стрелки только в одну сторону. View не знает про API и кэш; таски не знают про React и роутер; API не знает ни про React, ни про таски.

## `React.memo` и оптимизации

- `memo(Component)` во view разрешён — это оптимизация рендера, а не логика.
- Кастомный компаратор для `memo` — логика: выносится в `.ts` рядом.
- `useMemo`/`useCallback` — только в презентере и хуках, и там разрешены всегда, без доказанной проблемы (D-49). Стабильные ссылки нужны, чтобы `memo` у дочернего работал.
- Не оптимизируй заранее **компоненты**: `memo` ставится на элементы списков и на тяжёлые компоненты при реальной проблеме.

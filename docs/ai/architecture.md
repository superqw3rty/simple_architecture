# Архитектура: View и Presenter

Simple Architecture = Clean Architecture + VIPER. На текущей неделе курса действуют два слоя: **View** и **Presenter**. Остальные (Interactor, Entity, Router) добавятся позже через `decisions.md`.

Цель архитектуры — уменьшить трудозатраты на создание и, главное, на **сопровождение**. Код читают чаще, чем пишут: оптимизируй под того, кто откроет файл через два месяца.

## View — `ComponentName.tsx`

View отвечает только за то, **что увидит пользователь**.

Разрешено:
- JSX;
- один вызов своего презентера: `const { ... } = useComponentName(props)`;
- деструктуризация пропсов;
- тривиальный рендер-синтаксис: `condition && <X />`, тернарник, `items.map(...)` по уже готовому списку;
- сборка `className` из классов (шаблонная строка, тернарник по готовому флагу) — D-29;
- `memo`, `forwardRef`, `Fragment`, `Suspense`, импорт типов из `react`;
- импорт дочерних компонентов, стилей и типов.

Запрещено:
- любые хуки React (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`…) и хуки из `@/hooks`;
- импорт из `@/api`;
- вычисления и преобразования данных: `filter`, `sort`, `reduce`, форматирование дат/чисел, сборка строк для отображения (кроме `className`), арифметика;
- обработчики с телом: `onClick={() => { setA(1); track(); }}`;
- условия сложнее одного готового булева флага: `a && b.length > 0 && !c` — это логика, презентер должен отдать `isListVisible`.

Проверка: если из `.tsx` убрать JSX и останется что-то кроме импортов и вызова презентера — это логика, её место в презентере.

```tsx
// ✅ GenreFilter.tsx
export const GenreFilter: FC<GenreFilterProps> = (props) => {
  const { chips, onReset, isResetActive } = useGenreFilter(props);

  return (
    <ul className={styles.list}>
      <li><Chip label="All" isActive={isResetActive} onClick={onReset} /></li>
      {chips.map((chip) => (
        <li key={chip.id}><Chip label={chip.label} isActive={chip.isActive} onClick={chip.onSelect} /></li>
      ))}
    </ul>
  );
};
```

```tsx
// ❌ логика во view
export const GenreFilter: FC<Props> = ({ shows, selected, onChange }) => {
  const genres = [...new Set(shows.flatMap((s) => s.genres))].sort(); // вычисление
  return genres.map((g) => (
    <Chip key={g} isActive={g === selected} onClick={() => onChange(g === selected ? null : g)} />
  ));
};
```

## Presenter — `useComponentName.ts`

Презентер забирает **100% логики** компонента: достаёт данные и готовит их для отображения.

- Принимает пропсы компонента, возвращает плоский объект «всё, что нужно JSX»: готовые значения, флаги `is*`/`has*`, обработчики `on*`.
- Отдаёт данные **в форме, удобной view**: не `shows` + `page`, а `visibleShows`; не `status`, а `isLoading`, `isEmpty`, `errorMessage`.
- Не возвращает JSX и не импортирует компоненты и стили.
- Не делает всё сам: презентер — это «оглавление». Куски логики выносятся в отдельные хуки (`useShowsSearch.ts`) и чистые функции (`collectGenres.ts`) рядом. Презентер их только соединяет.

```ts
// ✅ useShowsExplorer.ts — читается как оглавление
export function useShowsExplorer(): UseShowsExplorerResult {
  const search = useShowsSearch();
  const genres = useGenreFilter(search.shows);
  const paging = usePagedItems(genres.filteredShows, PAGE_SIZE);

  return { ...search.view, ...genres.view, ...paging.view };
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
View (.tsx) ──▶ Presenter (useX.ts) ──▶ хуки / чистые функции ──▶ @/api ──▶ сеть
```

Стрелки только в одну сторону. View не знает про API и кэш; API не знает про React.

## `React.memo` и оптимизации

- `memo(Component)` во view разрешён — это оптимизация рендера, а не логика.
- Кастомный компаратор для `memo` — логика: выносится в `.ts` рядом.
- `useMemo`/`useCallback` — только в презентере и хуках. Чтобы `memo` у дочернего работал, презентер родителя отдаёт стабильные ссылки.
- Не оптимизируй заранее: `memo` ставится на элементы списков и на тяжёлые компоненты при реальной проблеме.

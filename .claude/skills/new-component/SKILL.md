---
name: new-component
description: Создать новый React-компонент по правилам Simple Architecture (папка, index.ts, view, презентер, стили). Используй всегда, когда нужно добавить компонент, а также когда файл view перерос лимит и из него выделяется дочерний компонент.
---

# Новый компонент

Аргументы: имя компонента и (необязательно) родитель или назначение. Пример: `/new-component ShowCard в ShowList`.

## 1. Определи место

Прочитай `docs/ai/structure.md`, раздел «Куда положить компонент», и выбери папку:

- нужен одному родителю → `Parent/Name/` (прямо в папке родителя, D-42)
- нужен нескольким компонентам одной ветки → `components/` ближайшего общего предка
- нужен в разных ветках → `src/components/Name/`
- «глупый» кирпичик без логики и домена → `src/components/ui/Name/`
- сам добывает данные (экран, виджет) → `src/Name/`

Если место неочевидно — спроси пользователя, не угадывай.

## 2. Создай файлы

`index.ts`
```ts
export { Name } from './Name';
```

`Name.tsx` — только JSX и вызов презентера:
```tsx
import type { FC } from 'react';
import styles from './Name.module.scss';
import { useName } from './useName';

export interface NameProps {
  // ...
}

export const Name: FC<NameProps> = (props) => {
  const { title, isActive, onToggle } = useName(props);

  return (
    <section className={styles.root}>
      {/* JSX */}
    </section>
  );
};
```

`useName.ts` — вся логика:
```ts
import type { NameProps } from './Name';

interface UseNameResult {
  title: string;
  isActive: boolean;
  onToggle: () => void;
}

export function useName({ ... }: NameProps): UseNameResult {
  // состояние, производные данные, обработчики
  return { title, isActive, onToggle };
}
```

`Name.module.scss` — только если нужны стили; значения — через CSS-переменные из `src/styles/tokens.scss`, разное на экранах значение — парой `@include screen-below(tablet)` + `@include screen-from(tablet)` (три значения — через `screen-between(tablet, desktop)`), боковой отступ страницы — `var(--page-gutter)`, высота строки — `var(--leading-*)` (см. `docs/ai/code-style.md`, «Брейкпоинты»).

Исключения:
- `components/ui/*` — без `useName.ts` вообще.
- У компонента нет логики (пропсы → JSX) — `useName.ts` не создаётся.

## 3. Проверь себя

- [ ] Имя папки = имя компонента = имя `.tsx`, PascalCase.
- [ ] Компонент объявлен как `export const Name: FC<NameProps>` (D-28).
- [ ] В `.tsx` нет хуков React, вычислений, обработчиков с телом (в том числе `onClick={() => …}`), импортов из `@/api` и `@/hooks`.
- [ ] Презентер возвращает данные в готовом для JSX виде (флаги `is*`, обработчики `on*`).
- [ ] Каждый файл ≤ 120 строк.
- [ ] Чистые функции лежат в `utils/` папки компонента (D-38).
- [ ] Чистые функции и хуки с логикой покрыты тестом `*.test.ts` рядом.
- [ ] Родитель импортирует компонент через папку: `./Name`.
- [ ] `pnpm check` зелёный.

---
name: new-component
description: Создать новый React-компонент по правилам Simple Architecture (папка, index.ts, view, презентер, стили). Используй всегда, когда нужно добавить компонент, а также когда файл view перерос лимит и из него выделяется дочерний компонент.
---

# Новый компонент

Аргументы: имя компонента и (необязательно) родитель или назначение. Пример: `/new-component ShowCard в ShowList`.

Правила — в `docs/ai/architecture.md`, `structure.md`, `code-style.md`, `styles.md`, `accessibility.md`. Здесь только порядок действий и шаблон.

## 1. Определи место

Выбери папку по дереву решений из `docs/ai/structure.md` («Куда положить компонент»): одному родителю — прямо в его папку, `components/` — только для общих (D-42). Если место неочевидно — спроси пользователя, не угадывай.

Общая для родителя и ребёнка чистая функция, таска или константа — в `logic/utils/`, `logic/tasks/` / `constants.ts` их ближайшего общего предка, не в `index.ts` (D-45).

## 2. Создай файлы

`index.ts`
```ts
export { Name } from './Name';
```

`Name.tsx` — только JSX и вызов презентера:
```tsx
import type { FC } from 'react';
import styles from './Name.module.scss';
import { useName } from './logic/useName';

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

`logic/useName.ts` — презентер (D-55):
```ts
import type { NameProps } from '../Name';

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

`Name.module.scss` — только если нужны стили, по `docs/ai/styles.md`.

Скелетон загрузки, если блок его требует, — дочерняя папка `Name/NameSkeleton/` и вторая строка в `index.ts`: `export { NameSkeleton } from './NameSkeleton'` (D-31). Общая раскладка компонента и скелетона — partial `_name.scss` с миксинами.

Остальная логика — тоже в `logic/` (`docs/ai/structure.md`, шаблон папки):
- доп. хуки презентера — `logic/hooks/useThing.ts`;
- чистые функции для view — `logic/utils/formatThing.ts`;
- действия пользователя (запись данных, сценарий из шагов) — таска `logic/tasks/doThing.ts` по `docs/ai/tasks.md`; если таска уже нужна другой ветке — `src/tasks/`.

Исключения:
- `components/ui/*` — без `logic/` вообще.
- У компонента нет логики (пропсы → JSX) — `logic/` не создаётся.

## 3. Проверь себя

- [ ] Имя папки = имя компонента = имя `.tsx`, PascalCase.
- [ ] Компонент объявлен как `export const Name: FC<NameProps>` (D-28).
- [ ] В `.tsx` нет хуков React, вычислений, обработчиков с телом (в том числе `onClick={() => …}`), импортов из `@/api` и `@/hooks`.
- [ ] Презентер возвращает данные в готовом для JSX виде (флаги `is*`, обработчики `on*`).
- [ ] Бизнес-логика — в таске без React; презентер только вызывает её, держит `isPending`/ошибку и решает про toast и навигацию.
- [ ] Действие, которое убирает элемент в фокусе или делает его `disabled`, заранее переводит фокус через `ref` (`accessibility.md`).
- [ ] Каждый файл ≤ 120 строк.
- [ ] Логика лежит в `logic/` (`hooks/`, `utils/`, `tasks/`, D-55) и покрыта тестами `name.test.ts` рядом.
- [ ] Родитель импортирует компонент через папку: `./Name`.
- [ ] `pnpm check` зелёный.

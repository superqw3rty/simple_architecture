# Макет в Figma и связь с кодом

Файл: https://www.figma.com/design/fQvS5QfBtUC7AWGkEH9YC9 (команда на тарифе Pro; старый `o9svDdIlDyX4q4rzkUwHMn` на Starter больше не обновляется). Читай этот документ, когда сверяешь вёрстку с макетом или правишь Figma. Правила стилей в коде — `docs/ai/styles.md`.

## Что в файле

- Коллекция переменных `Tokens` — зеркало `src/styles/tokens.scss`.
- Компоненты: `Chip`, `Button`, `PageButton`, `SearchField`, `ShowCard` и `ShowCardSkeleton` (варианты `Size=Default` / `Size=Compact`).
- Экраны: Start / Results / Error / Empty на 1440, `Laptop / Results` на 1200 (три `Compact`), Tablet (768: Start / Results / Error / Empty), Start / Loading / Results / Error / Empty на 375 (D-27). В шапке всех экранов — `FavoritesLink`; на 375 только звезда и счётчик, без подписи.
- ДЗ-2 (D-62), доска `Components / Favorites`: `Icon / Star` (Outline / Filled), `Icon / ChevronLeft`, `FavoriteToggle` (Off / On × Default / Hover / Focus + Pending, 44×44, на постере `ShowCard` справа внизу с отступом 8), `FavoritesLink` (Default / Hover / Focus / Active), `BackLink`, `Toast` (Added / Removed / Error, ширина 360).
- ДЗ-2, секция `HW2 · Favorites`: Favorites / Empty / Loading / Error на 1440, 1200, 768, 375 и `Results / Toast` на 1440 и 375. Согласовано пользователем 2026-11-25 — вёрстка ДЗ-2 идёт по этим макетам.
- Новая переменная `layout/toast-max-width` = 360 → `var(--toast-max-width)`: в `tokens.scss` её ещё нет, добавить при вёрстке toast.

## Переменные ↔ токены

- У каждой переменной указан code syntax — CSS-переменная из `tokens.scss`: `space/5` → `var(--space-5)`.
- `space/*` — scope Gap, к ним привязаны все `padding`/`gap` макета (D-18). Так же привязаны все радиусы (`radius/*`) и цвета (`color/*`); сырые значения остались только у служебных рамок досок (радиус 24, 5).
- Боковой отступ страницы: тариф позволяет один режим на коллекцию, поэтому вместо одной переменной с режимами — три: `layout/page-gutter/mobile|tablet|desktop` (ссылки на `space/4`, `space/8`, `space/16`), у всех code syntax `var(--page-gutter)` (D-26). Если тариф позволит режимы — заменить одной переменной с режимами Mobile/Tablet/Desktop.
- Высота строки в Figma задаётся в px той же парой, что в коде (`16/24`): переменные line-height Figma привязывает только в px.

## Раскладка: Figma → CSS

- В Figma обводка входит в раскладку (`strokesIncludedInLayout`), а в CSS `border` идёт снаружи `padding`. Отступ в макете = `padding` в коде, рамка 1px добавляется сверху в обоих местах одинаково.
- Точного аналога `auto-fill` в Figma нет: при Fill одиночная карточка последнего ряда растягивается. Поэтому сетки в коде задаются брейкпоинтами (D-27).
- Значение вне сетки 4px приводится к сетке и в макете, и в коде (`styles.md`).

## Кто под кого подтягивается (D-34)

- Код — источник для `ShowCard`, `ShowCardSkeleton`, шапки и поиска: они прошли ревью в браузере.
- Остальное — Figma: заголовки, тексты статусов, пагинация, скелетон экрана.
- Цвета, не проходящие WCAG AA, правятся в коде, затем в Figma (D-43).
- **Новый функционал — сначала макет** (D-62): звезда избранного, toast-уведомления, верхняя панель, страница Favorites рисуются в Figma, пользователь согласует макет, потом вёрстка идёт по нему. После вёрстки — сверка, расхождения решаются по правилам выше.

## Долг синхронизации

Закрыт 2026-11-25 в новом файле. У Figma MCP на Pro лимит 200 вызовов в день и 10 в минуту — всё равно собирать правки в несколько крупных скриптов.

- [x] Шрифты и высоты строк по шкале `--text-N` / `--leading-N` (D-35).
- [x] `radius/sm` 10 → 8, `radius/md` 14 → 12; высоты контролов 36 / 44 / 52 (D-35).
- [x] Постер Compact 128×180, точка логотипа 12, иконки 24 и 12×12 — как в коде (D-35, D-46).
- [x] `--color-text-subtle: #948878`, `--color-border-input: #75634f` (D-43); у всех цветовых переменных теперь есть code syntax `var(--color-*)`.

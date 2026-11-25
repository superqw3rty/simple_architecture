# Роутинг (Router)

Буква **R** из VIPER. Роутер — `@tanstack/react-router` (D-57). Страницы: `/` — поиск, `/favorites` — избранное.

## Правила

- **Маршруты описаны в коде** в `src/router/` (дерево маршрутов, `validateSearch`, создание роутера). Файлового роутинга и кодогенерации нет.
- **Hash history:** адреса вида `/#/favorites`, `/#/?q=murder`. GitHub Pages не умеет отдавать `index.html` на любой путь, а превью PR живут в подпапках. Почему не 404.html-хак: он ломает прямые ссылки на превью и требует скрипта.
- **Навигация — только в презентере:** `useNavigate`, `useSearch`, `useParams` вызываются в `logic/` компонента. Навигация не бизнес-логика, она зависит от среды (браузер, мобильное приложение), поэтому в таски не попадает.
- Во view допустим `<Link to="/favorites">`: это JSX без логики. Вычислять `to`/`search` для ссылки — работа презентера.
- **Состояние, которое должно пережить «Назад» или быть ссылкой, — в URL.** Поиск хранит в search-параметрах `q` (терм после debounce), `genre`, `page`. Набираемый текст поля — локальный `useState`.
- Search-параметры валидируются в `validateSearch` маршрута: неверный `page` → 1, пустая строка → параметра нет. Презентер получает уже типизированные значения.

```ts
// ✅ src/ShowsExplorer/logic/useShowsExplorer.ts
const { q, genre, page } = useSearch({ from: '/' });
const navigate = useNavigate({ from: '/' });
const onGenreChange = (next: string | null): void => {
  void navigate({ search: (prev) => ({ ...prev, genre: next ?? undefined, page: undefined }) });
};
```

```ts
// ❌ навигация в таске
export async function addToFavorites(show: Show): Promise<void> {
  await addFavorite(show.id);
  router.navigate({ to: '/favorites' });
}
```

## Связь с остальным

- Страница — самодостаточный компонент `src/<PageName>/` (`structure.md`): `src/ShowsExplorer/`, `src/FavoritesPage/`. Общая обвязка (верхняя панель, `<Outlet />`, toast-уведомления) — `src/AppLayout/`.
- Фокус при смене страницы переводится на заголовок новой страницы (`accessibility.md`).

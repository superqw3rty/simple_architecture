# Tasks — бизнес-логика (Interactor)

Таска — это **вариант использования**: действие пользователя, которое приложение должно выполнить («добавить в избранное», «найти сериалы»). В VIPER это буква **I** (Interactor), по-нашему — Tasks (D-54). Здесь живёт бизнес-логика приложения.

## Что такое таска

- **Обычная JS/TS-функция.** Вход — параметры, внутри — порядок действий, выход — `return`. Может быть `async`.
- **Имя — глагол** с точки зрения пользователя: `toggleFavorite`, `addToFavorites`, `searchShows`, `logout`. Не `favoriteHandler`, не `useFavorite`.
- **Снаружи — одна функция.** Внутри её можно дробить на функции и на другие таски (`logout` вызывает `unsubscribeFromPush`).
- **Без React.** Никаких хуков, JSX, `@tanstack/react-query` хуков, `@/hooks`, `@/components`. Таска работает и в тесте, и в Node, и переживёт переезд на другой view-фреймворк.
- **Без навигации и текстов UI.** Куда перейти после успеха и какой toast показать, решает презентер: это зависит от среды и экрана, а не от бизнеса (D-57, D-53).

**Почему:** use case не зависит от инструментов. Если отделить его от React и сети, при смене стека переписываются только View и Presenter.

## С чем таска работает

| Нужно | Как | Нельзя |
|---|---|---|
| сеть | функции из `@/api` (`addFavorite(id)`) — абстракция над `request()` | `fetch`, сокеты, сборка URL руками |
| серверный кеш (Entity) | **импортированный синглтон** `queryClient` из `@/api`: `invalidateQueries`, `setQueryData`, `getQueryData`, `fetchQuery` | `useQueryClient()`, `useMutation` (D-56) |
| клиентский стор (Entity, `src/stores/`) | импортированный стор и его функции: `getState()`, `setState()` | обёртки-посредники (thunk, saga), хук стора |

Стор вызывается **напрямую**, как в лекции `store.dispatch`/`getState`: это штатный API любого стора, React-обёртка над ним не нужна.

```ts
// ✅ src/tasks/toggleFavorite/toggleFavorite.ts
export async function toggleFavorite(show: Show): Promise<ToggleFavoriteResult> {
  const result = show.isFavorite ? await removeFavorite(show.id) : await addFavorite(show.id);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: showQueries.all() }),
    queryClient.invalidateQueries({ queryKey: favoriteQueries.all() }),
  ]);
  return result;
}
```

```ts
// ❌ React и UI внутри таски
export function useToggleFavorite() {
  const navigate = useNavigate();
  return useMutation({ mutationFn: addFavorite, onSuccess: () => toast('Added!') });
}
```

## Таска и презентер

Презентер — мост между UI и тасками: знает, **на какое событие какую таску вызвать**. Состояние вызова (`isPending`, ошибка) — локальный `useState` презентера: таска `async` и возвращает результат, поэтому складывать loading в глобальный стор не нужно.

```ts
// src/components/FavoriteToggle/logic/useFavoriteToggle.ts
const [isPending, setIsPending] = useState(false);

const onToggle = async (): Promise<void> => {
  setIsPending(true);
  try {
    const { isFavorite } = await toggleFavorite(show);
    showToast(isFavorite ? addedText(show) : removedText(show));
  } catch {
    showToast(FAVORITE_ERROR_TEXT);
  } finally {
    setIsPending(false);
  }
};
```

**Чтение данных** таской не оборачивается: оно остаётся `useQuery(фабрика)` в хуке презентера (`data-fetching.md`). Таска нужна, когда пользователь **что-то делает**: меняет данные, запускает сценарий из нескольких шагов.

## Таска или утилита

| | Таска | Утилита (`logic/utils/`, `src/utils/`) |
|---|---|---|
| смысл | действие пользователя | преобразование данных |
| побочные эффекты | да: API, стор | нет, чистая функция |
| пример | `toggleFavorite`, `searchShows` (на сервере) | `formatPageRange`, `getGenreChips`, `paginate` |

Глагол в имени не делает функцию таской: пользователь не просит «отформатировать заголовок».

## Где лежит

- Таска одного компонента — `Component/logic/tasks/`: файлом `doThing.ts` или папкой `doThing/` (если не влезает в 120 строк), тест рядом.
- Таска нужна нескольким компонентам — `src/tasks/<taskName>/` (`index.ts` + файлы + тесты), по тому же правилу, что `src/components/` (D-55). Понадобилась второму потребителю — переносится вверх.
- На сервере таски лежат в `server/tasks/` (`backend.md`).

## Тесты

Каждая таска — юнит-тест `name.test.ts` рядом: `vi.mock('@/api')` для сети, для `queryClient` — проверка вызовов или настоящий клиент с `queryClient.clear()` в `beforeEach`. Проверяется сценарий: какие шаги выполнены и что вернулось, включая ошибку.

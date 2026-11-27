import { searchShows } from '#server/tasks/searchShows/index.ts';
import type { ApiErrorBody, ShowsPage } from '#shared';
import { Hono } from 'hono';

export const shows = new Hono();

// GET /api/shows?q=&genre=&page= — errors of the task go to handleError, no try/catch here.
shows.get('/', async (c) => {
  const term = c.req.query('q')?.trim();

  if (!term) {
    return c.json<ApiErrorBody>({ error: 'Query "q" is required' }, 400);
  }

  // "?genre=" means no filter; paginate clamps the page, here it only has to be a number.
  const genre = c.req.query('genre')?.trim() || null;
  const page = Number.parseInt(c.req.query('page') ?? '', 10) || 1;

  return c.json<ShowsPage>(await searchShows({ term, genre, page }));
});

import { describe, it, expect } from 'vitest';
import type { TvMazeShow } from './types.ts';
import { mapShow } from './mapShow.ts';

/** Only the fields the mapper reads; the rest of the response is irrelevant here. */
const dto = (fields: Partial<Record<keyof TvMazeShow, unknown>>): TvMazeShow =>
  ({ id: 1, name: 'Murder', ...fields }) as TvMazeShow;

describe('mapShow', () => {
  it('maps a complete show', () => {
    const show = mapShow(
      dto({
        id: 12918,
        genres: ['Drama', 'Crime'],
        image: { medium: 'https://img.test/m.jpg', original: 'https://img.test/o.jpg' },
        rating: { average: 7.6 },
        premiered: '2012-08-26',
        language: 'English',
        status: 'Ended',
        summary: '<p>An <b>investigation</b> begins.</p>',
      }),
    );

    expect(show).toEqual({
      id: 12918,
      name: 'Murder',
      genres: ['Drama', 'Crime'],
      imageUrl: 'https://img.test/m.jpg',
      rating: 7.6,
      year: 2012,
      language: 'English',
      status: 'Ended',
      summary: 'An investigation begins.',
    });
  });

  it('survives a response where everything optional is null', () => {
    const show = mapShow(
      dto({
        genres: null,
        image: null,
        rating: { average: null },
        premiered: null,
        language: null,
        status: null,
        summary: null,
      }),
    );

    expect(show).toEqual({
      id: 1,
      name: 'Murder',
      genres: [],
      imageUrl: null,
      rating: null,
      year: null,
      language: null,
      status: null,
      summary: '',
    });
  });

  it('survives a response where the fields are missing altogether', () => {
    const show = mapShow(dto({ name: undefined }));

    expect(show).toMatchObject({ name: '', genres: [], imageUrl: null, rating: null });
  });

  it('drops a status the app does not know', () => {
    expect(mapShow(dto({ status: 'Cancelled' })).status).toBeNull();
    expect(mapShow(dto({ status: 'Running' })).status).toBe('Running');
  });

  it('returns no year for a malformed date', () => {
    expect(mapShow(dto({ premiered: 'soon' })).year).toBeNull();
    expect(mapShow(dto({ premiered: '' })).year).toBeNull();
  });
});

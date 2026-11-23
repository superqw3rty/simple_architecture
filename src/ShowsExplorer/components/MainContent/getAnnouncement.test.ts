import { describe, expect, it } from 'vitest';
import { getAnnouncement } from './getAnnouncement';

const base = { term: 'murder', count: 0, isLoading: false, isError: false, isSuccess: false };

describe('getAnnouncement', () => {
  it('says nothing while idle', () => {
    expect(getAnnouncement({ ...base, term: '' })).toBe('');
  });

  it('announces the search in flight', () => {
    expect(getAnnouncement({ ...base, isLoading: true })).toBe('Searching for “murder”…');
  });

  it('announces the error with what to do', () => {
    expect(getAnnouncement({ ...base, isError: true })).toBe(
      'The reel snapped. We couldn’t reach TVmaze. Check your connection and try again.',
    );
  });

  it('announces the number of shows found', () => {
    expect(getAnnouncement({ ...base, isSuccess: true, count: 10 })).toBe('10 shows for “murder”');
  });

  it('announces an empty result', () => {
    expect(getAnnouncement({ ...base, isSuccess: true })).toBe('No shows for “murder”');
  });
});

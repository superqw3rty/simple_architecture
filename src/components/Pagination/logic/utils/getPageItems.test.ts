import { describe, expect, it } from 'vitest';
import { getPageItems } from './getPageItems';

describe('getPageItems', () => {
  it('lists every page when there are few of them', () => {
    expect(getPageItems(2, 4)).toEqual([1, 2, 3, 4]);
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it('collapses both sides around a middle page', () => {
    expect(getPageItems(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
  });

  it('collapses only the far side at the edges', () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 'ellipsis', 12]);
    expect(getPageItems(12, 12)).toEqual([1, 'ellipsis', 11, 12]);
  });

  it('does not put an ellipsis in place of a single page', () => {
    expect(getPageItems(3, 12)).toEqual([1, 2, 3, 4, 'ellipsis', 12]);
  });
});

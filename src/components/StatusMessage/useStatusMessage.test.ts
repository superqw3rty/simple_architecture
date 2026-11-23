import { describe, expect, it } from 'vitest';
import { useStatusMessage } from './useStatusMessage';

const noop = () => {};

describe('useStatusMessage', () => {
  it('shows only the parts that are set', () => {
    expect(useStatusMessage({ title: 'Oops', symbol: '!', description: '' })).toEqual({
      hasSymbol: true,
      hasDescription: false,
      hasAction: false,
    });
  });

  it('shows the action only with both a label and a handler', () => {
    expect(useStatusMessage({ title: 'Oops', actionLabel: 'Retry' }).hasAction).toBe(false);
    expect(useStatusMessage({ title: 'Oops', onAction: noop }).hasAction).toBe(false);
    expect(
      useStatusMessage({ title: 'Oops', actionLabel: 'Retry', onAction: noop }).hasAction,
    ).toBe(true);
  });
});

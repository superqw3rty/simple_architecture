import type { StatusMessageProps } from '../StatusMessage';

interface UseStatusMessageResult {
  hasSymbol: boolean;
  hasDescription: boolean;
  hasAction: boolean;
}

export function useStatusMessage({
  symbol,
  description,
  actionLabel,
  onAction,
}: StatusMessageProps): UseStatusMessageResult {
  return {
    hasSymbol: Boolean(symbol),
    hasDescription: Boolean(description),
    // A label without a handler would be a button that does nothing, so both are required.
    hasAction: Boolean(actionLabel) && onAction !== undefined,
  };
}

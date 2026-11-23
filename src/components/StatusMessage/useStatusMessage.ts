import type { StatusMessageProps } from './StatusMessage';

/** Which optional parts of the message are shown. An empty string counts as "not set". */
export function useStatusMessage({
  symbol,
  description,
  actionLabel,
  onAction,
}: StatusMessageProps) {
  return {
    hasSymbol: Boolean(symbol),
    hasDescription: Boolean(description),
    // A label without a handler would be a button that does nothing, so both are required.
    hasAction: Boolean(actionLabel) && onAction !== undefined,
  };
}

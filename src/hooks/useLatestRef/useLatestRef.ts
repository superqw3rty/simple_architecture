import { useLayoutEffect, useRef, type RefObject } from 'react';

/** Keeps the latest value reachable from effects and callbacks without re-subscribing. */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}

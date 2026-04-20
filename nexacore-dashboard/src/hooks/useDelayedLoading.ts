import { useState, useEffect, useRef } from "react";

/**
 * Prevents loader flash on fast loads.
 * - Delays showing loader by `delay` ms (default 200ms)
 * - Once shown, keeps visible for minimum `minDisplay` ms (default 300ms)
 *
 * Usage: const showLoader = useDelayedLoading(isLoading);
 */
export function useDelayedLoading(
  isLoading: boolean,
  { delay = 200, minDisplay = 300 } = {},
): boolean {
  const [show, setShow] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setShow(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    // Loading finished — ensure minimum display time
    if (shownAt.current) {
      const elapsed = Date.now() - shownAt.current;
      const remaining = Math.max(0, minDisplay - elapsed);
      const timer = setTimeout(() => {
        setShow(false);
        shownAt.current = null;
      }, remaining);
      return () => clearTimeout(timer);
    }

    setShow(false);
    return undefined;
  }, [isLoading, delay, minDisplay]);

  return show;
}

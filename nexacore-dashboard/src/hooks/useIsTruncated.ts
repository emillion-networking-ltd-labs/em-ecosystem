"use client";

import { useState, useRef, useLayoutEffect, useCallback } from "react";

// ECO-129: [ref, isTruncated]. Pon el ref en el elemento con `truncate`; isTruncated es true SOLO cuando su
// contenido NO cabe (scrollWidth > clientWidth). Se recalcula al montar y en cada resize (ResizeObserver).
// Úsalo para mostrar un tooltip con el valor completo únicamente cuando el texto está recortado.
export function useIsTruncated<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (el) setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return [ref, truncated] as const;
}

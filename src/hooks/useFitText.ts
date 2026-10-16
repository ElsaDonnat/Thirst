import { useLayoutEffect, useRef } from "react";

/**
 * Sets the element's font size to the largest value (between min and max,
 * in px) at which its text still fits its box without scrolling. Refits when
 * the box resizes or `deps` change.
 */
export function useFitText<T extends HTMLElement>(min: number, max: number, deps: unknown[]) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let lo = min;
      let hi = max;
      // Binary search on whole pixels: a handful of layouts instead of one per px
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        el.style.fontSize = `${mid}px`;
        if (el.scrollHeight <= el.clientHeight + 1) lo = mid;
        else hi = mid - 1;
      }
      el.style.fontSize = `${lo}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    // The bundled fonts load after first paint; measuring with the fallback
    // font gives a size that's too small
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, ...deps]);

  return ref;
}

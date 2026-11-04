"use client";
import {useLayoutEffect, useRef} from 'react';

// One entrance per mounted dashboard/view. Data updates and interaction settle it.
export function useDashboardEntrance(revision: unknown, enabled = true) {
  const root = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  useLayoutEffect(() => {
    const element = root.current;
    if (!enabled || !element || played.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || document.hidden) {
      played.current = true;
      return;
    }
    const interactionRoot = element.closest('.management-dashboard') ?? element;
    const counters = Array.from(element.querySelectorAll<HTMLElement>('[data-count-value]'));
    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const finish = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      element.removeAttribute('data-entering');
      for (const event of ['pointerdown', 'pointermove', 'focusin', 'keydown', 'input', 'change']) interactionRoot.removeEventListener(event, interrupt);
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', preference);
      for (const counter of counters) counter.textContent = Number(counter.dataset.countValue).toLocaleString('vi-VN');
    };
    const interrupt = () => {
      played.current = true;
      finish();
    };
    const visibility = () => { if (document.hidden) interrupt(); };
    const preference = () => { if (reduced.matches) interrupt(); };
    element.setAttribute('data-entering', 'true');
    for (const counter of counters) counter.textContent = '0';
    // Mark only when a frame is actually presented; safe under Strict Mode's effect replay.
    frame = requestAnimationFrame(start => {
      played.current = true;
      const tick = (now: number) => {
        if (stopped) return;
        const progress = Math.min(1, Math.max(0, (now - start - 100) / 600));
        const eased = 1 - (1 - progress) ** 3;
        for (const counter of counters) counter.textContent = Math.round(Number(counter.dataset.countValue) * eased).toLocaleString('vi-VN');
        if (progress < 1 && counters.length) frame = requestAnimationFrame(tick);
      };
      tick(start);
    });
    timer = setTimeout(interrupt, 1100);
    for (const event of ['pointerdown', 'pointermove', 'focusin', 'keydown', 'input', 'change']) interactionRoot.addEventListener(event, interrupt, {once: true});
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    return finish;
  }, [revision, enabled]);
  return root;
}

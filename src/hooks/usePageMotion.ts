'use client';
import {useEffect, useRef} from 'react';

/** Animate the ready surface, not the entire table/tree in a giant GPU layer. */
export function usePageMotion(key: string) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!el || reduced.matches || document.hidden) return;
    const animations: Animation[] = [];
    let frame = 0, done = false;
    const play = (target: Element, distance: number, delay = 0) => {
      const animation = target.animate([
        {opacity: .55, translate: `0 ${distance}px`},
        {opacity: 1, translate: '0 0'},
      ], {duration: 300, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'});
      animations.push(animation);
    };
    const reveal = () => {
      if (done) return;
      const surface = el.querySelector('.page-heading');
      if (surface) play(surface, 8);
      // Keep expensive sheet/analytics contents out of page-level transforms.
      const controls = el.querySelector('.ops-filters, .group-summary, .quick-search-panel');
      if (controls) play(controls, 5, 35);
      done = true;
    };
    frame = requestAnimationFrame(reveal);
    const finish = () => {done = true; cancelAnimationFrame(frame); animations.forEach(animation => animation.cancel());};
    el.addEventListener('pointerdown', finish, {once: true});
    el.addEventListener('keydown', finish, {once: true});
    reduced.addEventListener('change', finish);
    return () => {
      finish();
      el.removeEventListener('pointerdown', finish);
      el.removeEventListener('keydown', finish);
      reduced.removeEventListener('change', finish);
    };
  }, [key]);
  return root;
}

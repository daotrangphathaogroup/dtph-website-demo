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
    const play = (target: Element) => {
      const animation = target.animate([
        {opacity: .35, transform: 'translateY(7px)'},
        {opacity: 1, transform: 'translateY(0)'},
      ], {duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)'});
      animations.push(animation);
    };
    const reveal = () => {
      if (done || el.querySelector('.feature-skeleton')) return;
      const surface = el.querySelector('.page-heading');
      if (!surface) return;
      done = true; observer.disconnect();
      play(surface);
      // Keep expensive sheet/analytics contents out of page-level transforms.
      const controls = el.querySelector('.ops-filters, .management-summary, .quick-search-panel');
      if (controls) play(controls);
    };
    const observer = new MutationObserver(() => {
      if (el.querySelector('.feature-skeleton')) return;
      observer.disconnect();
      frame = requestAnimationFrame(reveal);
    });
    // Observe only while a lazy component is loading. Counter text updates must
    // never keep cancelling the entrance frame and postpone it for a second.
    if (el.querySelector('.feature-skeleton'))
      observer.observe(el, {childList: true, subtree: true});
    else frame = requestAnimationFrame(reveal);
    const finish = () => {done = true; observer.disconnect(); cancelAnimationFrame(frame); animations.forEach(animation => animation.cancel());};
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

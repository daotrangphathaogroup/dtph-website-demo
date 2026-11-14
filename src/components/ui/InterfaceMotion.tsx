'use client';
import {useEffect} from 'react';

/** Delegated feedback works for lazy-loaded controls without intercepting actions. */
export default function InterfaceMotion() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const running = new Map<HTMLElement, Animation>();
    let pressed: HTMLElement | null = null;
    const play = (el: HTMLElement, frames: Keyframe[], duration: number) => {
      running.get(el)?.cancel();
      const animation = el.animate(frames, {duration, easing: 'cubic-bezier(.2,.8,.2,1)'});
      running.set(el, animation);
      animation.onfinish = () => {
        if (pressed !== el && running.get(el) === animation) {
          animation.cancel();
          running.delete(el);
        }
      };
    };
    const settle = () => {
      if (!pressed) return;
      const el = pressed;
      pressed = null;
      if (reduced.matches || !el.isConnected) { running.get(el)?.cancel(); return; }
      play(el, [{scale: '.98'}, {scale: '1.008', offset: .65}, {scale: '1'}], 220);
    };
    const down = (event: PointerEvent) => {
      settle();
      if (reduced.matches || event.button !== 0 || !(event.target instanceof Element)) return;
      const el = event.target.closest<HTMLElement>('button, a.button, summary');
      if (!el || el.matches(':disabled, [aria-disabled="true"], [aria-busy="true"]') || el.closest('.recognition-cell, .column-resizer, [role=separator], .intake-delivering')) return;
      pressed = el;
      play(el, [{scale: '1'}, {scale: '.98'}], 85);
      // Hold the tactile state until release, including a pointer released outside.
      running.get(el)!.effect!.updateTiming({fill: 'forwards'});
    };
    const stop = () => {
      pressed = null;
      for (const animation of running.values()) animation.cancel();
      running.clear();
    };
    const preference = () => { if (reduced.matches) stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener('pointerdown', down, {passive: true});
    document.addEventListener('pointerup', settle, {passive: true});
    document.addEventListener('pointercancel', stop);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', stop);
    reduced.addEventListener('change', preference);
    return () => {
      stop();
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', settle);
      document.removeEventListener('pointercancel', stop);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', stop);
      reduced.removeEventListener('change', preference);
    };
  }, []);
  return null;
}

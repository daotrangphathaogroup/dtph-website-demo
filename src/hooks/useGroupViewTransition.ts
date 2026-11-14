'use client';
import {useLayoutEffect, useRef, useState} from 'react';

type GroupView = 'list' | 'pending' | 'statistics';
const views: GroupView[] = ['list', 'pending', 'statistics'];

/** Keep the new view interactive while its height and heading settle into place. */
export function useGroupViewTransition() {
  const [view, setView] = useState<GroupView>('list');
  const stage = useRef<HTMLDivElement>(null);
  const previous = useRef<{height: number; direction: number} | null>(null);

  function selectView(next: GroupView) {
    if (next === view) return;
    previous.current = {
      height: stage.current?.getBoundingClientRect().height ?? 0,
      direction: Math.sign(views.indexOf(next) - views.indexOf(view)),
    };
    setView(next);
  }

  useLayoutEffect(() => {
    const element = stage.current;
    const start = previous.current;
    previous.current = null;
    if (!element || !start || document.hidden ||
        matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    const height = element.getBoundingClientRect().height;
    const duration = 340;
    const easing = 'cubic-bezier(.22,1,.36,1)';
    element.dataset.switching = 'true';
    const heightAnimation = element.animate(
      [{height: `${start.height}px`}, {height: `${height}px`}],
      {duration, easing},
    );
    animations.push(heightAnimation);
    const heading = element.querySelector(
      '.group-records:not([hidden]) .sheet-toolbar, .dashboard-pending .panel-heading, .statistics-view .dashboard-card-heading',
    );
    if (heading) animations.push(heading.animate([
      {opacity: .25, translate: `${start.direction * 22}px 6px`},
      {opacity: 1, translate: '0 0'},
    ], {duration, easing}));
    const surface = element.querySelector(
      '.group-records:not([hidden]), .dashboard-pending, .statistics-view',
    );
    if (surface) animations.push(surface.animate(
      [{opacity: .35}, {opacity: 1}], {duration: 260, easing},
    ));
    heightAnimation.onfinish = () => { delete element.dataset.switching; };
    const settle = () => {
      animations.forEach(animation => animation.cancel());
      delete element.dataset.switching;
    };
    reduced.addEventListener('change', settle);
    return () => {
      reduced.removeEventListener('change', settle);
      settle();
    };
  }, [view]);

  return {view, selectView, stage};
}

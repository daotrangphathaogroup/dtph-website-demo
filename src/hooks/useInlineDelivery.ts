"use client";
import {useLayoutEffect, useRef} from 'react';
import {deliveryMotion} from '../lib/registration-delivery';

// Keep real inputs mounted with fixed layout boxes. Paper and content share
// one scale curve; transforms condense the rows without reflowing their text.
export function useInlineDelivery(busy: boolean) {
  const root = useRef<HTMLDivElement>(null);
  const before = useRef<{height: number; width: number} | null>(null);
  function capture() {
    const rect = root.current?.querySelector<HTMLElement>('.intake-paper-sheet')?.getBoundingClientRect();
    if (rect) before.current = {height: rect.height, width: rect.width};
  }
  useLayoutEffect(() => {
    const host = root.current;
    const sheet = host?.querySelector<HTMLElement>('.intake-paper-sheet');
    const initial = before.current;
    if (!busy || !host || !sheet || !initial) return;
    const leaf = sheet.querySelector<HTMLElement>('.intake-fold-leaf');
    const form = leaf?.querySelector('form');
    const fieldset = form?.querySelector('fieldset');
    const surface = sheet.querySelector<HTMLElement>('.intake-paper-surface');
    const cover = leaf?.querySelector<HTMLElement>('.paper-leaf-cover');
    if (!leaf || !form || !fieldset || !surface || !cover) return;
    const animations: Animation[] = [];
    const timers: number[] = [];
    const schedule = (ms: number, task: () => void) => timers.push(window.setTimeout(task, ms));
    const restored = new Map<HTMLElement, string | null>();
    const keep = (element: HTMLElement) => {
      if (!restored.has(element)) restored.set(element, element.getAttribute('style'));
    };
    const animate = (element: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      animations.push(element.animate(frames, {...options, fill: 'both'}));
    };
    const {compact, morph, crease, insert} = deliveryMotion;
    const total = compact + morph + crease + insert;
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate(sheet, [{width: '280px', height: '160px', transform: 'translateY(246px)', opacity: 0}], {duration: 0});
    } else {
      // Read the complete source geometry before any style writes.
      const sheetRect = sheet.getBoundingClientRect();
      const geometry = Array.from(fieldset.querySelectorAll<HTMLElement>('.intake-step')).map(row => {
        const rect = row.getBoundingClientRect();
        const body = row.querySelector<HTMLElement>('.intake-step-body');
        const bodyRect = body?.getBoundingClientRect();
        const style = getComputedStyle(row);
        return {row, body, top: rect.top - sheetRect.top, height: rect.height,
          paddingX: parseFloat(style.paddingLeft), paddingY: parseFloat(style.paddingTop),
          bodyLeft: bodyRect ? bodyRect.left - rect.left : 0,
          bodyTop: bodyRect ? bodyRect.top - rect.top : 0,
          bodyWidth: bodyRect?.width ?? 0};
      });
      const sourceX = (280 - initial.width) / 2;
      const printScale = 280 / initial.width;
      [host, sheet, leaf, form, fieldset, cover].forEach(keep);
      host.classList.add('gather-print');
      cover.style.display = 'none';
      // The expanding surface owns the paper until the contents have settled.
      // A card-sized leaf background appearing early breaks the visual continuity.
      form.style.background = 'transparent';
      leaf.style.background = 'transparent';
      schedule(compact, () => {
        form.style.removeProperty('background');
        leaf.style.removeProperty('background');
      });
      leaf.dataset.paperSide = 'inside';
      // Swap the entire render faces at the explicit 90-degree keyframe.
      // Display removal avoids WebKit retaining cached back-facing text layers.
      schedule(compact + morph + crease * 0.38, () => {
        form.style.display = 'none';
        cover.style.display = 'flex';
        leaf.dataset.paperSide = 'cover';
      });
      host.style.height = `${Math.max(490, initial.height)}px`;
      Object.assign(sheet.style, {width: '280px', height: '320px'});
      Object.assign(leaf.style, {position: 'absolute', top: '160px', left: '0', width: '280px', height: '160px'});
      Object.assign(fieldset.style, {position: 'absolute', left: `${sourceX}px`, top: '0', width: `${initial.width}px`, height: `${initial.height}px`, transformOrigin: 'center top'});
      // Content and paper share the same horizontal scale curve. Rows compress
      // vertically inside that coordinate space before becoming printed lines.
      animate(fieldset, [{transform: 'scale(1)'}, {transform: `scale(${printScale})`}], {duration: compact, easing: ease});
      // Preserve the source height until delivery finishes. Collapsing this
      // space after gather clamps scrollY and pulls the page title and scene
      // back into view just as the envelope appears. Cleanup releases it.
      animate(leaf, [{translate: '0 -160px'}, {translate: '0 0'}], {duration: compact, easing: ease});
      animate(form, [{clipPath: `inset(0px ${sourceX}px ${160 - initial.height}px ${sourceX}px)`}, {clipPath: 'inset(0px 0px 0px 0px)'}], {duration: compact, easing: ease});
      animate(surface, [
        {transform: `scale(${initial.width / 280}, ${initial.height / 320})`, opacity: 1, offset: 0, easing: ease},
        {transform: 'scale(1)', opacity: 1, offset: compact / total},
        {transform: 'scale(1)', opacity: 1, offset: (compact + morph - 200) / total},
        {transform: 'scale(1)', opacity: 0, offset: (compact + morph) / total},
        {transform: 'scale(1)', opacity: 0, offset: 1},
      ], {duration: total, easing: 'linear'});
      for (const [index, measured] of geometry.entries()) {
        const {row, body} = measured;
        const heading = row.querySelector<HTMLElement>('.intake-step-heading');
        const number = row.querySelector<HTMLElement>('.intake-step-number');
        const summary = row.querySelector<HTMLElement>('.registration-print-summary');
        const delay = index * 75;
        const moveDuration = compact;
        keep(row);
        Object.assign(row.style, {position: 'absolute', left: '0', top: '0', width: `${initial.width}px`, height: `${measured.height}px`, padding: '0', overflow: 'visible'});
        if (body) {
          keep(body);
          Object.assign(body.style, {position: 'absolute', left: `${measured.bodyLeft}px`, top: `${measured.bodyTop}px`, width: `${measured.bodyWidth}px`});
          animate(body, [{opacity: 1, clipPath: 'inset(0 0 0% 0)'}, {opacity: 0, clipPath: 'inset(0 0 100% 0)'}], {duration: 650, delay: index * 40, easing: ease});
        }
        if (number) animate(number, [{opacity: 1}, {opacity: 0}], {duration: 520, delay, easing: ease});
        if (heading) {
          keep(heading);
          Object.assign(heading.style, {position: 'absolute', top: `${measured.paddingY}px`, left: `${measured.paddingX}px`, width: `${initial.width - measured.paddingX * 2}px`});
          animate(heading, [
            {transform: 'translate(0, 0) scale(1)'},
            {transform: `translate(${12 / printScale - measured.paddingX - 19 / printScale}px, ${4 / printScale - measured.paddingY}px) scale(${0.5 / printScale})`},
          ], {duration: compact, easing: ease});
        }
        if (summary) {
          keep(summary);
          Object.assign(summary.style, {left: `${96 / printScale}px`, top: `${4 / printScale}px`, transform: `scale(${1 / printScale})`, transformOrigin: 'left top'});
          const revealAt = compact * 0.4 + index * 40;
          animate(summary, [{opacity: 0}, {opacity: 1}], {duration: 700, delay: revealAt, easing: 'ease-in-out'});
        }
        animate(row, [
          {transform: `translate(0, ${measured.top}px)`},
          {transform: `translate(0, ${(10 + index * 23) / printScale}px)`},
        ], {duration: moveDuration, easing: ease});
      }
      animate(sheet, [
        {transform: 'translateY(0)', offset: 0, easing: ease},
        {transform: 'translateY(24px)', offset: compact / total},
        {transform: 'translateY(24px)', offset: (compact + morph + crease) / total, easing: 'cubic-bezier(0.45, 0, 0.25, 1)'},
        {transform: 'translateY(252px) rotate(-1deg)', offset: (total - 260) / total, easing: 'ease-out'},
        {transform: 'translateY(239px) rotate(0.4deg)', offset: (total - 120) / total, easing: 'ease-in-out'},
        {transform: 'translateY(246px) rotate(0deg)', offset: 1},
      ], {duration: total, easing: 'linear'});
      schedule(compact + morph + crease, () => { sheet.style.height = '160px'; });
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
      scrollTo({top: Math.max(0, scrollY + host.getBoundingClientRect().top - header - 16), behavior: 'smooth'});
    }
    return () => {
      timers.forEach(clearTimeout);
      animations.forEach(animation => animation.cancel());
      restored.forEach((style, element) => {
        if (style === null) element.removeAttribute('style');
        else element.setAttribute('style', style);
      });
      delete leaf.dataset.paperSide;
      host.classList.remove('gather-print');
    };
  }, [busy]);
  return {root, capture};
}

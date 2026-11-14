'use client';
import {useEffect,useRef} from 'react';

/** Reveal once on visibility; data values never depend on the animation. */
export function useChartMotion(){
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    const el=root.current;if(!el)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    if(reduced.matches||document.hidden)return;
    const animations=new Set<Animation>();
    const settle=()=>{for(const animation of animations)animation.cancel();animations.clear();};
    const play=(target:Element,frames:Keyframe[],delay=0)=>{
      const animation=target.animate(frames,{duration:440,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      animations.add(animation);animation.onfinish=()=>{animation.cancel();animations.delete(animation);};
    };
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();if(reduced.matches||document.hidden)return;
      play(el,[{opacity:.5,translate:'0 8px'},{opacity:1,translate:'0 0'}]);
      el.querySelectorAll('.ops-queue-track > i').forEach((bar,i)=>play(bar,[{scale:'0 1'},{scale:'1 1'}],Math.min(i*14,200)));
    },{threshold:.12});
    observer.observe(el);
    const preference=()=>{if(reduced.matches){observer.disconnect();settle();}};
    const visibility=()=>{if(document.hidden)settle();};
    el.addEventListener('pointerdown',settle,{once:true});el.addEventListener('keydown',settle,{once:true});
    reduced.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);
    return()=>{observer.disconnect();settle();el.removeEventListener('pointerdown',settle);el.removeEventListener('keydown',settle);reduced.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  return root;
}

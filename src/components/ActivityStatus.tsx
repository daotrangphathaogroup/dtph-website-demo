'use client';
import {useEffect,useLayoutEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {selectedRecognitionTags} from '../lib/recognition-tags';
export default function ActivityStatus({value,compact=false,name='huynh đệ'}:{value:unknown;compact?:boolean;name?:string}){
 const tags=selectedRecognitionTags(value),id=useId();
 const trigger=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [mode,setMode]=useState<'hover'|'pinned'|null>(null);
 const [position,setPosition]=useState({top:0,left:0,arrow:0,below:false});
 const cancel=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 const close=()=>{cancel();setMode(null);};
 useEffect(()=>()=>cancel(),[]);
 useEffect(()=>{
  if(!mode)return;
  const outside=(event:PointerEvent)=>{if(!trigger.current?.contains(event.target as Node)&&!popup.current?.contains(event.target as Node))close();};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();}};
  const another=(event:Event)=>{if((event as CustomEvent<string>).detail!==id)close();};
  window.dispatchEvent(new CustomEvent('recognition-popover-open',{detail:id}));
  window.addEventListener('recognition-popover-open',another);
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  window.addEventListener('scroll',close,true);window.addEventListener('resize',close);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close);window.removeEventListener('recognition-popover-open',another);};
 },[mode]);
 useLayoutEffect(()=>{
  if(!mode||!trigger.current||!popup.current)return;
  const rect=trigger.current.getBoundingClientRect(),box=popup.current.getBoundingClientRect();
  const center=rect.left+rect.width/2,left=Math.max(10,Math.min(innerWidth-box.width-10,center-box.width/2));
  const below=rect.top-box.height-12<76;
  setPosition({top:below?rect.bottom+10:rect.top-box.height-10,left,arrow:Math.max(15,Math.min(box.width-15,center-left)),below});
 },[mode,value]);
 const pills=<div className="recognition-pills">{tags.map(tag=><span className="recognition-pill" key={tag.id} style={{color:tag.ink,background:tag.background}}><i style={{background:tag.color}}/>{tag.label}</span>)}</div>;
 if(!compact)return tags.length?pills:<span className="muted">Chưa gắn thẻ</span>;
 return <>
  <button ref={trigger} type="button" className="recognition-cell" aria-label={`Tình trạng của ${name}: ${tags.map(t=>t.label).join(', ')||'Chưa gắn thẻ'}`} aria-expanded={!!mode} aria-describedby={mode?id:undefined}
   onPointerEnter={event=>{if(event.pointerType!=='mouse'||mode==='pinned')return;cancel();timer.current=setTimeout(()=>{setMode('hover');timer.current=null;},700);}}
   onPointerLeave={()=>{cancel();setMode(old=>old==='hover'?null:old);}}
   onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))setMode('hover');}}
   onBlur={close}
   onClick={event=>{event.stopPropagation();cancel();setMode(old=>old==='pinned'?null:'pinned');}}>
    {tags.length?tags.map(tag=><i key={tag.id} style={{background:tag.color}} aria-hidden="true"/>):<span className="recognition-no-tags" aria-hidden="true">—</span>}
  </button>
  {mode&&createPortal(<div ref={popup} id={id} role="tooltip" className={`recognition-popover ${position.below?'is-below':''}`} style={{top:position.top,left:position.left}}>
   <span className="recognition-popover-arrow" style={{left:position.arrow}}/>
   <strong>{name}</strong><span className="recognition-popover-label">Tình trạng · {tags.length} thẻ ghi nhận</span>
   {tags.length?pills:<p className="recognition-empty">Chưa gắn thẻ nào.</p>}
   <small>Gắn hoặc bỏ thẻ trong Chỉnh sửa hồ sơ.</small>
  </div>,trigger.current?.closest('dialog')??document.body)}
 </>;
}

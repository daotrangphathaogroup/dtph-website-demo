import {Check,Plus} from 'lucide-react';
import {recognitionTags,selectedRecognitionTags} from '../lib/recognition-tags';
export default function RecognitionTagEditor({value,onChange}:{value:unknown;onChange:(value:string[])=>void}){
 const existing=selectedRecognitionTags(value);
 const selected=existing.map(t=>t.id);
 const options=[...recognitionTags,...existing.filter(t=>!recognitionTags.some(option=>option.id===t.id))];
 return <div className="recognition-editor"><p>Gắn các thẻ tình trạng của huynh đệ. Có thể chọn nhiều thẻ.</p>
  <div className="recognition-options" role="group" aria-label="Thẻ tình trạng">{options.map(tag=>{
   const checked=selected.includes(tag.id);
   return <button key={tag.id} type="button" aria-pressed={checked} className={`recognition-choice ${checked?'is-selected':''}`} style={{color:tag.ink,background:checked?tag.background:undefined,borderColor:checked?tag.color:undefined}} onClick={()=>{const next=checked?selected.filter(id=>id!==tag.id):[...selected,tag.id];onChange(options.filter(t=>next.includes(t.id)).map(t=>t.id));}}>
    <i style={{background:tag.color}}/>{tag.label}{!recognitionTags.some(option=>option.id===tag.id) && ' (thẻ cũ)'}{checked?<Check size={13}/>:<Plus size={13}/>}</button>;
  })}</div>
  <small>{selected.length?`Đã gắn ${selected.length} thẻ`:'Chưa gắn thẻ nào'} · Thẻ không biểu thị mức độ hoạt động.</small>
 </div>;
}

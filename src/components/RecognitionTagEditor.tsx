import {Check,Plus} from 'lucide-react';
import {recognitionTags,selectedRecognitionTags} from '../lib/recognition-tags';
export default function RecognitionTagEditor({value,onChange}:{value:unknown;onChange:(value:string[])=>void}){
 const selected=selectedRecognitionTags(value).map(t=>t.id);
 return <div className="recognition-editor"><p>Gắn các thẻ ghi nhận điểm tốt của huynh đệ. Có thể chọn nhiều thẻ.</p>
  <div className="recognition-options" role="group" aria-label="Thẻ tình trạng">{recognitionTags.map(tag=>{
   const checked=selected.includes(tag.id);
   return <button key={tag.id} type="button" aria-pressed={checked} className={`recognition-choice ${checked?'is-selected':''}`} style={{color:tag.ink,background:checked?tag.background:undefined,borderColor:checked?tag.color:undefined}} onClick={()=>{const next=checked?selected.filter(id=>id!==tag.id):[...selected,tag.id];onChange(recognitionTags.filter(t=>next.includes(t.id)).map(t=>t.id));}}>
    <i style={{background:tag.color}}/>{tag.label}{checked?<Check size={13}/>:<Plus size={13}/>}</button>;
  })}</div>
  <small>{selected.length?`Đã gắn ${selected.length} thẻ`:'Chưa gắn thẻ nào'} · Thẻ không biểu thị mức độ hoạt động.</small>
 </div>;
}

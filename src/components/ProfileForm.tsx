'use client';
import {useId,useState} from 'react';
import type {ProfileField,RegistrationSchema,ProfileValues} from '../lib/registration';
import {displayValue,profileFieldLabel} from '../lib/registration';
import {getTeam,teamAreas} from '../lib/areas';
import {legacyProvinces} from '../lib/provinces';
import MemberPicker from './MemberPicker';
import PortraitInput from './PortraitInput';
type Props={schema:RegistrationSchema;initial?:ProfileValues;publicForm?:boolean;memberId?:string;onSave:(values:ProfileValues)=>Promise<void>;onCancel?:()=>void};
export default function ProfileForm({schema,initial={},publicForm=false,memberId,onSave,onCancel}:Props){
 const fields=schema.fields.filter(f=>!publicForm||!f.staffOnly);
 const [values,setValues]=useState<ProfileValues>(()=>Object.fromEntries(fields.map(f=>[f.key,initial[f.key]??'']))),[error,setError]=useState(''),[busy,setBusy]=useState(false),[processing,setProcessing]=useState(false);
 const inputPrefix=useId(),occupationList=useId();
 const update=(key:string,value:string)=>setValues(v=>({...v,[key]:value,...(key==='address'?{team:getTeam(value)??''}:{}),...(key==='occupation'&&value==='Không'?{job:''}:{})}));
 function control(f:ProfileField){const label=profileFieldLabel(f,values),id=`${inputPrefix}-${f.key}`,value=values[f.key]??'';
  if(f.readOnly)return <input id={id} value={value} readOnly aria-readonly="true" className="system-field"/>;
  if(f.type==='image')return <PortraitInput value={String(value)} onChange={v=>update(f.key,v)} onError={setError} onProcessing={setProcessing}/>;
  if(f.key==='job'&&values.occupation==='Không')return <input id={id} disabled value="" placeholder="Không áp dụng"/>;
  if(f.type==='member')return <MemberPicker value={String(value)} label={label} required={f.required} onChange={v=>update(f.key,v)} excludeId={memberId}/>;
  if(['select','team','ward','province'].includes(f.type))return <><select id={id} required={f.required} value={f.allowOther&&String(value).startsWith('Khác: ')?'Khác':value} onChange={e=>update(f.key,e.target.value)}><option value="">{f.type==='ward'?'Chọn phường theo địa chỉ cũ':f.type==='province'?'Chọn tỉnh/thành theo địa chỉ cũ':`Chọn ${label.toLocaleLowerCase('vi')}`}</option>{f.type==='ward'?([1,2,3] as const).map(team=><optgroup key={team} label={`Tổ ${team}`}>{teamAreas[team].map(ward=><option key={ward} value={ward}>{ward}</option>)}</optgroup>):(f.type==='province'?legacyProvinces:f.type==='team'?['1','2','3']:f.options??[]).map(option=><option key={option} value={option}>{f.type==='team'?`Tổ ${option}`:option}</option>)}</select>{f.allowOther&&(value==='Khác'||String(value).startsWith('Khác: '))&&<input aria-label="Nghề nghiệp khác" value={String(value).startsWith('Khác: ')?String(value).slice(6):''} placeholder="Ghi rõ nghề nghiệp (nếu có)" maxLength={190} onChange={e=>update(f.key,e.target.value?'Khác: '+e.target.value:'Khác')}/>}</>;
  if(f.type==='textarea')return <textarea id={id} required={f.required} value={value} maxLength={5000} rows={3} onChange={e=>update(f.key,e.target.value)}/>;
  return <><input id={id} lang="vi" type={f.type==='year'||f.type==='number'?'number':f.type==='phone'?'tel':f.type==='date'?'date':'text'} required={f.required} value={value} min={f.type==='year'?1900:f.type==='number'?0:undefined} max={f.key==='birthday'?new Date().toLocaleDateString('en-CA'):f.type==='year'?new Date().getFullYear():f.type==='number'?100000:undefined} step={f.type==='year'||f.type==='number'?1:undefined} maxLength={200} inputMode={f.type==='phone'?'tel':undefined} pattern={f.type==='phone'?'0[35789][0-9]{8}':undefined} list={f.key==='occupation'?occupationList:undefined} autoComplete={f.key==='name'?'name':f.key==='phone'?'tel':'off'} onChange={e=>update(f.key,e.target.value)}/>{f.key==='occupation'&&<datalist id={occupationList}><option value="Học sinh"/><option value="Sinh viên"/></datalist>}{f.type==='date'&&<small>{value?displayValue(value,f):'Ngày / tháng / năm'}</small>}</>;
 }
 return <form className={`profile-form ${publicForm?'profile-form-simple':''}`} onSubmit={async e=>{e.preventDefault();if(busy||processing)return;setError('');for(const f of fields)if(f.required&&!f.readOnly&&!(f.key==='job'&&values.occupation==='Không')&&String(values[f.key]??'').trim()===''){setError('Vui lòng cung cấp '+profileFieldLabel(f,values)+'.');return;}setBusy(true);try{await onSave(Object.fromEntries(Object.entries(values).filter(([key])=>!fields.find(f=>f.key===key)?.readOnly)));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
  <fieldset disabled={busy} className="profile-fieldset"><div className="form-grid">{fields.map(f=><div className={`field ${['image','textarea'].includes(f.type)?'span-two':''}`} key={f.key}><label className="field-title" htmlFor={f.type==='image'||f.type==='member'?undefined:`${inputPrefix}-${f.key}`}>{profileFieldLabel(f,values)}{f.required&&<span className="required"> *</span>}</label>{control(f)}{f.key==='team'&&<small className="muted">Tự điền theo phường; có thể chọn lại Tổ.</small>}{f.readOnly&&<small className="muted">Hệ thống tự tạo</small>}</div>)}</div></fieldset>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="form-actions">{onCancel&&<button className="button secondary" type="button" disabled={busy} onClick={onCancel}>Hủy</button>}<button className="button primary" disabled={busy||processing}>{processing?'Hoàn tất cắt ảnh để tiếp tục':busy?'Đang lưu…':publicForm?'Gửi thông tin đăng ký':'Lưu thông tin'}</button></div>
 </form>;
}

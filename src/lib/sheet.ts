import type {Member} from './types';
import {displayValue,isStudent} from './registration.ts';
import type {ProfileField} from './registration.ts';
export const sheetText=(value:unknown)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi-VN');
export function sheetValue(member:Member,key:string):string|number|undefined {
 const value=member.profileData?.[key];
 if(key==='name')return member.name||value;
 if(key==='id')return member.id??value;
 if(key==='joined')return member.joined??value;
 if(member.references?.[key]?.name)return member.references[key].name;
 if(value!==undefined&&value!==null)return value;
 switch(key){
  case 'birthday':return member.birthday;
  case 'phone':return member.phone;
  case 'email':return member.email;
  case 'address':return member.address;
  case 'avatar':return member.avatar;
  case 'team':return member.team??undefined;
  default:return undefined;
 }
}
function dateSearchValue(value:string):string|undefined {
 if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const parts=value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
 return parts?`${parts[3]}-${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}`:undefined;
}
const phoneSearchValue=(value:string)=>value.replace(/\D/g,'').replace(/^84(?=[35789]\d{8}$)/,'0');

export function filterSheet(members:Member[],query:string,filters:Record<string,string>,fields:ProfileField[]):Member[]{
 const normalized=sheetText(query).trim();
 const terms=normalized.match(/\bto\s*[123]\b|\d{4}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}|[\p{L}\p{N}]+/gu)??[];
 const phoneQuery=!dateSearchValue(normalized)&&/^[+\d\s().-]+$/.test(normalized)&&phoneSearchValue(normalized).length>=7?phoneSearchValue(normalized):undefined;
 return members.filter(member=>{
  if(!Object.entries(filters).every(([key,value])=>!value||(value==='__empty'?sheetValue(member,key)===undefined||sheetValue(member,key)==='':String(sheetValue(member,key))===value)))return false;
  if(!terms.length)return true;
  const values=fields.filter(f=>f.type!=='image').flatMap(field=>{
   const value=sheetValue(member,field.key);
   if(value===undefined||value==='')return [];
   const raw=sheetText(value),display=sheetText(displayValue(value,field));
   return [{field,value,raw,words:(raw+' '+display).match(/[\p{L}\p{N}]+/gu)??[],digits:field.type==='phone'?phoneSearchValue(raw):''}];
  });
  if(phoneQuery)return values.some(v=>v.field.type==='phone'&&v.digits.includes(phoneQuery));
  return terms.every(term=>{
   const date=dateSearchValue(term);
   if(date)return values.some(v=>v.field.type==='date'&&dateSearchValue(v.raw)===date);
   const team=term.match(/^to\s*([123])$/);
   if(team)return values.some(v=>v.field.type==='team'&&Number(v.value)===Number(team[1]));
   if(/^\d+$/.test(term))return values.some(v=>v.raw.includes(term)||v.digits.includes(term));
   return values.some(v=>v.words.some(word=>word.startsWith(term)));
  });
 });
}
export function sortSheet(members:Member[],field:ProfileField|undefined,direction:'asc'|'desc'):Member[]{if(!field)return members;return [...members].sort((a,b)=>{const x=sheetValue(a,field.key),y=sheetValue(b,field.key),emptyX=x===undefined||x==='',emptyY=y===undefined||y==='';if(emptyX||emptyY)return emptyX===emptyY?0:emptyX?1:-1;const comparison=['year','number','team'].includes(field.type)?Number(x)-Number(y):String(x).localeCompare(String(y),'vi',{numeric:true,sensitivity:'base'});return direction==='asc'?comparison:-comparison;});}
export function sheetCsv(members:Member[],fields:ProfileField[]):string{const quote=(value:unknown)=>{const s=String(value??'');return '"'+(/^[\s]*[=+@\-]/.test(s)||/^[\t\r]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';};return '\ufeff'+[fields.map(f=>f.key==='job'&&members.length>0&&members.every(m=>isStudent(m.profileData?.occupation))?'Trường học':f.key==='job'&&members.some(m=>isStudent(m.profileData?.occupation))?'Nơi công tác / Trường học':f.label),...members.map(m=>fields.map(f=>{const value=sheetValue(m,f.key);return f.type==='date'&&value?displayValue(value,f):value;}))].map(row=>row.map(quote).join(',')).join('\r\n');}

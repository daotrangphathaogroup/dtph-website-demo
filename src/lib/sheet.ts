import {currentWard} from './areas.ts';
import {recognitionTagText,selectedRecognitionTags} from './recognition-tags.ts';
import type {Member} from './types';
import {displayValue} from './registration.ts';
import type {ProfileField} from './registration.ts';
export const sheetText=(value:unknown)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi-VN');
export function sheetValue(member:Member,key:string):string|number|undefined {
 if(member.group==='children'&&['occupation','introducedBy'].includes(key))return undefined;
 if(key==='addressNew')return currentWard(member.profileData?.address??member.address);
 if(key==='status')return recognitionTagText(member.profileData?.status);
 const rawValue=member.profileData?.[key];
 const value=Array.isArray(rawValue)?rawValue.join(' · '):rawValue;
 if(key==='name')return member.name||value;
 if(key==='id')return member.id??value;
 if(key==='joined')return member.joined??value;
 if(key!=='introducedBy'&&member.references?.[key]?.name)return member.references[key].name;
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
 const terms=normalized.match(/\bto\s*[1-5]\b|\d{4}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}|[\p{L}\p{N}]+/gu)??[];
 const phoneQuery=!dateSearchValue(normalized)&&/^[+\d\s().-]+$/.test(normalized)&&phoneSearchValue(normalized).length>=7?phoneSearchValue(normalized):undefined;
 return members.filter(member=>{
  if(!Object.entries(filters).every(([key,value])=>!value||(key==='status'&&value!=='__empty'?selectedRecognitionTags(member.profileData?.status).some(t=>t.label===value):value==='__empty'?sheetValue(member,key)===undefined||sheetValue(member,key)==='':String(sheetValue(member,key))===value)))return false;
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
   const team=term.match(/^to\s*([1-5])$/);
   if(team)return values.some(v=>v.field.type==='team'&&Number(v.value)===Number(team[1]));
   if(/^\d+$/.test(term))return values.some(v=>v.raw.includes(term)||v.digits.includes(term));
   return values.some(v=>v.words.some(word=>word.startsWith(term)));
  });
 });
}
export const compareSheetText = new Intl.Collator('vi-VN', {numeric:true,sensitivity:'accent'}).compare;
const nameParts = (name:string) => {
 const parts = name.split(/\s+/);
 return [parts.pop() ?? '',parts.join(' ')];
};
export function sortSheet(members:Member[],field:ProfileField|undefined,direction:'asc'|'desc'):Member[]{
 if(!field)return members;
 const sortValues=members.map(member=>{
  const value=String(sheetValue(member,field.key)??'').trim();
  const key=field.type==='date'?dateSearchValue(value)??'':value;
  return {member,key,name:field.key==='name'?nameParts(key):undefined};
 });
 return sortValues.sort((a,b)=>{
  if(!a.key||!b.key)return Number(Boolean(b.key))-Number(Boolean(a.key));
  const comparison=a.name&&b.name
   ? compareSheetText(a.name[0],b.name[0])||compareSheetText(a.name[1],b.name[1])
   : field.type==='date'
    ? (a.key<b.key?-1:a.key>b.key?1:0)
    : ['year','number','team'].includes(field.type) && Number.isFinite(Number(a.key)) && Number.isFinite(Number(b.key))
     ? Number(a.key)-Number(b.key)
     : compareSheetText(a.key,b.key);
  return direction==='asc'?comparison:-comparison;
 }).map(row=>row.member);
}
export function sheetExportData(members: Member[], fields: ProfileField[]): (string | number | undefined)[][] {
 return [
  fields.map(f => f.label),
  ...members.map(m => fields.map(f => {
   const value = sheetValue(m, f.key);
   return f.type === 'date' && value ? displayValue(value, f) : value;
  })),
 ];
}
export function sheetCsv(members:Member[],fields:ProfileField[]):string{const quote=(value:unknown)=>{const s=String(value??'');return '"'+(/^[\s]*[=+@\-]/.test(s)||/^[\t\r]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';};return '\ufeff'+[fields.map(f=>f.label),...members.map(m=>fields.map(f=>{const value=sheetValue(m,f.key);return f.type==='date'&&value?displayValue(value,f):value;}))].map(row=>row.map(quote).join(',')).join('\r\n');}

import {recognitionTags,recognitionTagText} from './recognition-tags.ts';
import type {MemberGroup} from './types';
export type ProfileValues=Record<string,string|number|string[]>;
export type ProfileField={key:string;label:string;type:'text'|'textarea'|'year'|'number'|'phone'|'select'|'date'|'image'|'team'|'ward'|'province'|'member'|'tags';required:boolean;options?:string[];staffOnly?:boolean;readOnly?:boolean;hiddenInTable?:boolean;allowOther?:boolean};
export type RegistrationSchema={group:MemberGroup;version:number;fields:ProfileField[]};
export const roleOptions=['Tổ điều hành','Tổ trưởng','Tổ phó','Thành viên','Huynh đệ mới','Thành viên không thường xuyên','Học sinh'];
export const participationYearKeys:Record<MemberGroup,string> = {
 children:'childrenStartYear',youth:'youthStartYear',congregation:'congregationStartYear',
};
export const schoolClasses=[...Array.from({length:12},(_,i)=>String(i+1)),'Không'];
// Normalize stored schema metadata as well as the defaults during rolling deploys.
export function normalizeRegistrationSchema(schema:RegistrationSchema):RegistrationSchema {
 const canonical=groupFields(schema.group);
 const fields=[...canonical.map(f=>({...schema.fields.find(existing=>existing.key===f.key),...f})),
  ...schema.fields.filter(f=>isProfileFieldAvailable(f.key,schema.group)&&!canonical.some(c=>c.key===f.key))];
 return {...schema,version:Math.max(schema.version,16),fields};
}
export function isProfileFieldAvailable(key:string,group:MemberGroup):boolean {
 return ( !Object.values(participationYearKeys).includes(key)||key===participationYearKeys[group])&&!['job','hometown','personality','participationStartYear'].includes(key)&&(key!=='relativePhone'||group==='children')&&(!['nickname','schoolClass','parentName'].includes(key)||group==='children');
}
const field=(key:string,label:string,type:ProfileField['type']='text',required=false,extra:Partial<ProfileField>={}):ProfileField=>({key,label,type,required,...extra});
function groupFields(group:MemberGroup):ProfileField[]{
 const children=group==='children';
 return [
  field('avatar','Hình ảnh','image',true),field('name','Họ và tên','text',true),field('dharmaName','Pháp danh'),
  field('gender','Giới tính','select',true,{options:['Nam','Nữ']}),field('birthday','Ngày sinh','date',true),
  field('occupation','Nghề nghiệp','select',false,{options:['Không','Học sinh','Sinh viên','Giáo viên','Giảng viên','Nhân viên văn phòng','Công nhân','Kỹ sư','Bác sĩ','Điều dưỡng','Kinh doanh','Buôn bán','Nông dân','Tài xế','Nội trợ','Hưu trí','Lao động tự do','Khác'],allowOther:true,...(children?{staffOnly:true,hiddenInTable:true}:{})}),
  ...(children?[field('schoolClass','Lớp','select',false,{options:[...schoolClasses]})]:[]),
  field('address','Địa chỉ (cũ)','ward',true),
  field('addressNew','Địa chỉ (mới)','text',false,{staffOnly:true,readOnly:true}),field('team','Tổ','team',true),
  field('phone',children?'SĐT Cá nhân (nếu có)':'SĐT Cá nhân','phone',!children),
  ...(children?[field('parentName','Họ và tên PH'),field('relativePhone','SĐT PH','phone')]:[]),
  field('introducedBy','Người giới thiệu','member',false,children?{staffOnly:true,hiddenInTable:true}:{}),
  field('notes','Ghi chú','textarea',false,{staffOnly:true}),field('status','Tình trạng','tags',false,{staffOnly:true,options:recognitionTags.map(t=>t.id)}),
  field('id','ID','text',false,{staffOnly:true,readOnly:true}),field('joined','Ngày ghi nhận hồ sơ','date',false,{staffOnly:true,readOnly:true,hiddenInTable:true}),
  field('caregiver','HĐ chăm sóc','member',false,{staffOnly:true}),
  field(participationYearKeys[group],'Ngày bắt đầu tham gia chúng','year',false,{staffOnly:true}),
  field('position','Vai trò','select',false,{staffOnly:true,options:[...roleOptions]}),
  ...(children?[field('nickname','Mã số')]:[])
 ];
}
// Sheet 1 owns the complete profile; staffOnly marks fields absent from sheet 2.
export const defaultSchemas:Record<MemberGroup,RegistrationSchema>={children:{group:'children',version:16,fields:groupFields('children')},youth:{group:'youth',version:16,fields:groupFields('youth')},congregation:{group:'congregation',version:16,fields:groupFields('congregation')}};
export function profileVisibleFields(schema:RegistrationSchema):ProfileField[]{
 const fields=schema.fields.filter(field=>isProfileFieldAvailable(field.key,schema.group)&&!field.hiddenInTable);
 return [...fields.filter(field=>!['notes','status'].includes(field.key)),...fields.filter(field=>['notes','status'].includes(field.key))];
}
export function profileFieldLabel(field:ProfileField):string{return field.key==='status'?'Tình trạng':field.label;}
export function displayValue(value:string|number|string[]|undefined,field:ProfileField):string{if(field.type==='tags')return recognitionTagText(value)||'Chưa gắn thẻ';if(value===undefined||value==='')return 'Chưa cập nhật';if(field.type==='team')return `Tổ ${value}`;if(field.type==='date'){const parts=String(value).slice(0,10).split('-');return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:String(value);}return String(value);}

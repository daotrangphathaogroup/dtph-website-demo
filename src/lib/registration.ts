import type {MemberGroup} from './types';
export type ProfileValues=Record<string,string|number>;
export type ProfileField={key:string;label:string;type:'text'|'textarea'|'year'|'number'|'phone'|'select'|'date'|'image'|'team'|'ward'|'province'|'member';required:boolean;options?:string[];staffOnly?:boolean;readOnly?:boolean;allowOther?:boolean};
export type RegistrationSchema={group:MemberGroup;version:number;fields:ProfileField[]};
const field=(key:string,label:string,type:ProfileField['type']='text',required=false,extra:Partial<ProfileField>={}):ProfileField=>({key,label,type,required,...extra});
function groupFields(group:MemberGroup):ProfileField[]{
 const children=group==='children';
 return [
  field('avatar','Hình ảnh','image',true),field('name','Họ và tên','text',true),field('dharmaName','Pháp danh'),
  field('gender','Giới tính','select',true,{options:['Nam','Nữ']}),field('birthday','Ngày sinh','date',true),
  field('occupation','Nghề nghiệp','select',false,{options:['Không','Học sinh','Sinh viên','Giáo viên','Giảng viên','Nhân viên văn phòng','Công nhân','Kỹ sư','Bác sĩ','Điều dưỡng','Kinh doanh','Buôn bán','Nông dân','Tài xế','Nội trợ','Hưu trí','Lao động tự do','Khác'],allowOther:true}),field('job',children?'Trường học':'Nơi công tác'),
  field('address','Nơi ở hiện tại','ward',true),field('team','Tổ','team',true),field('hometown','Quê quán','province'),
  field('phone',children?'SĐT Cá nhân (nếu có)':'SĐT Cá nhân','phone',!children),
  ...(children?[field('parentName','Họ và tên PH')]:[]),
  field('relativePhone',children?'SĐT PH':'SĐT Người thân','phone'),field('introducedBy','Người giới thiệu','member'),
  field('notes','Ghi chú','textarea',false,{staffOnly:true}),field('status','Tình trạng','text',false,{staffOnly:true}),
  field('id','ID','text',false,{staffOnly:true,readOnly:true}),field('joined','Ngày tham gia','date',false,{staffOnly:true,readOnly:true}),
  ...(children?[field('personality','Tính cách','textarea',false,{staffOnly:true}),field('nickname','Biệt danh','text',false,{staffOnly:true})]:[field('caregiver','HĐ Chăm sóc','member',false,{staffOnly:true}),field('position','Vị trí','text',false,{staffOnly:true})])
 ];
}
// Sheet 1 owns the complete profile; staffOnly marks fields absent from sheet 2.
export const defaultSchemas:Record<MemberGroup,RegistrationSchema>={children:{group:'children',version:10,fields:groupFields('children')},youth:{group:'youth',version:10,fields:groupFields('youth')},congregation:{group:'congregation',version:10,fields:groupFields('congregation')}};
export function isStudent(occupation:unknown):boolean{return /^(học sinh|sinh viên)$/iu.test(String(occupation??'').trim());}
export function profileFieldLabel(field:ProfileField,values:ProfileValues):string{return field.key==='job'&&isStudent(values.occupation)?'Trường học':field.label;}
export function displayValue(value:string|number|undefined,field:ProfileField):string{if(value===undefined||value==='')return 'Chưa cập nhật';if(field.type==='team')return `Tổ ${value}`;if(field.type==='date'){const parts=String(value).slice(0,10).split('-');return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:String(value);}return String(value);}

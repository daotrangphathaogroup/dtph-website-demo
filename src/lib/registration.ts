import type {MemberGroup} from './types';
export type ProfileValues=Record<string,string|number>;
export type ProfileField={key:string;label:string;type:'text'|'textarea'|'year'|'number'|'phone'|'select'|'date'|'image'|'team';required:boolean;options?:string[];staffOnly?:boolean};
export type RegistrationSchema={group:MemberGroup;version:number;fields:ProfileField[]};
const field=(key:string,label:string,type:ProfileField['type']='text',required=false,options?:string[]):ProfileField=>({key,label,type,required,...(options?{options}:{})});
function adultFields(groupLabel:string):ProfileField[]{return [field('avatar','Ảnh đại diện','image'),field('name','Họ tên','text',true),field('dharmaName','Pháp danh'),field('birthYear','Năm sinh','year'),field('gender','Giới tính','select',false,['Nam','Nữ']),field('phone','SĐT','phone'),field('address','Địa chỉ','textarea'),field('team','Tổ','team'),field('clubSinceYear',`Tham gia ${groupLabel} từ năm`,'year'),field('introducedBy','Người giới thiệu')];}
// Independent definitions even where the initial fields are identical.
export const defaultSchemas:Record<MemberGroup,RegistrationSchema>={
 youth:{group:'youth',version:1,fields:adultFields('Chúng thanh niên')},
 congregation:{group:'congregation',version:1,fields:adultFields('Đạo tràng')},
 children:{group:'children',version:1,fields:[field('avatar','Ảnh đại diện','image'),field('studentCode','Mã số'),field('name','Họ tên','text',true),field('dharmaName','Pháp danh'),field('gender','Giới tính','select',false,['Nam','Nữ','Khác']),field('birthYear','Năm sinh','year'),field('schoolClass','HS lớp'),field('studentPhone','SĐT (Zalo HS)','phone'),field('parentName','Họ tên PH'),field('parentPhone','SĐT PH','phone'),field('address','Địa chỉ','textarea'),{...field('attendance2026','Số lần học năm 2026','number'),staffOnly:true},{...field('studyDate','Thứ / Ngày / Tháng','date'),staffOnly:true},{...field('remarks','Nhận xét','textarea'),staffOnly:true}]}
};
export function displayValue(value:string|number|undefined,field:ProfileField):string{if(value===undefined||value==='')return 'Chưa cập nhật';if(field.type==='team')return `Tổ ${value}`;if(field.type==='date')return new Date(String(value)+'T00:00:00').toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});return String(value);}

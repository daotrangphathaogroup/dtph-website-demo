import type {Role,Store} from './types';
export type Session={id:string;username:string;displayName:string;role:Role};
export type ClassInfo={id:string;name:string;group_id:string};
export type Bootstrap={schemas?:Record<import('./types').MemberGroup,import('./registration').RegistrationSchema>;managedClassIds:string[];classes:ClassInfo[];session:Session|null;store:Store};
export async function api<T={ok:boolean}>(path:string,method='GET',body?:unknown):Promise<T>{const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const data=await response.json().catch(()=>({error:'Dịch vụ chưa sẵn sàng.'}));if(!response.ok)throw new Error(data.error??'Không thể xử lý yêu cầu.');return data as T;}

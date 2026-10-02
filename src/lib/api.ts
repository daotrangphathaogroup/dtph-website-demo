import type { Role, Store } from './types';
export type Session={id:string;role:Role;demo:boolean};
export type Bootstrap={session:Session|null;store:Store};
export type Challenge={id:string;token:string;memberId:string;phone:string;purpose:'login'|'registration'|'password_change';code?:string;expiresAt:number;message?:string};
export class ApiError extends Error {requiresMemberCode:boolean;constructor(message:string,requiresMemberCode=false){super(message);this.requiresMemberCode=requiresMemberCode;}}
export async function api<T= {ok:boolean}>(path:string,method='GET',body?:unknown):Promise<T>{const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const data=await response.json().catch(()=>({error:'Backend chưa sẵn sàng. Vui lòng chạy npm run dev.'}));if(!response.ok)throw new ApiError(data.error??'Không thể xử lý yêu cầu.',!!data.requiresMemberCode);return data as T;}

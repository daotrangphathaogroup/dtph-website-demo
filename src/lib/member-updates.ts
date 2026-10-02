import type {Enrollment, Field, Store} from './types';
export function withRequirement(store:Store,field:Field,required:boolean):Store{
 return {...store,requirements:{...store.requirements,[field]:required}};
}
export function withEnrollment(store:Store,memberId:string,classId:string,enrollment?:Enrollment):Store{
 const others=store.enrollments.filter(e=>e.memberId!==memberId||e.classId!==classId);
 return {...store,enrollments:enrollment?[...others,enrollment]:others};
}
/** Keep one update in flight per item; roll back only that item on failure. */
export async function saveOptimistically({key,pending,onPending,apply,save,rollback}:{key:string;pending:Set<string>;onPending:(key:string,busy:boolean)=>void;apply:()=>void;save:()=>Promise<void>;rollback:()=>void}):Promise<boolean>{
 if(pending.has(key))return false;
 pending.add(key);onPending(key,true);
 try{apply();await save();return true;}catch(error){rollback();throw error;}finally{pending.delete(key);onPending(key,false);}
}

import type {Member,MemberGroup} from './types';
export type AgeBand='under13'|'13to17'|'18to30'|'31to45'|'46to60'|'over60'|'unknown';
export const ageBands:{key:AgeBand;label:string}[]=[{key:'under13',label:'Dưới 13 tuổi'},{key:'13to17',label:'13–17 tuổi'},{key:'18to30',label:'18–30 tuổi'},{key:'31to45',label:'31–45 tuổi'},{key:'46to60',label:'46–60 tuổi'},{key:'over60',label:'Trên 60 tuổi'},{key:'unknown',label:'Chưa có ngày sinh'}];
export type DashboardFilters={group:MemberGroup|'all';ward:string;team:string;age:AgeBand|'all';year:string;month:number|null};
export const emptyDashboardFilters:DashboardFilters={group:'all',ward:'all',team:'all',age:'all',year:'all',month:null};
export function todayInVietnam(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});}
export function memberAge(member:Member,today=todayInVietnam()):number|null{
 const birth=String(member.profileData?.birthday??member.birthday??'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(birth)||birth>today||Number.isNaN(Date.parse(birth))||new Date(birth).toISOString().slice(0,10)!==birth)return null;
 const age=Number(today.slice(0,4))-Number(birth.slice(0,4))-(today.slice(5)<birth.slice(5)?1:0);return age>=0?age:null;
}
export function ageBand(age:number|null):AgeBand{return age===null?'unknown':age<13?'under13':age<18?'13to17':age<=30?'18to30':age<=45?'31to45':age<=60?'46to60':'over60';}
export function registrationDate(member:Member):string{
 if(member.submittedAt){const date=new Date(member.submittedAt);if(!Number.isNaN(date.valueOf()))return date.toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});}
 return /^\d{4}-\d{2}-\d{2}$/.test(member.joined??'')?member.joined:'';
}
export function memberWard(member:Member){return String(member.profileData?.address??member.address??'').trim();}
export function memberTeam(member:Member){return String(member.profileData?.team??member.team??'');}
export function filterDashboard(members:Member[],filters:DashboardFilters,scope?:MemberGroup,today=todayInVietnam()):Member[]{
 return members.filter(m=>{
  const date=registrationDate(m);
  return (!scope||m.group===scope)&&(filters.group==='all'||m.group===filters.group)&&(filters.ward==='all'||(filters.ward==='unknown'?!memberWard(m):memberWard(m)===filters.ward))&&(filters.team==='all'||(filters.team==='unknown'?!memberTeam(m):memberTeam(m)===filters.team))&&(filters.age==='all'||ageBand(memberAge(m,today))===filters.age)&&(filters.year==='all'||date.slice(0,4)===filters.year)&&(filters.month===null||Number(date.slice(5,7))===filters.month);
 });
}
export type Distribution={label:string;count:number};
export function distribution(members:Member[],dimension:'ward'|'age'|'gender',today=todayInVietnam()):Distribution[]{
 if(dimension==='age')return ageBands.map(b=>({label:b.label,count:members.filter(m=>ageBand(memberAge(m,today))===b.key).length}));
 const counts=new Map<string,number>();for(const member of members){const label=dimension==='ward'?memberWard(member)||'Chưa có phường':String(member.profileData?.gender??'')||'Chưa có giới tính';counts.set(label,(counts.get(label)??0)+1);}
 return [...counts].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'vi'));
}
export function monthlyRegistrations(members:Member[]):number[]{const counts=Array<number>(12).fill(0);for(const member of members){const month=Number(registrationDate(member).slice(5,7));if(month>=1&&month<=12)counts[month-1]++;}return counts;}

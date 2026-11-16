import type {Member, MemberGroup} from './types';
import {teamsForGroup} from './areas.ts';
import {memberAge, memberTeam, memberWard} from './dashboard.ts';

export const operationGroups: MemberGroup[] = ['children','youth','congregation'];
export type WorkKind = 'all'|'unassigned'|'contact'|'links'|'transition'|'team';
export const workLabels: Record<WorkKind,string> = {
  all:'Tất cả hồ sơ',unassigned:'Chưa phân công',contact:'Kênh liên lạc',links:'Liên kết cần kiểm tra',transition:'Rà soát nhóm tuổi',team:'Chưa phân tổ',
};
export type OperationFilters = {group:MemberGroup|'all';team:string;ward:string};
export const emptyOperationFilters: OperationFilters = {group:'all',team:'all',ward:'all'};
export function filterOperations(members:Member[],filters:OperationFilters){
  return members.filter(m=>(filters.group==='all'||m.group===filters.group)&&(filters.team==='all'||(filters.team==='unknown'?!teamsForGroup(m.group).map(String).includes(memberTeam(m)):memberTeam(m)===filters.team))&&(filters.ward==='all'||(filters.ward==='unknown'?!memberWard(m):memberWard(m)===filters.ward)));
}
const phoneValid=(value:unknown)=>/^0[35789]\d{8}$/.test(String(value??'').replace(/[\s().-]/g,'').replace(/^\+?84(?=[35789]\d{8}$)/,'0'));
export function contactIssue(m:Member){
  const child=m.group==='children';
  const value=child?m.profileData?.relativePhone:(m.profileData?.phone??m.phone);
  if(phoneValid(value))return '';
  return String(value??'').trim()?`SĐT ${child?'PH':'cá nhân'} cần xác minh`:`Chưa có SĐT ${child?'PH':'cá nhân'}`;
}
export function transitionReview(m:Member,today:string){
  const age=memberAge(m,today);if(age===null)return '';
  const expected:MemberGroup=age<16?'children':age<=40?'youth':'congregation';
  if(expected!==m.group)return `Đang ghi nhận ${age} tuổi · cần rà soát chúng`;
  const milestone=m.group==='children'?16:m.group==='youth'?41:null;if(!milestone)return '';
  const birth=String(m.profileData?.birthday??m.birthday);
  const target=Date.UTC(Number(birth.slice(0,4))+milestone,Number(birth.slice(5,7))-1,Number(birth.slice(8,10)));
  const days=Math.round((target-Date.parse(today+'T00:00:00Z'))/86400000);
  return days>=0&&days<=90?`Tròn ${milestone} tuổi trong ${days} ngày`:'';
}
export function pendingDate(m:Member,today:string){
  const timestamp=Date.parse(m.submittedAt??'');
  return Number.isFinite(timestamp)&&timestamp<=Date.parse(today+'T23:59:59.999+07:00')?timestamp:Infinity;
}
export type MemberWork = {unassigned:boolean;links:boolean;contact:string;transition:string;team:boolean;caregiver:string};
export function matchesWork(flag:MemberWork,kind:WorkKind){return kind==='all'||Boolean(flag[kind]);}
export function operationsReport(members:Member[],directoryMembers:Member[],today:string){
  const directory=new Map(directoryMembers.filter(m=>m.registrationStatus==='approved').map(m=>[m.id,m]));
  const rows=[...new Map(members.filter(m=>m.registrationStatus==='approved').map(m=>[m.id,m])).values()];
  const flags=new Map<string,MemberWork>();
  const counts={all:rows.length,unassigned:0,contact:0,links:0,transition:0,team:0};
  const teamIds = teamsForGroup().map(String);
  const matrix=[...teamIds,'unknown'].map(team=>({team,cells:operationGroups.map(group=>({group,total:0,unassigned:0,links:0}))}));
  const caregiverCounts=new Map<string,{id:string;name:string;counts:number[];total:number}>();
  const wardCounts=new Map<string,number[]>();
  for(const m of rows){
    const groupIndex=operationGroups.indexOf(m.group);if(groupIndex<0)continue;
    const caregiver=String(m.profileData?.caregiver??'').trim();
    const valid=Boolean(caregiver&&caregiver!==m.id&&directory.has(caregiver));
    const team = memberTeam(m);
    const teamIndex = teamsForGroup(m.group).some(value => String(value) === team) ? teamIds.indexOf(team) : -1;
    const flag:MemberWork={unassigned:!caregiver,links:Boolean(caregiver&&!valid),contact:contactIssue(m),transition:transitionReview(m,today),team:teamIndex<0,caregiver:valid?caregiver:''};
    flags.set(m.id,flag);
    for(const key of ['unassigned','contact','links','transition','team'] as const)if(flag[key])counts[key]++;
    const cell=matrix[teamIndex<0?teamIds.length:teamIndex].cells[groupIndex];cell.total++;if(flag.unassigned)cell.unassigned++;if(flag.links)cell.links++;
    if(valid){
      let entry=caregiverCounts.get(caregiver);
      if(!entry){entry={id:caregiver,name:directory.get(caregiver)!.name,counts:[0,0,0],total:0};caregiverCounts.set(caregiver,entry);}
      entry.counts[groupIndex]++;entry.total++;
    }
    const ward=memberWard(m);let numbers=wardCounts.get(ward);if(!numbers){numbers=[0,0,0];wardCounts.set(ward,numbers);}numbers[groupIndex]++;
  }
  const caregivers=[...caregiverCounts.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'vi'));
  const wards=[...wardCounts].map(([ward,counts])=>({ward,counts,total:counts.reduce((s,n)=>s+n,0)})).sort((a,b)=>b.total-a.total||a.ward.localeCompare(b.ward,'vi'));
  return {rows,counts,flags,matrix,caregivers,wards,assigned:caregivers.reduce((s,c)=>s+c.total,0),groups:operationGroups.map(group=>({group,total:rows.filter(m=>m.group===group).length}))};
}

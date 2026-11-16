/** Phân Tổ sinh hoạt theo bản đồ do Đạo Tràng cung cấp, không phải địa giới hành chính mới. */
import type {MemberGroup} from './types';
export type Team = 1 | 2 | 3 | 4 | 5;
const baseTeams = [1,2,3] as const;
const allTeams = [1,2,3,4,5] as const;
export function teamsForGroup(group?:MemberGroup|'all'|null){return group==='children'||group==='youth'?baseTeams:allTeams;}
export function teamOptionLabel(team:number|string){return Number(team)===4?'Tổ 4 · Trị An':Number(team)===5?'Tổ 5 · Thị trấn Vĩnh An':`Tổ ${team}`;}
export const teamAreas:Record<Team,readonly string[]>={
 1:['Bửu Long','Tân Hạnh','Hóa An','Bửu Hòa','Tân Vạn','Thống Nhất','Hiệp Hòa','Quang Vinh','Trung Dũng'],
 2:['Tân Phong','Trảng Dài','Hố Nai','Tân Biên','Tân Hòa','Tân Hiệp','Tân Mai'],
 3:['Long Bình','An Bình','Long Bình Tân','An Hòa','Long Hưng','Phước Tân','Tam Phước','Bình Đa','Tam Hiệp'],
 4:['Trị An'],
 5:['Thị trấn Vĩnh An']
};
export const wards=Object.values(teamAreas).flat().sort((a,b)=>a.localeCompare(b,'vi'));

const currentWards: Record<string, readonly string[]> = {
 'Biên Hòa':['Tân Hạnh','Hóa An','Bửu Hòa','Tân Vạn'],
 'Trấn Biên':['Bửu Long','Quang Vinh','Trung Dũng','Thống Nhất','Hiệp Hòa','An Bình'],
 'Tam Hiệp':['Tân Hiệp','Tân Mai','Bình Đa','Tam Hiệp'],
 'Long Bình':['Hố Nai','Tân Biên','Long Bình'],
 'Trảng Dài':['Trảng Dài'],
 'Hố Nai':['Tân Hòa'],
 'Long Hưng':['Long Bình Tân','An Hòa','Long Hưng'],
 'Tân Triều':['Tân Phong'],
 'Phước Tân':['Phước Tân'],
 'Tam Phước':['Tam Phước'],
 // NQ 1662/NQ-UBTVQH15: former Trị An and Vĩnh An are in the new Trị An commune.
 'Trị An':['Trị An','Thị trấn Vĩnh An'],
};
const wardCrosswalk = new Map(
 Object.entries(currentWards).flatMap(([current, former]) => former.map(ward => [ward, current] as const))
);
export function currentWard(former: unknown): string {
 return wardCrosswalk.get(String(former ?? '').trim()) ?? '';
}
export function getTeam(area:string,group?:MemberGroup|null):Team|null{
 for(const team of teamsForGroup(group))if(teamAreas[team].includes(area))return team;
 return null;
}
export function teamLabel(area:string):string{const team=getTeam(area);return team===null?'Chưa phân tổ':`Tổ ${team}`;}
export function areaOptions(existing:readonly string[]):string[]{return [...wards,...[...new Set(existing)].filter(area=>area&&!wards.includes(area)).sort((a,b)=>a.localeCompare(b,'vi'))];}
export function matchesTeam(area:string,filter:string):boolean{return filter==='all'||(filter==='unassigned'?getTeam(area)===null:String(getTeam(area))===filter);}

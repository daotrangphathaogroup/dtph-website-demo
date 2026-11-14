/** Phân Tổ sinh hoạt theo bản đồ do Đạo Tràng cung cấp, không phải địa giới hành chính mới. */
export type Team = 1 | 2 | 3;
export const teamAreas:Record<Team,readonly string[]>={
 1:['Bửu Long','Tân Hạnh','Hóa An','Bửu Hòa','Tân Vạn','Thống Nhất','Hiệp Hòa'],
 2:['Tân Phong','Trảng Dài','Hố Nai','Tân Biên','Tân Hòa','Tân Hiệp'],
 3:['Long Bình','An Bình','Long Bình Tân','An Hòa','Long Hưng','Phước Tân','Tam Phước']
};
export const unassignedWards=['Bình Đa','Quang Vinh','Tam Hiệp','Tân Mai','Trung Dũng'] as const;
export const wards=[...Object.values(teamAreas).flat(),...unassignedWards].sort((a,b)=>a.localeCompare(b,'vi'));

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
};
const wardCrosswalk = new Map(
 Object.entries(currentWards).flatMap(([current, former]) => former.map(ward => [ward, current] as const))
);
export function currentWard(former: unknown): string {
 return wardCrosswalk.get(String(former ?? '').trim()) ?? '';
}
export function getTeam(area:string):Team|null{
 for(const team of [1,2,3] as const)if(teamAreas[team].includes(area))return team;
 return null;
}
export function teamLabel(area:string):string{const team=getTeam(area);return team===null?'Chưa phân tổ':`Tổ ${team}`;}
export function areaOptions(existing:readonly string[]):string[]{return [...wards,...[...new Set(existing)].filter(area=>area&&!wards.includes(area)).sort((a,b)=>a.localeCompare(b,'vi'))];}
export function matchesTeam(area:string,filter:string):boolean{return filter==='all'||(filter==='unassigned'?getTeam(area)===null:String(getTeam(area))===filter);}

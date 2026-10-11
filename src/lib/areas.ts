/** Phân Tổ sinh hoạt theo bản đồ do Đạo Tràng cung cấp, không phải địa giới hành chính mới. */
export type Team = 1 | 2 | 3;
export const teamAreas:Record<Team,readonly string[]>={
 1:['Bửu Long','Tân Hạnh','Hóa An','Bửu Hòa','Tân Vạn','Thống Nhất','Hiệp Hòa'],
 2:['Tân Phong','Trảng Dài','Hố Nai','Tân Biên','Tân Hòa','Tân Hiệp'],
 3:['Long Bình','An Bình','Long Bình Tân','An Hòa','Long Hưng','Phước Tân','Tam Phước']
};
export const wards=Object.values(teamAreas).flat().sort((a,b)=>a.localeCompare(b,'vi'));
export function getTeam(area:string):Team|null{
 for(const team of [1,2,3] as const)if(teamAreas[team].includes(area))return team;
 return null;
}
export function teamLabel(area:string):string{const team=getTeam(area);return team===null?'Chưa phân tổ':`Tổ ${team}`;}
export function areaOptions(existing:readonly string[]):string[]{return [...wards,...[...new Set(existing)].filter(area=>area&&!wards.includes(area)).sort((a,b)=>a.localeCompare(b,'vi'))];}
export function matchesTeam(area:string,filter:string):boolean{return filter==='all'||(filter==='unassigned'?getTeam(area)===null:String(getTeam(area))===filter);}

import type { Store } from './types';
export const normalize = (text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
export const today = ()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const dateLabel = (date:string)=>date?new Date(date+'T12:00:00').toLocaleDateString('vi-VN'):'Chưa cập nhật';
export const initials = (name:string)=>name.split(' ').slice(-2).map(s=>s[0]).join('');
/** Rank exact IDs, prefixes and approximate name tokens without remote data. */
export function searchScore(member:Store['members'][number],query:string):number {
 const q=normalize(query.trim());if(!q)return 1;const id=normalize(member.id);const name=normalize(member.name);
 if(id===q)return 100;if(id.startsWith(q))return 90;if(name===q)return 85;if(name.includes(q))return 80;if(id.includes(q))return 70;
 const distance=(a:string,b:string)=>{let prev=Array.from({length:b.length+1},(_,i)=>i);let prior=prev;for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++){row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+Number(a[i-1]!==b[j-1]));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],prior[j-2]+1);}prior=prev;prev=row;}return prev[b.length];};
 if(/^ph\d{3,}$/.test(q)&&distance(q,id)<=1)return 55;
 const tokens=q.split(/\s+/);const words=name.split(/\s+/);const scores=tokens.map(token=>Math.max(...words.map(word=>word.startsWith(token)?1:token.length>=3?1-distance(token,word)/Math.max(token.length,word.length):0)));
 return scores.every(score=>score>=.65)?40+scores.reduce((a,b)=>a+b,0)/scores.length*20:0;
}

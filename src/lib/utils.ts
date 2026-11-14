export const initials = (name:string)=>name.split(' ').slice(-2).map(s=>s[0]).join('');

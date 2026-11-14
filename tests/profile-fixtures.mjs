import sharp from 'sharp';
const png=await sharp({create:{width:30,height:40,channels:3,background:'#ab2933'}}).png().toBuffer();
export function validValues(overrides={}){return {avatar:'data:image/png;base64,'+png.toString('base64'),name:'Huynh đệ thử',gender:'Nam',birthday:'2000-02-29',address:'Tân Hạnh',team:1,phone:'0901234567',...overrides};}
export function memoryStorage(){const images=new Map();return {images,async put(key,bytes){images.set(key,bytes);},async get(key){return images.get(key);}};}

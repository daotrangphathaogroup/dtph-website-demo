import {mkdir,open,readFile,unlink} from 'node:fs/promises';
import {unlinkSync} from 'node:fs';
import {createBackend} from './backend.mjs';
import {createProductionBackend} from './production.mjs';
const key=Symbol.for('phat-hao.backend.runtime');
async function startLocal(){
 await mkdir('./.local',{recursive:true});const lock='./.local/server.lock';
 try{const handle=await open(lock,'wx');await handle.writeFile(String(process.pid));await handle.close();}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(await readFile(lock,'utf8'));let active=false;try{if(Number.isInteger(pid)&&pid>0){process.kill(pid,0);active=true;}}catch(e){if(e.code!=='ESRCH')throw e;}if(active)throw new Error('Database local đang được tiến trình khác sử dụng. Dừng backend cũ trước khi chạy Next.js.');await unlink(lock);const handle=await open(lock,'wx');await handle.writeFile(String(process.pid));await handle.close();}
 try{const backend=await createBackend();process.once('exit',()=>{try{unlinkSync(lock);}catch{}});return backend;}catch(e){await unlink(lock).catch(()=>{});throw e;}
}
export function getBackend(){return globalThis[key]??= (process.env.NODE_ENV==='production'||process.env.APP_BACKEND==='cloud'?createProductionBackend():startLocal()).catch(error=>{delete globalThis[key];throw error;});}

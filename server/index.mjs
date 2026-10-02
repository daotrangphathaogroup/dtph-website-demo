import { createBackend } from './backend.mjs';
import { mkdir,open,readFile,unlink } from 'node:fs/promises';
// PGlite data directories must have a single owner process.
await mkdir('./.local',{recursive:true});
const lockPath='./.local/server.lock';
async function acquireLock(){
 try{const handle=await open(lockPath,'wx');await handle.writeFile(String(process.pid));await handle.close();}
 catch(e){if(e.code!=='EEXIST')throw e;const pid=Number(await readFile(lockPath,'utf8'));let active=false;try{if(Number.isInteger(pid)&&pid>0){process.kill(pid,0);active=true;}}catch(error){if(error.code!=='ESRCH')throw error;}
  if(active)throw new Error('Backend đang chạy. Dừng tiến trình cũ trước khi mở lại database local.');
  await unlink(lockPath);const handle=await open(lockPath,'wx');await handle.writeFile(String(process.pid));await handle.close();
 }
}
await acquireLock();
let backend;
try{backend=await createBackend();}catch(e){await unlink(lockPath);throw e;}
const {app,db}=backend;
const server=app.listen(3001,'127.0.0.1',()=>console.log('Backend local: http://127.0.0.1:3001 (PGlite; SMS mô phỏng)'));
let closing=false;
async function close(exitCode=0){if(closing)return;closing=true;await new Promise(resolve=>server.close(resolve));await db.close();await unlink(lockPath).catch(()=>{});process.exit(exitCode);}
server.on('error',e=>{console.error(e.message);void close(1);});
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());

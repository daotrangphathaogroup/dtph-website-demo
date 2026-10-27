import {mkdir,open,readFile,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createBackend} from '../server/backend.mjs';
import {createPostgresDatabase} from '../server/postgres.mjs';
import {productionConfig} from '../server/providers.mjs';
import {resetMemberData} from '../server/reset-data.mjs';
const mode=process.argv[2];if(!['--local','--cloud'].includes(mode)||!process.argv.includes('--execute'))throw new Error('Usage: node --experimental-strip-types [--env-file=.env.production] scripts/reset-member-data.mjs --local|--cloud --execute');
const cloud=mode==='--cloud',backupDir=resolve('.local/backups/'+new Date().toISOString().replaceAll(':','-')+(cloud?'-supabase':'-local'));
let db,storage,locked=false;const lock='.local/server.lock';
try{
 if(cloud){if(!process.env.MIGRATION_DATABASE_URL)throw new Error('MIGRATION_DATABASE_URL is required.');storage=productionConfig().storage;db=createPostgresDatabase({connectionString:process.env.MIGRATION_DATABASE_URL,ca:process.env.DATABASE_SSL_CA_FILE?await readFile(process.env.DATABASE_SSL_CA_FILE,'utf8'):process.env.DATABASE_SSL_CA});await db.query('SELECT id FROM members LIMIT 1');}
 else{await mkdir('.local',{recursive:true});try{const pid=Number(await readFile(lock,'utf8'));if(pid>0){try{process.kill(pid,0);throw new Error('Stop the local backend before reset.');}catch(e){if(e.code!=='ESRCH')throw e;}}await unlink(lock);}catch(e){if(e.code!=='ENOENT')throw e;}const handle=await open(lock,'wx');await handle.writeFile(String(process.pid));await handle.close();locked=true;({db}=await createBackend({seedData:false}));}
 const migration=cloud?(await readFile(new URL('../server/migrations/008_registration_rejection.sql',import.meta.url),'utf8'))+'\n'+(await readFile(new URL('../server/migrations/010_workbook_profiles.sql',import.meta.url),'utf8')):null;
 const summary=await resetMemberData({db,backupDir,storage,uploadDir:resolve('.local/avatars'),prepare:migration?tx=>tx.query(migration):undefined});
 const counts=await db.query('SELECT (SELECT count(*) FROM members)::int AS members,(SELECT count(*) FROM classes)::int AS classes');if(counts.rows[0].members||counts.rows[0].classes)throw new Error('Reset verification failed.');
 console.log(JSON.stringify({mode:cloud?'supabase':'local',...summary,remaining:counts.rows[0],backupDir}));
}catch(e){console.error('Reset failed:',e.code??e.name);process.exitCode=1;}finally{await db?.close();if(locked)await unlink(lock).catch(()=>{});}

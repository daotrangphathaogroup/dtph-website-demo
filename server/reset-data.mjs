import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
// This function is only called by the explicit maintenance CLI, never on startup.
export async function resetMemberData({db,backupDir,storage,uploadDir,prepare}){
 await mkdir(backupDir,{recursive:true,mode:0o700});
 const keys=new Set(),summary=await db.transaction(async tx=>{
  await tx.query('LOCK TABLE members, classes, staff_accounts IN ACCESS EXCLUSIVE MODE');
  const staff=(await tx.query('SELECT id,password_hash,role FROM staff_accounts ORDER BY id')).rows;
  const tables=(await tx.query("SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_type='BASE TABLE' ORDER BY table_name")).rows.map(r=>r.table_name).filter(t=>!['staff_accounts','staff_sessions','app_meta','registration_schemas','rate_limits'].includes(t));
  const snapshot={createdAt:new Date().toISOString(),tables:{}};
  for(const table of tables){if(!/^[a-z_]+$/.test(table))throw new Error('Unexpected table name.');snapshot.tables[table]=(await tx.query('SELECT * FROM "'+table+'"')).rows;}
  await writeFile(path.join(backupDir,'records.json'),JSON.stringify(snapshot),{mode:0o600,flag:'wx'});
  for(const row of snapshot.tables.members??[]){const key=row.avatar?.match(/^\/api\/avatars\/([a-f0-9-]{36}\.webp)$/)?.[1];if(key)keys.add(key);}
  await mkdir(path.join(backupDir,'avatars'),{mode:0o700});let missing=0;
  for(const key of keys){try{const bytes=storage?await storage.get(key):await readFile(path.join(uploadDir,key));await writeFile(path.join(backupDir,'avatars',key),bytes,{mode:0o600});}catch(e){if(e.code==='ENOENT'||e.name==='NoSuchKey'||e.$metadata?.httpStatusCode===404)missing++;else throw e;}}
  if(prepare)await prepare(tx);
  await tx.query('TRUNCATE TABLE members, classes, registration_fields, audit_log CASCADE');
  await tx.query("DELETE FROM app_meta WHERE key='local_dashboard_demo_v1'");
  const after=(await tx.query('SELECT id,password_hash,role FROM staff_accounts ORDER BY id')).rows;
  if(JSON.stringify(staff)!==JSON.stringify(after))throw new Error('Staff accounts changed during reset.');
  await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ('source-dev','member_data_reset',$1)",[JSON.stringify({members:snapshot.tables.members?.length??0,classes:snapshot.tables.classes?.length??0})]);
  return {membersRemoved:snapshot.tables.members?.length??0,classesRemoved:snapshot.tables.classes?.length??0,staffPreserved:staff.length,missingOldImages:missing};
 });
 const failed=[];for(const key of keys)try{if(storage)await storage.remove(key);else await rm(path.join(uploadDir,key),{force:true});}catch{failed.push(key);}
 if(failed.length)await writeFile(path.join(backupDir,'pending-avatar-cleanup.json'),JSON.stringify(failed),{mode:0o600});
 return {...summary,imagesRemoved:keys.size-failed.length,imagesPendingCleanup:failed.length};
}

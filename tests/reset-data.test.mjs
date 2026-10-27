import {test} from 'node:test';
import {seed} from './fixtures/seed.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBackend} from '../server/backend.mjs';
import {resetMemberData} from '../server/reset-data.mjs';
test('Explicit reset backs up data, removes old records, preserves credentials and does not reseed on restart',async()=>{
 const backupDir=await mkdtemp(join(tmpdir(),'ph-reset-')), {db}=await createBackend({dataDir:'memory://',seedData:seed});
 try{const staff=(await db.query('SELECT * FROM staff_accounts')).rows;const count=(await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n;
  const result=await resetMemberData({db,backupDir,uploadDir:join(backupDir,'none')});assert.equal(result.membersRemoved,count);assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,0);assert.equal((await db.query('SELECT count(*)::int AS n FROM classes')).rows[0].n,0);assert.deepEqual((await db.query('SELECT * FROM staff_accounts')).rows,staff);
  const backup=JSON.parse(await readFile(join(backupDir,'records.json'),'utf8'));assert.equal(backup.tables.members.length,count);assert.equal(backup.tables.staff_accounts,undefined);
  await createBackend({database:db});assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,0);
 }finally{await db.close();await rm(backupDir,{recursive:true,force:true});}
});

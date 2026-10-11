import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {createBackend,passwordHash} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';
import {createPostgresDatabase} from '../server/postgres.mjs';
import {productionConfig,createR2Storage} from '../server/providers.mjs';
function client(app,origin='http://127.0.0.1:5173'){return async(url,method='GET',body,cookie,requestOrigin=origin)=>{const response=await handleRequest(app,new Request(origin+'/api'+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(method!=='GET'&&requestOrigin?{Origin:requestOrigin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:response.status,body:response.headers.get('content-type')?.includes('application/json')?await response.json():null,cookie:response.headers.getSetCookie().find(c=>c.startsWith('ph_staff_session='))?.split(';')[0],cookies:response.headers.getSetCookie()};};}
test('Staff portal access, legacy endpoints, scoped management and independent staff accounts',async t=>{
 let time=Date.now();const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false,now:()=>time});const call=client(app);let admin,manager;
 try{
  await t.test('anonymous clients cannot read private data or create staff; old member login APIs are gone',async()=>{
   const state=await call('/bootstrap');assert.equal(state.body.session,null);assert.deepEqual(state.body.store.members,[]);assert.equal(state.body.authFeatures,undefined);
   for(const url of ['/auth/login','/auth/register','/auth/verify','/auth/password','/auth/google/start','/auth/google/callback'])assert.equal((await call(url,url.endsWith('start')||url.endsWith('callback')?'GET':'POST',url.endsWith('start')||url.endsWith('callback')?undefined:{})).status,404);
   assert.equal((await call('/admin/accounts','POST',{username:'hacker',displayName:'Hacker',password:'Password@123',role:'admin'})).status,401);assert.equal((await call('/admin/accounts')).status,401);
   assert.equal((await call('/members/PH00001','PATCH',{name:'Hacker'})).status,401);
  });
  await t.test('admin login uses username only; cookies are private and old member sessions cannot enter',async()=>{
   for(const username of ['PH00001','0901200000','member@example.com'])assert.equal((await call('/admin/login','POST',{username,password:'PhatHao@123'})).status,401);
   assert.equal((await call('/admin/login','POST',{username:'admin',password:'Wrong@123'})).status,401);
   const result=await call('/admin/login','POST',{username:'ADMIN',password:'PhatHao@123'});assert.equal(result.status,200);assert.match(result.cookies[0],/HttpOnly/);assert.match(result.cookies[0],/SameSite=Strict/);admin=result.cookie;
   manager=(await call('/admin/login','POST',{username:'manager',password:'PhatHao@123'})).cookie;
   const state=(await call('/bootstrap','GET',undefined,admin)).body;assert.equal(state.session.id,'local-admin');assert.equal(state.session.displayName,'Quản lý tổng');assert.equal(state.store.members.length,36);assert.equal(state.store.requirements.password,undefined);assert.equal((await db.query('SELECT count(*)::int AS n FROM accounts')).rows[0].n,0);
   assert.equal((await call('/bootstrap','GET',undefined,'ph_session=old-member-cookie')).body.session,null);
  });
  await t.test('class managers receive only assigned learners and cannot manage another class or staff',async()=>{
   const state=(await call('/bootstrap','GET',undefined,manager)).body;assert.equal(state.store.members.length,18);assert.equal(state.session.role,'class_manager');assert.equal((await call('/admin/accounts','POST',{username:'other',displayName:'Other',password:'Password@123',role:'admin'},manager)).status,403);
   assert.equal((await call('/members/PH00001','PATCH',{name:'Wrong'},manager)).status,403);
   assert.equal((await call('/classes/not-assigned/members/PH00001','PATCH',{name:'Wrong'},manager)).status,403);
   assert.equal((await call('/classes/tldd-01/members/PH00036','PATCH',{name:'Wrong'},manager)).status,404);
   const changed=await call('/classes/tldd-01/members/PH00001','PATCH',{name:'Học viên cập nhật',area:'Tân Phong',team:1},manager);assert.equal(changed.status,200);assert.equal(changed.body.member.team,2);
   assert.equal((await call('/members/PH00001','PATCH',{area:'Không có'},admin)).status,400);
   assert.equal((await call('/members/PH00001','PATCH',{name:'Giữ phường',area:'Tân Phong'},admin)).status,200);
  });
  await t.test('admins create independent staff accounts and assignments without creating a member',async()=>{
   const before=(await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n;
   assert.equal((await call('/admin/accounts','POST',{username:'new-manager',displayName:'Nhân sự mới',password:'Password@123',role:'class_manager',classIds:['tldd-01']},admin)).status,201);
   assert.equal((await call('/admin/accounts','POST',{username:'NEW-MANAGER',displayName:'Trùng',password:'Password@123',role:'admin'},admin)).status,409);
   assert.equal((await call('/admin/accounts','POST',{username:'invalid-class',displayName:'Wrong',password:'Password@123',role:'class_manager',classIds:['not-found']},admin)).status,400);assert.equal((await db.query('SELECT id FROM staff_accounts WHERE username=$1',['invalid-class'])).rows.length,0);
   assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,before);const accounts=(await call('/admin/accounts','GET',undefined,admin)).body.accounts;assert.equal(accounts.length,3);assert.ok(accounts.every(a=>!('password_hash' in a)));
   const login=await call('/admin/login','POST',{username:'new-manager',password:'Password@123'});assert.equal(login.status,200);assert.equal((await call('/bootstrap','GET',undefined,login.cookie)).body.store.members.length,18);
  });
  await t.test('only administrators change configuration; admin enrollments respect class scopes',async()=>{
   assert.equal((await call('/requirements/password','PATCH',{required:true},admin)).status,400);assert.equal((await call('/requirements/email','PATCH',{required:true},manager)).status,403);assert.equal((await call('/requirements/email','PATCH',{required:true},admin)).status,200);
   assert.equal((await call('/enrollments/other/PH00001','DELETE',{},manager)).status,403);assert.equal((await call('/enrollments/tldd-01/PH00001','DELETE',{},manager)).status,200);assert.equal((await call('/classes/tldd-01/members/PH00001','PATCH',{name:'No longer in class'},manager)).status,404);
   const join=await call('/enrollments/tldd-01/PH00001','PUT',{},admin);assert.equal(join.status,200);assert.equal((await call('/enrollments/tldd-01/PH00001','PUT',{},admin)).body.enrollment.date,join.body.enrollment.date);
  });
  await t.test('cross-origin and missing-origin mutations rejected; logout and expiry invalidate sessions',async()=>{
   assert.equal((await call('/admin/accounts','POST',{},admin,'https://attacker.test')).status,403);assert.equal((await call('/admin/login','POST',{username:'admin',password:'PhatHao@123'},undefined,null)).status,403);
   assert.equal((await call('/admin/logout','POST',{},manager)).status,200);assert.equal((await call('/bootstrap','GET',undefined,manager)).body.session,null);
   time+=8*3600000+1;assert.equal((await call('/bootstrap','GET',undefined,admin)).body.session,null);
  });
 }finally{await db.close();}
});
test('Migration preserves member data and existing manager credentials once; member accounts never migrate to staff',async()=>{
 const db=new PGlite('memory://');await db.waitReady;try{
  for(const file of ['001_initial.sql','002_member_email.sql'])await db.exec(await readFile(new URL('../server/migrations/'+file,import.meta.url),'utf8'));
  const encoded=await passwordHash('Legacy@123');await db.query("INSERT INTO members(id,name,phone,area,\"group\") VALUES ('PH10000','Quản lý hiện có','0901200000','Đồng Nai','congregation'),('PH10001','Huynh đệ','0901200000','Đồng Nai','children')");await db.query("INSERT INTO accounts(member_id,password_hash,role,verified) VALUES ('PH10000',$1,'admin',true),('PH10001',$1,'member',true)",[encoded]);
  const sql=await readFile(new URL('../server/migrations/004_staff_portal.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n,1);assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,2);
  const {app}=await createBackend({database:db,initialize:false,seedData:false,rateLimits:false});const call=client(app);assert.equal((await call('/admin/login','POST',{username:'admin-1',password:'Legacy@123'})).status,200);assert.equal((await call('/admin/login','POST',{username:'PH10001',password:'Legacy@123'})).status,401);assert.equal((await db.query('SELECT area FROM members WHERE id=$1',['PH10000'])).rows[0].area,'Đồng Nai');
 }finally{await db.close();}
});
test('Production migration uses private staff tables and secure cookies without requiring SMS/Google providers',async()=>{
 const db=new PGlite('memory://');await db.waitReady;try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');for(const file of ['202610020001_initial.sql','202610050001_member_email.sql','202610110001_staff_portal.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  await db.query('SET search_path TO phat_hao, pg_catalog');await db.query("INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ('staff','admin','Admin',$1,'admin')",[await passwordHash('Production@123')]);
  const {app}=await createBackend({database:db,production:true,initialize:false,seedData:false,secret:'s'.repeat(64),origin:'https://example.com',storage:{},rateLimits:false});const call=client(app,'https://example.com');const login=await call('/admin/login','POST',{username:'admin',password:'Production@123'});assert.equal(login.status,200);assert.match(login.cookies[0],/Secure/);assert.equal((await call('/health')).body.mode,'staff-portal');
  for(const role of ['anon','authenticated']){await db.query('SET ROLE '+role);for(const table of ['staff_accounts','staff_sessions','staff_class_managers'])await assert.rejects(db.query('SELECT * FROM phat_hao.'+table),/permission denied/);await db.query('RESET ROLE');}
 }finally{await db.close();}
});
test('Login rate limits survive new backend instances',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://'});try{const call=client(app);for(let i=0;i<10;i++)await call('/admin/login','POST',{username:'unknown',password:'Wrong@123'});const next=await createBackend({database:db,initialize:false,seedData:false});assert.equal((await client(next.app)('/admin/login','POST',{username:'unknown',password:'Wrong@123'})).status,429);}finally{await db.close();}
});
test('Staff sessions and member edits persist across local database restarts',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ph-staff-'));let db;try{let result=await createBackend({dataDir:path.join(dir,'db'),rateLimits:false});db=result.db;const call=client(result.app),login=await call('/admin/login','POST',{username:'admin',password:'PhatHao@123'});await call('/members/PH00001','PATCH',{name:'Hồ sơ được giữ'},login.cookie);await db.close();result=await createBackend({dataDir:path.join(dir,'db'),rateLimits:false});db=result.db;assert.equal((await client(result.app)('/bootstrap','GET',undefined,login.cookie)).body.store.members.find(m=>m.id==='PH00001').name,'Hồ sơ được giữ');}finally{if(db&&!db.closed)await db.close();await rm(dir,{recursive:true,force:true});}
});
test('Production configuration and PostgreSQL adapter preserve TLS; R2 remains private',async()=>{
 const env={DATABASE_URL:'postgres://test',ADMIN_SESSION_SECRET:'s'.repeat(64),APP_ORIGIN:'https://example.com',R2_ACCOUNT_ID:'test',R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET:'test'};assert.equal(productionConfig(env).sms,undefined);assert.throws(()=>productionConfig({...env,ADMIN_SESSION_SECRET:''}),/ADMIN_SESSION_SECRET/);
 const calls=[];let config;const db=createPostgresDatabase({connectionString:'postgres://test',poolFactory:o=>{config=o;return {on(){},async connect(){return {async query(sql){calls.push(sql);return {rows:[]};},release(){}};},async end(){}};}});await db.query('SELECT 1');assert.deepEqual(calls,['BEGIN','SET LOCAL search_path TO phat_hao, pg_catalog','SELECT 1','COMMIT']);assert.equal(config.ssl.rejectUnauthorized,true);
 const commands=[];const storage=createR2Storage({bucket:'test',client:{async send(command){commands.push(command);return {Body:{async transformToByteArray(){return new Uint8Array([1]);}}};}}});await storage.put('test.webp',Buffer.from('x'));assert.equal(commands[0].input.Key,'avatars/test.webp');assert.match(commands[0].input.CacheControl,/private/);
});

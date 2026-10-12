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
test('Public portal and Dev/Admin/Manager permissions',async t=>{
 let time=Date.now();const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false,now:()=>time});const call=client(app);let dev,admin,manager;
 try{
  dev=(await call('/admin/login','POST',{username:'dev',password:'1@345678'})).cookie;
  for(const role of ['admin','manager'])assert.equal((await call('/admin/accounts','POST',{username:role,password:'PhatHao@123',role},dev)).status,201);
  await t.test('public home data is private; quick search exposes only name and group; legacy auth removed',async()=>{
   const state=await call('/bootstrap');assert.equal(state.body.session,null);assert.deepEqual(state.body.store.members,[]);
   for(const url of ['/auth/login','/auth/register','/auth/verify','/auth/password','/auth/google/start','/auth/google/callback'])assert.equal((await call(url,url.endsWith('start')||url.endsWith('callback')?'GET':'POST',url.endsWith('start')||url.endsWith('callback')?undefined:{})).status,404);
   assert.equal((await call('/admin/accounts','POST',{username:'hacker',password:'Password@123',role:'admin'})).status,401);
   assert.equal((await call('/members/PH00001','PATCH',{name:'Hacker'})).status,401);
   const search=await call('/search?q='+encodeURIComponent('Nguyễn'));assert.equal(search.status,200);assert.ok(search.body.results.length);assert.ok(search.body.results.every(r=>Object.keys(r).sort().join(',')==='group,name'));
   assert.deepEqual((await call('/search?q=%25')).body.results,[]);assert.deepEqual((await call('/search?q=%25%25')).body.results,[]);
  });
  await t.test('login uses username, private cookies, and ignores old member sessions',async()=>{
   for(const username of ['PH00001','0901200000','member@example.com'])assert.equal((await call('/admin/login','POST',{username,password:'PhatHao@123'})).status,401);
   const result=await call('/admin/login','POST',{username:'ADMIN',password:'PhatHao@123'});assert.equal(result.status,200);assert.match(result.cookies[0],/HttpOnly/);assert.match(result.cookies[0],/SameSite=Strict/);admin=result.cookie;
   manager=(await call('/admin/login','POST',{username:'manager',password:'PhatHao@123'})).cookie;
   const state=(await call('/bootstrap','GET',undefined,admin)).body;assert.equal(state.session.username,'admin');assert.equal(state.store.members.length,36);assert.equal(state.store.requirements.password,undefined);
   assert.equal((await call('/bootstrap','GET',undefined,'ph_session=old-member-cookie')).body.session,null);
  });
  await t.test('manager sees all three groups but cannot edit profiles, enrollment, configuration, or accounts',async()=>{
   const state=(await call('/bootstrap','GET',undefined,manager)).body;assert.equal(state.store.members.length,36);assert.equal(state.session.role,'manager');assert.equal(new Set(state.store.members.map(m=>m.group)).size,3);
   for(const [url,method,body]of [['/members/PH00001','PATCH',{name:'Wrong'}],['/classes/tldd-01/members/PH00001','PATCH',{name:'Wrong'}],['/requirements/email','PATCH',{required:true}],['/enrollments/tldd-01/PH00001','DELETE',{}],['/enrollments/tldd-01/PH00001','PUT',{}],['/admin/accounts','POST',{username:'other',password:'Password@123',role:'admin'}],['/admin/accounts/'+state.session.id,'DELETE',{}]])assert.equal((await call(url,method,body,manager)).status,403);
   assert.equal((await call('/admin/accounts','GET',undefined,manager)).status,403);
  });
  await t.test('admin edits any group but cannot manage accounts or developer configuration',async()=>{
   const changed=await call('/members/PH00001','PATCH',{name:'Học viên cập nhật',area:'Tân Phong',team:1},admin);assert.equal(changed.status,200);assert.equal(changed.body.member.team,2);
   assert.equal((await call('/members/PH00001','PATCH',{area:'Không có'},admin)).status,400);
   assert.equal((await call('/requirements/email','PATCH',{required:true},admin)).status,403);
   assert.equal((await call('/admin/accounts','GET',undefined,admin)).status,403);
   assert.equal((await call('/admin/accounts','POST',{username:'other',password:'Password@123',role:'admin'},admin)).status,403);
   const id=(await call('/bootstrap','GET',undefined,admin)).body.session.id;
   assert.equal((await call('/admin/accounts/'+id,'DELETE',{},admin)).status,403);
   assert.equal((await call('/admin/accounts/'+id+'/password','PATCH',{password:'Reset@123'},admin)).status,403);
   const joined=await call('/enrollments/tldd-01/PH00001','PUT',{},admin);assert.equal(joined.status,200);assert.equal((await call('/enrollments/tldd-01/PH00001','PUT',{},admin)).body.enrollment.date,joined.body.enrollment.date);
  });
  await t.test('only Dev creates, lists, resets and deletes accounts; passwords cannot be read',async()=>{
   assert.equal((await call('/requirements/password','PATCH',{required:true},dev)).status,400);assert.equal((await call('/requirements/avatar','PATCH',{required:false},dev)).status,200);
   const before=(await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n;
   for(const username of ['with space','with-dash','special@',''])assert.equal((await call('/admin/accounts','POST',{username,password:'Password@123',role:'manager'},dev)).status,400);
   assert.equal((await call('/admin/accounts','POST',{username:'anotherDev',password:'Password@123',role:'dev'},dev)).status,400);
   assert.equal((await call('/admin/accounts','POST',{username:'NewManager',password:'Password@123',role:'manager'},dev)).status,201);
   assert.equal((await call('/admin/accounts','POST',{username:'NEWMANAGER',password:'Password@123',role:'admin'},dev)).status,409);
   assert.equal((await call('/admin/accounts','POST',{username:'a',password:'Password@123',role:'admin'},dev)).status,201);assert.equal((await call('/admin/login','POST',{username:'a',password:'Password@123'})).status,200);
   const accounts=(await call('/admin/accounts','GET',undefined,dev)).body.accounts;assert.ok(accounts.every(a=>Object.keys(a).sort().join(',')==='id,role,username'));assert.ok(accounts.every(a=>a.role!=='dev'));
   const target=accounts.find(a=>a.username==='newmanager');const login=await call('/admin/login','POST',{username:'newmanager',password:'Password@123'});
   assert.equal((await call('/admin/accounts/'+target.id+'/password','PATCH',{password:'Reset@123'},dev)).status,200);
   assert.equal((await call('/bootstrap','GET',undefined,login.cookie)).body.session,null);assert.equal((await call('/admin/login','POST',{username:'newmanager',password:'Password@123'})).status,401);
   const resetLogin=await call('/admin/login','POST',{username:'newmanager',password:'Reset@123'});assert.equal(resetLogin.status,200);
   assert.equal((await call('/admin/accounts/'+target.id,'DELETE',{},dev)).status,200);assert.equal((await call('/bootstrap','GET',undefined,resetLogin.cookie)).body.session,null);assert.equal((await call('/admin/login','POST',{username:'newmanager',password:'Reset@123'})).status,401);
   assert.equal((await call('/admin/accounts/source-dev','DELETE',{},dev)).status,404);assert.equal((await call('/admin/accounts/source-dev/password','PATCH',{password:'Reset@123'},dev)).status,404);
   assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,before);assert.equal((await db.query("SELECT count(*)::int AS n FROM staff_accounts WHERE role='dev'")).rows[0].n,1);
   await assert.rejects(db.query("INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ('second','second','Dev','hash','dev')"),/unique/);
  });
  await t.test('admin and manager change only their own passwords, requiring current password and revoking sessions',async()=>{
   for(const [username,cookie]of [['admin',admin],['manager',manager]]){
    assert.equal((await call('/admin/password','PATCH',{currentPassword:'Wrong@123',password:'Changed@123'},cookie)).status,403);
    assert.equal((await call('/admin/password','PATCH',{currentPassword:'PhatHao@123',password:'Changed@123'},cookie)).status,200);
    assert.equal((await call('/bootstrap','GET',undefined,cookie)).body.session,null);
    assert.equal((await call('/admin/login','POST',{username,password:'PhatHao@123'})).status,401);
    assert.equal((await call('/admin/login','POST',{username,password:'Changed@123'})).status,200);
   }
  });
  await t.test('origin enforcement, logout, and expiry protect sessions',async()=>{
   assert.equal((await call('/admin/accounts','POST',{},dev,'https://attacker.test')).status,403);assert.equal((await call('/admin/login','POST',{username:'dev',password:'1@345678'},undefined,null)).status,403);
   const login=await call('/admin/login','POST',{username:'manager',password:'Changed@123'});assert.equal((await call('/admin/logout','POST',{},login.cookie)).status,200);assert.equal((await call('/bootstrap','GET',undefined,login.cookie)).body.session,null);
   time+=8*3600000+1;assert.equal((await call('/bootstrap','GET',undefined,dev)).body.session,null);
  });
 }finally{await db.close();}
});
test('Migration preserves member data and existing manager credentials once; member accounts never migrate to staff',async()=>{
 const db=new PGlite('memory://');await db.waitReady;try{
  for(const file of ['001_initial.sql','002_member_email.sql'])await db.exec(await readFile(new URL('../server/migrations/'+file,import.meta.url),'utf8'));
  const encoded=await passwordHash('Legacy@123');await db.query("INSERT INTO members(id,name,phone,area,\"group\") VALUES ('PH10000','Quản lý hiện có','0901200000','Đồng Nai','congregation'),('PH10001','Huynh đệ','0901200000','Đồng Nai','children')");await db.query("INSERT INTO accounts(member_id,password_hash,role,verified) VALUES ('PH10000',$1,'admin',true),('PH10001',$1,'member',true)",[encoded]);
  const sql=await readFile(new URL('../server/migrations/004_staff_portal.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n,1);assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,2);
  await db.exec(await readFile(new URL('../server/migrations/005_staff_roles.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../server/migrations/006_group_profiles.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../server/migrations/007_registration_approval.sql',import.meta.url),'utf8'));const {app}=await createBackend({database:db,initialize:false,seedData:false,rateLimits:false});const call=client(app);assert.equal((await call('/admin/login','POST',{username:'admin-1',password:'Legacy@123'})).status,200);assert.equal((await call('/admin/login','POST',{username:'PH10001',password:'Legacy@123'})).status,401);assert.equal((await db.query('SELECT area FROM members WHERE id=$1',['PH10000'])).rows[0].area,'Đồng Nai');
 }finally{await db.close();}
});
test('Production migration uses private staff tables and secure cookies without requiring SMS/Google providers',async()=>{
 const db=new PGlite('memory://');await db.waitReady;try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');for(const file of ['202610020001_initial.sql','202610050001_member_email.sql','202610110001_staff_portal.sql','202610110002_staff_roles.sql','202610120001_group_profiles.sql','202610120002_registration_approval.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  await db.query('SET search_path TO phat_hao, pg_catalog');await db.query("INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ('staff','admin','Admin',$1,'admin')",[await passwordHash('Production@123')]);
  const {app}=await createBackend({database:db,production:true,initialize:false,seedData:false,secret:'s'.repeat(64),origin:'https://example.com',storage:{},rateLimits:false});const call=client(app,'https://example.com');const login=await call('/admin/login','POST',{username:'admin',password:'Production@123'});assert.equal(login.status,200);assert.match(login.cookies[0],/Secure/);assert.equal((await call('/health')).body.mode,'staff-portal');
  for(const role of ['anon','authenticated']){await db.query('SET ROLE '+role);for(const table of ['staff_accounts','staff_sessions','staff_class_managers','registration_schemas','registration_submissions'])await assert.rejects(db.query('SELECT * FROM phat_hao.'+table),/permission denied/);await db.query('RESET ROLE');}
 }finally{await db.close();}
});
test('Login rate limits survive new backend instances',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://'});try{const call=client(app);for(let i=0;i<10;i++)await call('/admin/login','POST',{username:'unknown',password:'Wrong@123'});const next=await createBackend({database:db,initialize:false,seedData:false});assert.equal((await client(next.app)('/admin/login','POST',{username:'unknown',password:'Wrong@123'})).status,429);}finally{await db.close();}
});
test('Staff sessions and member edits persist across local database restarts',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ph-staff-'));let db;try{let result=await createBackend({dataDir:path.join(dir,'db'),rateLimits:false});db=result.db;const call=client(result.app),login=await call('/admin/login','POST',{username:'dev',password:'1@345678'});await call('/members/PH00001','PATCH',{name:'Hồ sơ được giữ'},login.cookie);await db.close();result=await createBackend({dataDir:path.join(dir,'db'),rateLimits:false});db=result.db;assert.equal((await client(result.app)('/bootstrap','GET',undefined,login.cookie)).body.store.members.find(m=>m.id==='PH00001').name,'Hồ sơ được giữ');}finally{if(db&&!db.closed)await db.close();await rm(dir,{recursive:true,force:true});}
});
test('Source Dev remains singleton and keeps changed password across backend restart',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://',seedData:false,rateLimits:false});try{
  const call=client(app),login=await call('/admin/login','POST',{username:'dev',password:'1@345678'});
  assert.equal(login.status,200);assert.equal((await call('/admin/password','PATCH',{currentPassword:'1@345678',password:'DevChanged@123'},login.cookie)).status,200);
  const restarted=await createBackend({database:db,initialize:true,seedData:false,rateLimits:false}),next=client(restarted.app);
  assert.equal((await next('/admin/login','POST',{username:'dev',password:'1@345678'})).status,401);
  assert.equal((await next('/admin/login','POST',{username:'dev',password:'DevChanged@123'})).status,200);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM staff_accounts WHERE role='dev'")).rows[0].n,1);
 }finally{await db.close();}
});
test('Production configuration and PostgreSQL adapter preserve TLS; R2 remains private',async()=>{
 const env={DATABASE_URL:'postgres://test',ADMIN_SESSION_SECRET:'s'.repeat(64),APP_ORIGIN:'https://example.com',R2_ACCOUNT_ID:'test',R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET:'test'};assert.equal(productionConfig(env).sms,undefined);assert.throws(()=>productionConfig({...env,ADMIN_SESSION_SECRET:''}),/ADMIN_SESSION_SECRET/);
 const calls=[];let config;const db=createPostgresDatabase({connectionString:'postgres://test',poolFactory:o=>{config=o;return {on(){},async connect(){return {async query(sql){calls.push(sql);return {rows:[]};},release(){}};},async end(){}};}});await db.query('SELECT 1');assert.deepEqual(calls,['BEGIN','SET LOCAL search_path TO phat_hao, pg_catalog','SELECT 1','COMMIT']);assert.equal(config.ssl.rejectUnauthorized,true);
 const commands=[];const storage=createR2Storage({bucket:'test',client:{async send(command){commands.push(command);return {Body:{async transformToByteArray(){return new Uint8Array([1]);}}};}}});await storage.put('test.webp',Buffer.from('x'));assert.equal(commands[0].input.Key,'avatars/test.webp');assert.match(commands[0].input.CacheControl,/private/);
});

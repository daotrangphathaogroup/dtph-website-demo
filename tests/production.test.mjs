import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createBackend} from '../server/backend.mjs';
import {createPostgresDatabase} from '../server/postgres.mjs';
import {createR2Storage,createTwilioSms,productionConfig} from '../server/providers.mjs';

test('Postgres adapter uses one client and SET LOCAL for transactions, rollback and TLS verification',async()=>{
 const calls=[];let released=0;const client={async query(sql){calls.push(sql);return {rows:[]};},release(){released++;}};let config;
 const db=createPostgresDatabase({connectionString:'postgres://example',poolFactory:options=>{config=options;return {on(){},async connect(){return client;},async end(){}};}});
 await db.query('SELECT 1');assert.deepEqual(calls,['BEGIN','SET LOCAL search_path TO phat_hao, pg_catalog','SELECT 1','COMMIT']);
 await assert.rejects(db.transaction(async()=>{throw new Error('abort');}));assert.equal(calls.at(-1),'ROLLBACK');assert.equal(released,2);assert.equal(config.ssl.rejectUnauthorized,true);
});
test('R2 uses private WebP objects; Twilio receives E.164 phone and account-specific SMS',async()=>{
 const commands=[];const r2=createR2Storage({bucket:'test-bucket',client:{async send(command){commands.push(command);return {Body:{async transformToByteArray(){return new Uint8Array([1,2]);}}};}}});
 await r2.put('image.webp',Buffer.from('test'));assert.equal(commands[0].input.Key,'avatars/image.webp');assert.equal(commands[0].input.ContentType,'image/webp');assert.match(commands[0].input.CacheControl,/private/);assert.deepEqual(await r2.get('image.webp'),Buffer.from([1,2]));
 let request;const sms=createTwilioSms({accountSid:'AC_TEST',authToken:'TEST',messagingServiceSid:'MG_TEST',fetchImpl:async(url,options)=>{request={url,options};return {ok:true};}});
 await sms.send({phone:'0901200000',message:'Mã thành viên PH00001. Mã xác thực 123456.'});assert.equal(request.options.body.get('To'),'+84901200000');assert.match(request.options.body.get('Body'),/PH00001/);assert.equal(request.options.body.get('MessagingServiceSid'),'MG_TEST');
});
test('Production rejects incomplete configuration and a mock SMS provider',()=>{
 assert.throws(()=>productionConfig({}),/Missing production configuration/);
 const env={DATABASE_URL:'postgres://test',OTP_SECRET:'s'.repeat(64),APP_ORIGIN:'https://example.com',R2_ACCOUNT_ID:'test',R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET:'test',SMS_PROVIDER:'mock'};
 assert.throws(()=>productionConfig(env),/Unsupported SMS_PROVIDER/);
});
test('Private production schema, registration, no OTP leak, secure cookies, RLS and persistent limits',async t=>{
 const pg=new PGlite('memory://');await pg.waitReady;await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');await pg.exec(await readFile(new URL('../supabase/migrations/202610020001_initial.sql',import.meta.url),'utf8'));
 const database={query:(sql,params)=>pg.transaction(async tx=>{await tx.query('SET LOCAL search_path TO phat_hao, pg_catalog');return tx.query(sql,params);}),transaction:fn=>pg.transaction(async tx=>{await tx.query('SET LOCAL search_path TO phat_hao, pg_catalog');return fn(tx);})};
 const outbox=[];const {app}=await createBackend({database,production:true,initialize:false,seedData:false,secret:'s'.repeat(64),origin:'https://example.com',storage:{async put(){},async get(){return Buffer.from('');}},sms:{canSend:true,async send(message){outbox.push(message);}}});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}/api`;
 async function request(url,body,cookie){const res=await fetch(base+url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:'https://example.com'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')};}
 try{
  await t.test('no demo records; anon/authenticated cannot read private tables and all tables have RLS',async()=>{
   assert.equal((await database.query('SELECT * FROM members')).rows.length,0);assert.equal((await request('/health')).body.ready,true);const flags=(await pg.query("SELECT relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='phat_hao' AND relkind='r'")).rows;assert.ok(flags.length>10&&flags.every(r=>r.relrowsecurity));
   for(const role of ['anon','authenticated']){await pg.query(`SET ROLE ${role}`);await assert.rejects(pg.query('SELECT * FROM phat_hao.accounts'),/permission denied/);await pg.query('RESET ROLE');}
  });
  await t.test('real-provider path sends SMS without returning code, body or unmasked phone',async()=>{
   const member={name:'Production integration fixture',birthday:'2010-01-01',phone:'0901200000',address:'Địa chỉ thử',area:'Đồng Nai',group:'children',referrer:'',joined:'2026-10-02',avatar:''};
   const result=await request('/auth/register',{member,password:'UniqueTest@123'});assert.equal(result.status,201);assert.equal(result.body.memberId,'PH00001');assert.equal(result.body.code,undefined);assert.equal(result.body.message,undefined);assert.equal(result.body.phone,'090••••000');assert.equal(outbox.length,1);
   const code=outbox[0].message.match(/Mã xác thực (\d{6})/)[1];const verified=await request('/auth/verify',{...result.body,code});assert.equal(verified.status,200);assert.match(verified.cookie,/HttpOnly/);assert.match(verified.cookie,/Secure/);assert.match(verified.cookie,/SameSite=Strict/);
   const state=await request('/bootstrap',undefined,verified.cookie.split(';')[0]);assert.equal(state.body.session.role,'member');assert.equal(state.body.store.members[0].id,'PH00001');assert.equal((await request('/auth/verify',{...result.body,code})).status,400);
  });
  await t.test('rate limits are stored in PostgreSQL and survive application instances',async()=>{
   assert.ok((await database.query('SELECT * FROM rate_limits')).rows.length>=3);
   for(let i=0;i<35;i++)await request('/auth/login',{identity:'PH_UNKNOWN',password:'WrongTest@123'});
   assert.equal((await request('/auth/login',{identity:'PH_UNKNOWN',password:'WrongTest@123'})).status,429);
  });
 }finally{await new Promise(resolve=>server.close(resolve));await pg.close();}
});

test('Explicit SMS preview permits scoped OTP without delivery; disabled remains closed',async()=>{
 const pg=new PGlite('memory://');await pg.waitReady;await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');await pg.exec(await readFile(new URL('../supabase/migrations/202610020001_initial.sql',import.meta.url),'utf8'));
 const database={query:(sql,params)=>pg.transaction(async tx=>{await tx.query('SET LOCAL search_path TO phat_hao, pg_catalog');return tx.query(sql,params);}),transaction:fn=>pg.transaction(async tx=>{await tx.query('SET LOCAL search_path TO phat_hao, pg_catalog');return fn(tx);})};
 const env={DATABASE_URL:'postgres://test',OTP_SECRET:'s'.repeat(64),APP_ORIGIN:'https://example.com',R2_ACCOUNT_ID:'test',R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET:'test'};
 const servers=[];let sends=0;
 async function backend(mode){const sms=productionConfig({...env,SMS_PROVIDER:mode}).sms;sms.send=async()=>{sends++;throw new Error('Preview must not send SMS');};const {app}=await createBackend({database,production:true,initialize:false,seedData:false,secret:env.OTP_SECRET,origin:env.APP_ORIGIN,storage:{},sms});const server=app.listen(0,'127.0.0.1');servers.push(server);await new Promise(resolve=>server.once('listening',resolve));return async(url,body,cookie)=>{const res=await fetch(`http://127.0.0.1:${server.address().port}/api`+url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:env.APP_ORIGIN}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};};}
 const member={name:'SMS preview fixture',birthday:'2010-01-01',phone:'0901200000',address:'Địa chỉ thử',area:'Đồng Nai',group:'children',referrer:'',joined:'2026-10-02',avatar:''};
 try{
  const disabled=await backend('disabled');assert.equal((await disabled('/auth/register',{member,password:'PreviewTest@123'})).status,503);assert.equal((await database.query('SELECT * FROM accounts')).rows.length,0);
  const call=await backend('preview');assert.equal((await call('/bootstrap')).body.smsPreview,true);const health=(await call('/health')).body;assert.equal(health.sms,'preview');assert.equal(health.ready,false);
  const first=await call('/auth/register',{member,password:'PreviewTest@123'});assert.equal(first.status,201);assert.match(first.body.code,/^\d{6}$/);assert.equal(first.body.phone,'090••••000');assert.match(first.body.message,/PH00001/);
  const second=await call('/auth/register',{member,password:'PreviewTest@123'});assert.equal(second.status,201);assert.equal((await call('/auth/verify',{...first.body,memberId:second.body.memberId})).status,400);
  const verified=await call('/auth/verify',first.body);assert.equal(verified.status,200);assert.equal((await call('/auth/verify',first.body)).status,400);
  assert.equal((await call('/auth/login',{identity:first.body.memberId,password:'WrongTest@123'})).status,401);
  const login=await call('/auth/login',{identity:first.body.memberId,password:'PreviewTest@123'});assert.match(login.body.code,/^\d{6}$/);assert.equal((await call('/auth/verify',login.body)).status,200);
  const password=await call('/auth/password-challenge',{},verified.cookie);assert.match(password.body.code,/^\d{6}$/);assert.equal((await call('/auth/verify',password.body)).status,400);const grant=await call('/auth/verify',password.body,verified.cookie);assert.equal(grant.status,200);assert.equal((await call('/auth/password',{grant:grant.body.grant,password:'ChangedTest@123'},verified.cookie)).status,200);
  assert.equal((await disabled('/auth/login',{identity:first.body.memberId,password:'ChangedTest@123'})).status,503);assert.equal(sends,0);
 }finally{for(const server of servers)await new Promise(resolve=>server.close(resolve));await pg.close();}
});

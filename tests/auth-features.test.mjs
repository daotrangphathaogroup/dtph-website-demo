import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';
const origin='https://example.com';
test('Default-off auth supports production passwords, contacts, admin toggles and re-enabled OTP',async()=>{
 const db=new PGlite('memory://');await db.waitReady;for(const file of ['001_initial.sql','002_member_email.sql','003_google_auth.sql'])await db.exec(await readFile(new URL('../server/migrations/'+file,import.meta.url),'utf8'));
 const outbox=[];const options={database:db,production:true,initialize:false,seedData:false,secret:'s'.repeat(64),origin,storage:{},rateLimits:false,sms:{canSend:true,async send(message){outbox.push(message);}},google:{clientId:'test',async exchange(){throw new Error('Disabled must not call Google');}}};
 const {app}=await createBackend(options);
 async function call(path,method='GET',body,cookie,target=app){const res=await handleRequest(target,new Request(origin+'/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:res.status,location:res.headers.get('location'),body:res.headers.get('content-type')?.includes('application/json')?await res.json():null,cookie:res.headers.getSetCookie().find(c=>c.startsWith('ph_session='))?.split(';')[0]};}
 const member={name:'Contact fixture',birthday:'2014-01-01',phone:'0901200000',email:'first@example.com',address:'Đồng Nai',area:'Đồng Nai',group:'children',referrer:'',joined:'2026-10-05',avatar:''};
 try{
  const state=await call('/bootstrap');assert.deepEqual(state.body.authFeatures,{smsOtp:false,emailOtp:false,googleLogin:false});assert.equal(state.body.googleEnabled,false);assert.equal(state.body.smsPreview,false);assert.equal((await call('/health')).body.ready,true);
  const first=await call('/auth/register','POST',{member,password:'Password@123'});assert.equal(first.status,201);assert.deepEqual(first.body,{ok:true});assert.ok(first.cookie);assert.equal(outbox.length,0);assert.equal((await db.query('SELECT * FROM challenges')).rows.length,0);
  const id=(await call('/bootstrap','GET',undefined,first.cookie)).body.session.id;
  const second=await call('/auth/register','POST',{member:{...member,email:'second@example.com'},password:'Password@123'});assert.equal(second.status,201);
  assert.equal((await call('/auth/register','POST',{member,password:'Password@123'})).status,409);
  assert.equal((await call('/auth/login','POST',{identity:member.phone,password:'Password@123'})).status,409);assert.equal((await call('/auth/login','POST',{identity:'',password:'Password@123'})).status,400);assert.equal((await call('/auth/register','POST',{member:{...member,phone:'',email:''},password:'Password@123'})).status,201);
  assert.equal((await call('/auth/login','POST',{identity:member.phone,memberCode:id,password:'Wrong@123'})).status,401);
  const login=await call('/auth/login','POST',{identity:' FIRST@example.com ',password:'Password@123'});assert.equal(login.status,200);assert.deepEqual(login.body,{ok:true});
  for(const endpoint of ['/auth/password-challenge','/auth/resend','/auth/verify'])assert.equal((await call(endpoint,'POST',{},first.cookie)).status,403);
  assert.equal((await call('/auth/google/start')).status,403);
  assert.equal((await call('/auth/password','POST',{password:'Changed@123'},first.cookie)).status,400);
  assert.equal((await call('/auth/password','POST',{currentPassword:'Wrong@123',password:'Changed@123'},first.cookie)).status,401);
  assert.equal((await call('/auth/password','POST',{currentPassword:'Password@123',password:'Changed@123'},first.cookie)).status,200);
  assert.equal((await call('/bootstrap','GET',undefined,login.cookie)).body.session,null);
  assert.equal((await call('/auth/login','POST',{identity:member.email,password:'Password@123'})).status,401);
  const changed=await call('/members/'+id,'PATCH',{...member,phone:'0901300000',email:'changed@example.com'},first.cookie);assert.equal(changed.status,200);assert.equal(changed.body.member.phone,'0901300000');
  assert.equal((await call('/auth-features/smsOtp','PATCH',{enabled:true},first.cookie)).status,403);
  await db.query('UPDATE accounts SET role=$1 WHERE member_id=$2',['admin',id]);
  assert.equal((await call('/auth-features/emailOtp','PATCH',{enabled:true},first.cookie)).status,400);
  assert.equal((await call('/auth-features/googleLogin','PATCH',{enabled:true},first.cookie)).status,200);assert.equal((await call('/auth/google/start')).status,303);
  assert.equal((await call('/auth-features/googleLogin','PATCH',{enabled:false},first.cookie)).status,200);assert.equal((await call('/auth/google/start')).status,403);
  assert.equal((await call('/auth-features/smsOtp','PATCH',{enabled:true},first.cookie)).status,200);
  const otp=await call('/auth/login','POST',{identity:id,password:'Changed@123'});assert.equal(otp.status,200);assert.equal(otp.body.code,undefined);assert.equal(outbox.length,1);
  const code=outbox[0].message.match(/Mã xác thực (\d{6})/)[1];assert.equal((await call('/auth/verify','POST',{...otp.body,code})).status,200);
  assert.equal((await call('/auth/password','POST',{currentPassword:'Changed@123',password:'ChangedAgain@123'},first.cookie)).status,400);
  const another=await call('/auth/login','POST',{identity:id,password:'Changed@123'});
  assert.equal((await call('/auth-features/smsOtp','PATCH',{enabled:false},first.cookie)).status,200);
  assert.equal((await call('/auth/verify','POST',{...another.body,code})).status,403);assert.ok((await db.query('SELECT consumed FROM challenges')).rows.every(r=>r.consumed));
  const reopened=await createBackend(options);assert.equal((await call('/bootstrap','GET',undefined,first.cookie,reopened.app)).body.authFeatures.smsOtp,false);
  assert.equal((await call('/auth/login','POST',{identity:'changed@example.com',password:'Changed@123'})).status,200);
  const unavailable=await createBackend({...options,sms:{canSend:false,async send(){throw new Error('No SMS');}},google:null});assert.equal((await call('/auth-features/smsOtp','PATCH',{enabled:true},first.cookie,unavailable.app)).status,400);assert.equal((await call('/auth-features/googleLogin','PATCH',{enabled:true},first.cookie,unavailable.app)).status,400);
 }finally{await db.close();}
});

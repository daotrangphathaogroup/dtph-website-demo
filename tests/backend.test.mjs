import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createBackend } from '../server/backend.mjs';

test('Backend local: PostgreSQL persistence, shared phone, scoped OTP, roles and class enrollment',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'phat-hao-test-'));let clock=Date.now();
 let backend=await createBackend({authDefaults:{smsOtp:true,googleLogin:true},dataDir:path.join(dir,'db'),uploadDir:path.join(dir,'avatars'),now:()=>clock,rateLimits:false});
 let server=backend.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 let base=`http://127.0.0.1:${server.address().port}`;
 const client=()=>({cookie:'',async request(url,method='GET',body){const response=await fetch(base+'/api'+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(this.cookie?{cookie:this.cookie}:{})},body:body?JSON.stringify(body):undefined});const cookie=response.headers.get('set-cookie');if(cookie)this.cookie=cookie.split(';')[0];return {status:response.status,body:await response.json()};}});
 const admin=client(),member=client(),manager=client(),anon=client();
 async function login(c,id,password='PhatHao@123'){const started=await c.request('/auth/login','POST',{identity:id,password});assert.equal(started.status,200);const verified=await c.request('/auth/verify','POST',started.body);assert.equal(verified.status,200);return started.body;}
 try{
  await t.test('anonymous bootstrap exposes no member records; cross-origin mutations blocked',async()=>{
   const result=await anon.request('/bootstrap');assert.equal(result.body.session,null);assert.equal(result.body.store.members.length,0);
   const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({identity:'PH00001',password:'PhatHao@123'})});assert.equal(response.status,403);
  });
  await t.test('shared phone requires member code; OTP rejects different account/purpose and replay',async()=>{
   const result=await member.request('/auth/login','POST',{identity:'0901200000',password:'PhatHao@123'});assert.equal(result.status,409);assert.equal(result.body.requiresMemberCode,true);assert.equal(result.body.members,undefined);
   const started=await member.request('/auth/login','POST',{identity:'0901200000',memberCode:'PH00003',password:'PhatHao@123'});assert.equal(started.status,200);const c=started.body;assert.equal(c.memberId,'PH00003');assert.match(c.message,/PH00003/);
   assert.equal((await member.request('/auth/verify','POST',{...c,memberId:'PH00001'})).status,400);
   assert.equal((await member.request('/auth/verify','POST',{...c,purpose:'password_change'})).status,400);
   assert.equal((await member.request('/auth/verify','POST',c)).status,200);
   assert.equal((await member.request('/auth/verify','POST',c)).status,400);
  });
  await login(admin,'PH00001');await login(manager,'PH00002');
  await t.test('backend masks private fields and rejects role spoofing or unauthorized changes',async()=>{
   const mine=(await member.request('/bootstrap')).body;assert.equal(mine.session.role,'member');assert.equal(mine.store.members.find(m=>m.id==='PH00001').phone,'');assert.equal(mine.store.members.find(m=>m.id==='PH00003').phone,'0901200000');assert.ok(mine.store.enrollments.every(e=>e.memberId==='PH00003'));
   const all=(await admin.request('/bootstrap')).body.store;const target=all.members.find(m=>m.id==='PH00001');
   assert.equal((await member.request('/members/PH00001','PATCH',{...target,role:'admin'})).status,403);
   assert.equal((await member.request('/requirements/avatar','PATCH',{required:true})).status,403);
   assert.equal((await manager.request('/members/PH00003','PATCH',target)).status,403);
   const scoped=(await manager.request('/bootstrap')).body.store;assert.notEqual(scoped.members.find(m=>m.id==='PH00003').phone,'');assert.equal(scoped.members.find(m=>m.id==='PH00036').phone,'');
  });
  await t.test('enrollment is idempotent; class manager cannot manage another class',async()=>{
   await member.request('/enrollments/tldd-01/PH00003','DELETE');
   const results=await Promise.all([member.request('/enrollments/tldd-01/PH00003','PUT'),member.request('/enrollments/tldd-01/PH00003','PUT')]);assert.ok(results.every(r=>r.status===200));
   assert.equal((await backend.db.query("SELECT * FROM enrollments WHERE member_id='PH00003'")).rows.length,1);
   assert.equal((await member.request('/enrollments/tldd-01/PH00004','DELETE')).status,403);
   assert.equal((await manager.request('/enrollments/other-class/PH00004','DELETE')).status,403);
   assert.equal((await manager.request('/enrollments/tldd-01/PH00004','DELETE')).status,200);
  });
  let registered;
  await t.test('registration allows existing phone, activates only after OTP and stores hashed password',async()=>{
   const c=client();const memberData={name:'Huynh đệ thử local',birthday:'2015-02-03',phone:'0901200000',address:'Địa chỉ mẫu',area:'TP. Hồ Chí Minh',group:'children',referrer:'PH00001',joined:'2026-10-02',avatar:''};
   const result=await c.request('/auth/register','POST',{member:memberData,password:'LocalChild@123',role:'admin'});assert.equal(result.status,201);registered=result.body.memberId;
   assert.ok(!(await admin.request('/bootstrap')).body.store.members.some(m=>m.id===registered));
   const account=(await backend.db.query('SELECT * FROM accounts WHERE member_id=$1',[registered])).rows[0];assert.equal(account.role,'member');assert.equal(account.verified,false);assert.notEqual(account.password_hash,'LocalChild@123');
   assert.equal((await c.request('/auth/verify','POST',result.body)).status,200);assert.equal((await c.request('/bootstrap')).body.session.id,registered);
  });
  await t.test('OTP has five-attempt limit, expiry, resend cooldown and revokes previous challenge',async()=>{
   let c=(await anon.request('/auth/login','POST',{identity:'PH00005',password:'PhatHao@123'})).body;
   for(let i=0;i<5;i++)assert.equal((await anon.request('/auth/verify','POST',{...c,code:'000000'})).status,400);
   assert.equal((await anon.request('/auth/verify','POST',c)).status,400);
   c=(await anon.request('/auth/login','POST',{identity:'PH00005',password:'PhatHao@123'})).body;
   assert.equal((await anon.request('/auth/resend','POST',c)).status,429);clock+=31000;
   const replacement=await anon.request('/auth/resend','POST',c);assert.equal(replacement.status,200);assert.equal((await anon.request('/auth/verify','POST',c)).status,400);
   clock+=300001;assert.equal((await anon.request('/auth/verify','POST',replacement.body)).status,400);
  });
  await t.test('password OTP belongs to authenticated session; new password persists, other sessions revoked',async()=>{
   const other=client();await login(other,'PH00003');const c=(await member.request('/auth/password-challenge','POST')).body;
   assert.equal((await other.request('/auth/verify','POST',c)).status,400);
   const verified=await member.request('/auth/verify','POST',c);assert.equal(verified.status,200);
   assert.equal((await member.request('/auth/password','POST',{grant:verified.body.grant,password:'ChangedLocal@123'})).status,200);
   assert.equal((await member.request('/auth/password','POST',{grant:verified.body.grant,password:'ReusedLocal@123'})).status,400);
   assert.equal((await other.request('/bootstrap')).body.session,null);
   assert.equal((await other.request('/auth/login','POST',{identity:'PH00003',password:'PhatHao@123'})).status,401);
   await login(other,'PH00003','ChangedLocal@123');
  });
  await t.test('profile and requirements persist; backend converts avatar to WebP and protects access',async()=>{
   const me=(await member.request('/bootstrap')).body.store.members.find(m=>m.id==='PH00003');
   const png=await sharp({create:{width:20,height:20,channels:3,background:'#215b48'}}).png().toBuffer();
   assert.equal((await member.request('/members/PH00003','PATCH',{...me,name:'Hồ sơ lưu PostgreSQL',avatar:'data:image/png;base64,'+png.toString('base64'),role:'admin'})).status,200);
   const saved=(await member.request('/bootstrap')).body;assert.equal(saved.session.role,'member');const updated=saved.store.members.find(m=>m.id==='PH00003');assert.match(updated.avatar,/\.webp$/);
   const image=await fetch(base+updated.avatar,{headers:{cookie:member.cookie}});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format,'webp');assert.equal((await fetch(base+updated.avatar)).status,401);
   assert.equal((await admin.request('/requirements/birthday','PATCH',{required:true})).status,200);
  });
  await new Promise(resolve=>server.close(resolve));await backend.db.close();
  backend=await createBackend({authDefaults:{smsOtp:true,googleLogin:true},dataDir:path.join(dir,'db'),uploadDir:path.join(dir,'avatars'),now:()=>clock,rateLimits:false});server=backend.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}`;
  await t.test('restart retains profiles, configuration, sessions, new accounts and password changes',async()=>{
   const state=(await member.request('/bootstrap')).body;assert.equal(state.store.requirements.birthday,true);assert.equal(state.store.members.find(m=>m.id==='PH00003').name,'Hồ sơ lưu PostgreSQL');assert.ok(state.store.members.some(m=>m.id===registered));await login(client(),'PH00003','ChangedLocal@123');
  });
 }finally{await new Promise(resolve=>server.close(resolve));await backend.db.close();await rm(dir,{recursive:true,force:true});}
});

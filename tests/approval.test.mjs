import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';
function client(app){return async(path,method='GET',body,cookie)=>{const response=await handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:response.status,body:await response.json(),cookie:response.headers.getSetCookie()[0]?.split(';')[0]};};}
test('Registration approval separates public submissions and trusted staff registrations',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false});const call=client(app);
 try{
  const dev=(await call('/admin/login','POST',{username:'dev',password:'1@345678'})).cookie;
  for(const role of ['admin','manager'])await call('/admin/accounts','POST',{username:role,password:'Password@123',role},dev);
  const admin=(await call('/admin/login','POST',{username:'admin',password:'Password@123'})).cookie,manager=(await call('/admin/login','POST',{username:'manager',password:'Password@123'})).cookie;
  for(const group of ['children','youth','congregation']){
   const requestId=randomUUID(),payload={values:{name:'Waiting '+group},requestId};
   const result=await call('/registrations/'+group,'POST',payload);assert.equal(result.status,201);assert.equal(result.body.status,'pending');assert.equal(result.body.member,undefined);
   const state=(await call('/bootstrap','GET',undefined,manager)).body,member=state.pendingRegistrations.find(m=>m.name===payload.values.name);assert.ok(member);assert.equal(member.group,group);assert.ok(!state.store.members.some(m=>m.id===member.id));
   assert.deepEqual((await call('/search?q='+encodeURIComponent(payload.values.name))).body.results,[]);
   assert.equal((await call('/enrollments/tldd-01/'+member.id,'PUT',{},admin)).status,400);
   assert.equal((await call('/registrations/'+member.id+'/approve','POST',{})).status,401);
   assert.equal((await call('/registrations/'+member.id+'/approve','POST',{},manager)).status,403);
   // A retry from a staff session must not elevate a pending request.
   assert.equal((await call('/registrations/'+group,'POST',payload,manager)).body.status,'pending');
   const approved=await call('/registrations/'+member.id+'/approve','POST',{},group==='children'?dev:admin);assert.equal(approved.status,200);assert.equal(approved.body.member.registrationStatus,'approved');
   assert.equal((await call('/registrations/'+member.id+'/approve','POST',{},admin)).status,200);
   assert.equal((await db.query("SELECT count(*)::int AS n FROM audit_log WHERE target=$1 AND action='registration_approve'",[member.id])).rows[0].n,1);
   const after=(await call('/bootstrap','GET',undefined,manager)).body;assert.ok(!after.pendingRegistrations.some(m=>m.id===member.id));assert.ok(after.store.members.some(m=>m.id===member.id));assert.equal((await call('/search?q='+encodeURIComponent(payload.values.name))).body.results.length,1);
   assert.equal((await call('/registrations/'+group,'POST',payload)).body.status,'approved');
  }
  for(const [role,cookie]of [['manager',manager],['admin',admin],['dev',dev]]){
   const result=await call('/registrations/youth','POST',{values:{name:'Trusted '+role},requestId:randomUUID(),registrationStatus:'pending'},cookie);assert.equal(result.status,201);assert.equal(result.body.status,'approved');
   const row=(await db.query('SELECT * FROM members WHERE name=$1',['Trusted '+role])).rows[0];assert.equal(row.registration_status,'approved');assert.ok(row.submitted_by);assert.equal(row.approved_by,row.submitted_by);assert.ok(row.approved_at);
  }
  const forged=await call('/registrations/youth','POST',{values:{name:'Forged approval'},requestId:randomUUID(),registrationStatus:'approved',role:'manager',approvedBy:'source-dev'});assert.equal(forged.body.status,'pending');
  const expired=await call('/registrations/youth','POST',{values:{name:'Invalid session'},requestId:randomUUID()},'ph_staff_session=invalid');assert.equal(expired.body.status,'pending');
  const before=(await db.query("SELECT count(*)::int AS n FROM members WHERE registration_status='pending'")).rows[0].n;
  await createBackend({database:db,seedData:false,rateLimits:false});assert.equal((await db.query("SELECT count(*)::int AS n FROM members WHERE registration_status='pending'")).rows[0].n,before);
  assert.equal((await call('/registrations/not-found/approve','POST',{},admin)).status,404);
  assert.equal((await call('/bootstrap')).body.pendingRegistrations,undefined);
 }finally{await db.close();}
});

test('Rejecting a registration requires Admin/Dev and retains an audited, terminal record',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false});const call=client(app);
 try{
  const dev=(await call('/admin/login','POST',{username:'dev',password:'1@345678'})).cookie;
  for(const role of ['admin','manager'])await call('/admin/accounts','POST',{username:role,password:'Password@123',role},dev);
  const admin=(await call('/admin/login','POST',{username:'admin',password:'Password@123'})).cookie,manager=(await call('/admin/login','POST',{username:'manager',password:'Password@123'})).cookie;
  for(const group of ['children','youth','congregation']){
   const payload={values:{name:'Rejected '+group},requestId:randomUUID()};await call('/registrations/'+group,'POST',payload);
   const member=(await call('/bootstrap','GET',undefined,manager)).body.pendingRegistrations.find(m=>m.name===payload.values.name);
   const path='/registrations/'+member.id;
   assert.equal((await call(path+'/reject','POST',{})).status,401);
   assert.equal((await call(path+'/reject','POST',{},manager)).status,403);
   const rejected=await call(path+'/reject','POST',{},group==='children'?dev:admin);assert.equal(rejected.status,200);assert.equal(rejected.body.member.registrationStatus,'rejected');
   assert.equal((await call(path+'/reject','POST',{},admin)).status,200);
   assert.equal((await call(path+'/approve','POST',{},admin)).status,409);
   assert.equal((await db.query('SELECT registration_status FROM members WHERE id=$1',[member.id])).rows[0].registration_status,'rejected');
   assert.equal((await db.query("SELECT count(*)::int AS n FROM audit_log WHERE target=$1 AND action='registration_reject'",[member.id])).rows[0].n,1);
   const state=(await call('/bootstrap','GET',undefined,manager)).body;assert.ok(!state.pendingRegistrations.some(m=>m.id===member.id));assert.ok(!state.store.members.some(m=>m.id===member.id));
   assert.deepEqual((await call('/search?q='+encodeURIComponent(payload.values.name))).body.results,[]);
   assert.equal((await call('/registrations/'+group,'POST',payload)).body.status,'rejected');
  }
  const approved=(await call('/bootstrap','GET',undefined,dev)).body.store.members[0];assert.equal((await call('/registrations/'+approved.id+'/reject','POST',{},dev)).status,409);
  assert.equal((await call('/registrations/not-found/reject','POST',{},admin)).status,404);
 }finally{await db.close();}
});

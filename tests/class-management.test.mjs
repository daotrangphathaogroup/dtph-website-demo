import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';

test('Class management is scoped to assigned classes and currently enrolled learners',async()=>{
 const {app,db}=await createBackend({authDefaults:{smsOtp:true,googleLogin:true},dataDir:'memory://',rateLimits:false});
 async function call(path,method='GET',body,cookie){const response=await handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
 async function login(identity){const started=await call('/auth/login','POST',{identity,password:'PhatHao@123'});return (await call('/auth/verify','POST',started.body)).cookie;}
 try{
  const manager=await login('PH00002'),member=await login('PH00003'),admin=await login('PH00001');
  await db.query("INSERT INTO enrollments(member_id,class_id) VALUES ('PH00003','tldd-01') ON CONFLICT DO NOTHING");await db.query("DELETE FROM enrollments WHERE member_id='PH00036'");
  const state=await call('/bootstrap','GET',undefined,manager);assert.deepEqual(state.body.managedClassIds,['tldd-01']);assert.deepEqual((await call('/bootstrap','GET',undefined,member)).body.managedClassIds,[]);assert.deepEqual((await call('/bootstrap')).body.managedClassIds,[]);
  const original=state.body.store.members.find(m=>m.id==='PH00003');const {id,...profile}=original;const updated={...profile,name:'Học viên cập nhật thử',area:'Đồng Nai'};
  const endpoint='/classes/tldd-01/members/PH00003';assert.equal((await call(endpoint,'PATCH',updated)).status,401);assert.equal((await call(endpoint,'PATCH',updated,member)).status,403);
  const saved=await call(endpoint,'PATCH',updated,manager);assert.equal(saved.status,200);assert.equal(saved.body.member.name,updated.name);assert.equal(saved.body.member.id,id);assert.equal(saved.body.member.phone,original.phone);
  assert.equal((await call('/members/PH00003','PATCH',updated,manager)).status,403);
  const outsider=(await call('/bootstrap','GET',undefined,admin)).body.store.members.find(m=>m.id==='PH00036');const {id:otherId,...other}=outsider;assert.equal((await call('/classes/tldd-01/members/'+otherId,'PATCH',other,manager)).status,404);
  await db.query("INSERT INTO classes VALUES ('other-class','Lớp khác','youth')");await db.query("INSERT INTO enrollments(member_id,class_id) VALUES ('PH00003','other-class')");assert.equal((await call('/classes/other-class/members/PH00003','PATCH',updated,manager)).status,403);
  assert.equal((await call('/enrollments/tldd-01/PH00003','DELETE',undefined,manager)).status,200);assert.equal((await call(endpoint,'PATCH',updated,manager)).status,404);
  const after=await call('/bootstrap','GET',undefined,manager);assert.equal(after.body.store.members.find(m=>m.id==='PH00003').phone,'');assert.equal((await db.query("SELECT name FROM members WHERE id='PH00003'")).rows[0].name,updated.name);
 }finally{await db.close();}
});

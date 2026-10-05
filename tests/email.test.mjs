import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';
test('Unique normalized emails support login, profile changes, optional values and privacy',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false});
 async function call(path,method='GET',body,cookie){const res=await handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 const member={name:'Email fixture',birthday:'2015-01-01',phone:'0901200000',email:'  First@Example.com  ',address:'Địa chỉ thử',area:'Đồng Nai',group:'children',referrer:'',joined:'2026-10-05',avatar:''};
 try{
  const first=await call('/auth/register','POST',{member,password:'EmailTest@123'});assert.equal(first.status,201);const verified=await call('/auth/verify','POST',first.body);assert.equal(verified.status,200);const cookie=verified.cookie;
  const second=await call('/auth/register','POST',{member:{...member,email:'FIRST@example.com'},password:'EmailTest@123'});assert.equal(second.status,409);assert.match(second.body.error,/Email/);
  const third=await call('/auth/register','POST',{member:{...member,email:'second@example.com'},password:'EmailTest@123'});assert.equal(third.status,201);assert.notEqual(third.body.memberId,first.body.memberId);await call('/auth/verify','POST',third.body);
  assert.equal((await call('/auth/register','POST',{member:{...member,email:'invalid-email'},password:'EmailTest@123'})).status,400);
  const login=await call('/auth/login','POST',{identity:' FIRST@EXAMPLE.COM ',password:'EmailTest@123'});assert.equal(login.status,200);assert.equal(login.body.memberId,first.body.memberId);assert.equal((await call('/auth/login','POST',{identity:'first@example.com',password:'Incorrect@123'})).status,401);assert.equal((await call('/auth/login','POST',{identity:member.phone,password:'EmailTest@123'})).status,409);
  assert.equal((await call('/members/'+first.body.memberId,'PATCH',{...member,email:'second@example.com'},cookie)).status,409);
  assert.equal((await call('/members/'+first.body.memberId,'PATCH',{...member,email:'Changed@example.com'},cookie)).status,200);assert.equal((await call('/auth/login','POST',{identity:'first@example.com',password:'EmailTest@123'})).status,401);assert.equal((await call('/auth/login','POST',{identity:'changed@example.com',password:'EmailTest@123'})).status,200);
  const mine=(await call('/bootstrap','GET',undefined,cookie)).body.store.members;assert.equal(mine.find(m=>m.id===first.body.memberId).email,'changed@example.com');assert.equal(mine.find(m=>m.id===third.body.memberId).email,'');assert.equal((await call('/bootstrap')).body.store.members.length,0);
  const without={...member,email:''};assert.equal((await call('/auth/register','POST',{member:without,password:'EmailTest@123'})).status,201);assert.equal((await call('/auth/register','POST',{member:without,password:'EmailTest@123'})).status,201);
  await db.exec(await readFile(new URL('../server/migrations/002_member_email.sql',import.meta.url),'utf8'));assert.equal((await db.query('SELECT email FROM members WHERE id=$1',[first.body.memberId])).rows[0].email,'changed@example.com');
  // The database must enforce uniqueness too, even when application checks race.
  await assert.rejects(db.query('UPDATE members SET email=$1 WHERE id=$2',[' CHANGED@EXAMPLE.COM ',third.body.memberId]),e=>e.code==='23505');
  const adminStart=await call('/auth/login','POST',{identity:'PH00001',password:'PhatHao@123'});const admin=await call('/auth/verify','POST',adminStart.body);assert.equal((await call('/requirements/email','PATCH',{required:true},admin.cookie)).status,200);assert.equal((await call('/auth/register','POST',{member:without,password:'EmailTest@123'})).status,400);
 }finally{await db.close();}
});

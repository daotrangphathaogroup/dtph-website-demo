import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';

test('Next Web Request/Response preserves JSON, OTP, cookies and permissions',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false});
 const call=(path,method='GET',body,cookie)=>handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));
 try{
  const bootstrap=await call('/bootstrap');assert.equal(bootstrap.status,200);assert.equal((await bootstrap.json()).session,null);assert.equal(bootstrap.headers.get('cache-control'),'no-store');
  const started=await call('/auth/login','POST',{identity:'PH00001',password:'PhatHao@123'});assert.equal(started.status,200);const challenge=await started.json();
  const verified=await call('/auth/verify','POST',challenge);assert.equal(verified.status,200);const cookie=verified.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);
  const state=await (await call('/bootstrap','GET',undefined,cookie.split(';')[0])).json();assert.equal(state.session.role,'admin');assert.equal(state.store.members.length,36);
  assert.equal((await call('/requirements/avatar','PATCH',{required:true})).status,401);
  assert.equal((await call('/auth/verify','POST',challenge)).status,400);
  const malformed=await handleRequest(app,new Request('http://127.0.0.1:5173/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{not-json'}));assert.equal(malformed.status,400);
  const oversized=await handleRequest(app,new Request('http://127.0.0.1:5173/api/auth/register',{method:'POST',headers:{'Content-Length':'3000000'},body:'x'}));assert.equal(oversized.status,413);
  assert.equal((await call('/missing')).status,404);
 }finally{await db.close();}
});

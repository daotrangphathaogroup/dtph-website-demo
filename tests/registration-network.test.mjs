import test from 'node:test';
import assert from 'node:assert/strict';
import {submitRegistration} from '../src/lib/api.ts';
const body={requestId:'bc39b2f6-5ce1-4dba-b1e8-ec8743509652',values:{name:'Fixture'}};

test('Safari lost response retries the identical registration and accepts the saved receipt',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls.push({url,options});
  if(calls.length===1)throw new TypeError('Load failed');
  return Response.json({ok:true,status:'pending'});
 });
 const result=submitRegistration(body,new AbortController().signal);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,1);
 t.mock.timers.tick(1500);
 assert.deepEqual(await result,{ok:true,status:'pending'});
 assert.equal(calls.length,2);
 assert.equal(calls[0].options.body,calls[1].options.body);
});
test('Registration validation errors are not retried',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',async()=>Response.json({error:'Thiếu thông tin.'},{status:400}));
 await assert.rejects(submitRegistration(body,new AbortController().signal),/Thiếu thông tin/);
 assert.equal(fetch.mock.callCount(),1);
});
test('Repeated network failure is bounded and keeps a useful retry message',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('Load failed')});
 const result=assert.rejects(submitRegistration(body,new AbortController().signal),/Thông tin vẫn được giữ nguyên/);
 await new Promise(resolve=>setImmediate(resolve));t.mock.timers.tick(1500);await result;
 assert.equal(fetch.mock.callCount(),2);
});
test('Leaving the registration cancels the retry',async t=>{
 const controller=new AbortController();
 const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('Load failed')});
 const result=assert.rejects(submitRegistration(body,controller.signal),{name:'AbortError'});
 await new Promise(resolve=>setImmediate(resolve));controller.abort();await result;
 assert.equal(fetch.mock.callCount(),1);
});

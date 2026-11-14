import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationDelivery,deliveryGatherTime,deliveryMotion} from '../src/lib/registration-delivery.ts';

test('Delivery packs, waits for server acceptance, then departs and completes', async () => {
 let accept;
 const response=new Promise(resolve=>{accept=resolve;});
 const phases=[];
 const done=registrationDelivery(()=>response,p=>phases.push(p),new AbortController().signal,false);
 await new Promise(r=>setTimeout(r,deliveryGatherTime(5)+deliveryMotion.closing+50));
 assert.deepEqual(phases,['packing','waiting']);
 accept({status:'pending'});
 assert.deepEqual(await done,{status:'pending'});
 assert.deepEqual(phases,['packing','waiting','closing','sending']);
});
test('Failure never shows departure and cancels the pending packing timer',async()=>{
 const phases=[];
 await assert.rejects(registrationDelivery(async()=>{throw new Error('Offline');},p=>phases.push(p),new AbortController().signal,false),/Offline/);
 await new Promise(r=>setTimeout(r,700));
 assert.deepEqual(phases,['packing']);
});
test('Unmount cancellation prevents departure and completion, reduced motion skips animation delay',async()=>{
 const controller=new AbortController(), phases=[];
 const done=registrationDelivery(async()=>({status:'approved'}),p=>phases.push(p),controller.signal,false);
 controller.abort();await assert.rejects(done,{name:'AbortError'});
 assert.deepEqual(phases,['packing']);
 assert.deepEqual(await registrationDelivery(async()=>({status:'approved'}),()=>{},new AbortController().signal,true),{status:'approved'});
});

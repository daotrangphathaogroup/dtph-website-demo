import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveOptimistically,withRequirement,withEnrollment} from '../src/lib/member-updates.ts';
const initial=()=>({members:[],requirements:{avatar:false,name:true},enrollments:[{memberId:'PH2',classId:'other',date:'2026-10-01'}]});
test('Updates appear before save completes and duplicate clicks send one request',async()=>{
 let state=initial(),finish,calls=0;const pending=new Set();const flags=[];
 const options={key:'avatar',pending,onPending:(key,busy)=>flags.push(busy),apply:()=>{state=withRequirement(state,'avatar',true);},rollback:()=>{state=withRequirement(state,'avatar',false);},save:async()=>{calls++;await new Promise(resolve=>{finish=resolve;});}};
 const first=saveOptimistically(options);assert.equal(state.requirements.avatar,true);assert.equal(pending.has('avatar'),true);assert.equal(await saveOptimistically(options),false);assert.equal(calls,1);finish();assert.equal(await first,true);assert.deepEqual(flags,[true,false]);assert.equal(pending.size,0);
});
test('Failed save rolls back one field while preserving another successful update',async()=>{
 let state=initial(),reject;const pending=new Set();
 const update=saveOptimistically({key:'avatar',pending,onPending(){},apply:()=>{state=withRequirement(state,'avatar',true);},rollback:()=>{state=withRequirement(state,'avatar',false);},save:()=>new Promise((resolve,no)=>{reject=no;})});
 state=withRequirement(state,'name',false);reject(new Error('Network unavailable'));await assert.rejects(update,/Network unavailable/);assert.equal(state.requirements.avatar,false);assert.equal(state.requirements.name,false);assert.equal(pending.size,0);
});
test('Enrollment uses server date and rollback preserves unrelated enrollments',async()=>{
 let state=initial();const pending=new Set(),before=state.enrollments.find(e=>e.memberId==='PH1'&&e.classId==='tldd');
 await saveOptimistically({key:'join',pending,onPending(){},apply:()=>{state=withEnrollment(state,'PH1','tldd',{memberId:'PH1',classId:'tldd',date:'2026-10-02'});},rollback:()=>{state=withEnrollment(state,'PH1','tldd',before);},save:async()=>{state=withEnrollment(state,'PH1','tldd',{memberId:'PH1',classId:'tldd',date:'2026-10-03'});}});
 assert.equal(state.enrollments.find(e=>e.memberId==='PH1').date,'2026-10-03');const existing=state.enrollments.find(e=>e.memberId==='PH1');
 await assert.rejects(saveOptimistically({key:'cancel',pending,onPending(){},apply:()=>{state=withEnrollment(state,'PH1','tldd');},rollback:()=>{state=withEnrollment(state,'PH1','tldd',existing);},save:async()=>{throw new Error('Permission denied');}}),/Permission denied/);
 assert.equal(state.enrollments.length,2);assert.deepEqual(state.enrollments.find(e=>e.memberId==='PH1'),existing);assert.deepEqual(state.enrollments.find(e=>e.memberId==='PH2'),initial().enrollments[0]);
});

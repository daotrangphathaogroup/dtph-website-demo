import {test} from 'node:test';
import assert from 'node:assert/strict';
import {operationsReport,filterOperations,emptyOperationFilters,contactIssue,transitionReview,pendingDate,matchesWork} from '../src/lib/operations.ts';
const today='2026-11-10';
const member=(id,group='youth',profileData={},extra={})=>({id,name:id,group,registrationStatus:'approved',birthday:'2000-01-01',phone:'0901234567',profileData,...extra});
test('Operations counts distinct approved profiles; caregiver validity uses the full directory',()=>{
 const carer=member('carer','congregation');
 const records=[member('a','children',{caregiver:'carer',relativePhone:'0901234567',team:1,address:'Tân Phong'}),member('b','youth',{caregiver:'missing',team:2,address:'Tân Phong'}),member('c','youth',{caregiver:'c',team:3}),member('d','youth',{team:''}),member('e','youth',{}, {registrationStatus:'pending'}),member('f','youth',{}, {registrationStatus:'rejected'}),member('g','youth',{}, {registrationStatus:undefined})];
 const r=operationsReport([...records,records[0]],[...records,carer],today);
 assert.equal(r.rows.length,4);assert.equal(r.assigned,1);assert.equal(r.counts.links,2);assert.equal(r.counts.unassigned,1);
 assert.equal(r.assigned+r.counts.links+r.counts.unassigned,r.rows.length);
 assert.equal(r.caregivers[0].id,'carer');assert.equal(r.counts.team,1);
 for(const total of [r.groups.reduce((s,g)=>s+g.total,0),r.matrix.flatMap(t=>t.cells).reduce((s,c)=>s+c.total,0),r.wards.reduce((s,w)=>s+w.total,0)])assert.equal(total,4);
 assert.equal(r.counts.contact,0,'child personal phone is not required when parent channel exists');
});
test('Contact follow-ups distinguish adult required personal phone from optional child parent channel',()=>{
 assert.equal(contactIssue(member('a','children',{relativePhone:'0901234567',phone:''})), '');
 assert.match(contactIssue(member('a','children',{relativePhone:'',phone:'0901234567'})),/Chưa có SĐT PH/);
 assert.match(contactIssue(member('b','youth',{phone:''})),/Chưa có SĐT cá nhân/);
 assert.equal(contactIssue(member('c','congregation',{phone:'+84 901 234 567'})),'');
 assert.match(contactIssue(member('d','youth',{phone:'abc0901234567'})),/cần xác minh/);
});
test('Group/team/ward scope preserves explicit overrides and unknown buckets',()=>{
 const rows=[member('a','children',{team:2,address:'Tân Hạnh'}),member('b','youth',{team:1,address:'Tân Hạnh'}),member('c','youth',{team:'',address:''})];
 assert.deepEqual(filterOperations(rows,{...emptyOperationFilters,group:'children',team:'2',ward:'Biên Hòa'}).map(m=>m.id),['a']);
 assert.deepEqual(filterOperations(rows,{...emptyOperationFilters,team:'unknown',ward:'unknown'}).map(m=>m.id),['c']);
});
test('Age review uses exact 16/41 milestones and valid birthdays, without moving recorded groups',()=>{
 const child=member('child','children',{birthday:'2011-02-08'});
 assert.match(transitionReview(child,today),/Tròn 16 tuổi trong 90 ngày/);assert.equal(child.group,'children');
 assert.equal(transitionReview(member('outside','children',{birthday:'2011-02-09'}),today),'');
 assert.match(transitionReview(member('due','children',{birthday:'2010-11-10'}),today),/cần rà soát/);
 assert.match(transitionReview(member('youth','youth',{birthday:'1985-11-11'}),today),/Tròn 41 tuổi trong 1 ngày/);
 assert.equal(transitionReview(member('adult','congregation',{birthday:'1970-01-01'}),today),'');
 assert.equal(transitionReview(member('bad','children',{birthday:'invalid'}),today),'');
});
test('Pending timestamps never borrow imported joined dates; empty reports stay finite',()=>{
 assert.equal(pendingDate(member('a','youth',{}, {submittedAt:'bad',joined:'2000-01-01'}),today),Infinity);
 assert.equal(pendingDate(member('b','youth',{}, {submittedAt:'2027-01-01T00:00:00Z'}),today),Infinity);
 assert.ok(Number.isFinite(pendingDate(member('c','youth',{}, {submittedAt:'2026-11-09T18:00:00Z'}),today)));
 const r=operationsReport([],[],today);assert.equal(r.counts.all,0);assert.equal(r.assigned,0);assert.equal(r.wards.length,0);assert.equal(r.matrix.length,4);
});
test('Recognition tags never change operational tasks or imply activity',()=>{
 const a=member('a','children',{relativePhone:'0901234567',team:1,birthday:'2018-01-01'}),b={...a,profileData:{...a.profileData,status:['tinh-tan','hoa-dong']}};
 assert.deepEqual(operationsReport([a],[a],today).counts,operationsReport([b],[b],today).counts);
 const r=operationsReport([a],[a],today);assert.equal(matchesWork(r.flags.get('a'),'contact'),false);assert.equal(matchesWork(r.flags.get('a'),'unassigned'),true);
});

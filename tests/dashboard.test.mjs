import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ageBand,memberAge,registrationDate,filterDashboard,emptyDashboardFilters,distribution,monthlyRegistrations} from '../src/lib/dashboard.ts';
const today='2026-10-27';
const person=(id,group,birthday,ward,team,submittedAt,extra={})=>({id,group,name:id,birthday,joined:'2025-01-01',submittedAt,profileData:{birthday,address:ward,team,gender:'Nam',...extra}});
const people=[person('a','children','2014-10-28','Tân Hạnh',1,'2026-09-30T18:30:00Z'),person('b','youth','2000-10-27','Long Bình',3,'2026-10-02T00:00:00Z',{gender:'Nữ'}),person('c','congregation','1970-01-01','Tân Phong',2,'2025-10-02T00:00:00Z'),person('d','youth','','','',undefined)];
test('Dashboard ages honor birthdays and missing/invalid/future birth dates',()=>{
 assert.equal(memberAge(people[0],today),11);assert.equal(memberAge(people[1],today),26);
 assert.equal(memberAge(person('x','children','2026-10-28','',1,''),today),null);assert.equal(memberAge(person('x','children','2001-02-29','',1,''),today),null);
 assert.equal(memberAge(people[3],today),null);assert.equal(ageBand(null),'unknown');assert.equal(ageBand(12),'under13');assert.equal(ageBand(13),'13to17');assert.equal(ageBand(18),'18to30');assert.equal(ageBand(30),'18to30');assert.equal(ageBand(31),'31to45');assert.equal(ageBand(60),'46to60');assert.equal(ageBand(61),'over60');
});
test('Registration filters use Vietnam calendar date, not UTC or birth date',()=>{
 assert.equal(registrationDate(people[0]),'2026-10-01');assert.equal(registrationDate(people[3]),'2025-01-01');
 assert.deepEqual(filterDashboard(people,{...emptyDashboardFilters,year:'2026',month:10},undefined,today).map(m=>m.id),['a','b']);
 assert.deepEqual(filterDashboard(people,{...emptyDashboardFilters,year:'all',month:10},undefined,today).map(m=>m.id),['a','b','c']);
 assert.deepEqual(filterDashboard(people,{...emptyDashboardFilters,month:9},undefined,today),[]);
});
test('Every dashboard filter combines and group scope cannot leak other groups',()=>{
 const filters={...emptyDashboardFilters,group:'youth',ward:'Long Bình',team:'3',age:'18to30',year:'2026',month:10};
 assert.deepEqual(filterDashboard(people,filters,undefined,today).map(m=>m.id),['b']);assert.deepEqual(filterDashboard(people,filters,'children',today),[]);
 assert.deepEqual(filterDashboard(people,emptyDashboardFilters,'youth',today).map(m=>m.id),['b','d']);assert.deepEqual(filterDashboard(people,{...emptyDashboardFilters,age:'unknown',team:'unknown',ward:'unknown'},undefined,today).map(m=>m.id),['d']);
 assert.deepEqual(filterDashboard(people,emptyDashboardFilters,undefined,today),people);
});
test('Charts reconcile to the same filtered people and preserve unknown categories',()=>{
 const filtered=filterDashboard(people,{...emptyDashboardFilters,year:'2026'},undefined,today);
 for(const dimension of ['age','gender','ward'])assert.equal(distribution(filtered,dimension,today).reduce((n,r)=>n+r.count,0),filtered.length);
 const months=monthlyRegistrations(filtered);assert.equal(months.length,12);assert.equal(months[9],2);assert.equal(months.reduce((a,b)=>a+b,0),2);
 assert.equal(distribution(people,'ward',today).find(r=>r.label==='Chưa có phường').count,1);
 assert.equal(distribution(people,'age',today).find(r=>r.label==='Chưa có ngày sinh').count,1);
});
test('Empty dashboards contain twelve actual zero months and no fabricated statistics',()=>{
 assert.deepEqual(monthlyRegistrations([]),Array(12).fill(0));assert.deepEqual(distribution([],'ward',today),[]);assert.ok(distribution([],'age',today).every(r=>r.count===0));
});

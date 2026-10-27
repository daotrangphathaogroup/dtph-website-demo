import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoProfiles} from '../scripts/lib/demo-profiles.mjs';
import {getTeam} from '../src/lib/areas.ts';
import {defaultSchemas} from '../src/lib/registration.ts';
import {memberAge} from '../src/lib/dashboard.ts';
test('Synthetic demo data is reproducible and covers every dashboard group, team, month and identity relationship field',()=>{
 const rows=generateDemoProfiles({seed:123,asOf:'2026-10-27'});assert.deepEqual(rows,generateDemoProfiles({seed:123,asOf:'2026-10-27'}));assert.equal(rows.length,372);
 assert.equal(rows.filter(r=>r.registrationStatus==='pending').length,12);
 for(const [group,count]of [['children',90],['youth',120],['congregation',150]])assert.equal(rows.filter(r=>r.group===group&&r.registrationStatus==='approved').length,count);
 assert.equal(new Set(rows.map(r=>r.joined.slice(5,7))).size,12);assert.equal(new Set(rows.map(r=>r.profileData.team)).size,3);assert.equal(new Set(rows.map(r=>r.profileData.address)).size,20);
 for(const r of rows){const d=r.profileData;assert.equal(getTeam(d.address),d.team);assert.ok(r.joined<='2026-10-27');assert.ok(r.submittedAt.slice(0,10)<='2026-10-27');assert.match(d.notes,/DỮ LIỆU MẪU/);assert.equal(d.status,'');if(r.group!=='children')assert.equal(d.position,'');assert.equal(d.occupation==='Không'?d.job==='':true,true);
  const age=memberAge({birthday:d.birthday,profileData:d},'2026-10-27');assert.ok(age!==null&&age>=5&&age<=78);for(const f of defaultSchemas[r.group].fields.filter(f=>f.required&&f.type!=='image'))assert.notEqual(String(d[f.key]??'').trim(),'');
 }
});

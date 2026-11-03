import test from 'node:test';
import assert from 'node:assert/strict';
import {memberProfileValues} from '../src/lib/member-profile.ts';

test('Profile editing receives legacy core fields and retains linked IDs and explicit empty values',()=>{
 const member={id:'PH1',name:'An',birthday:'2000-01-01',phone:'0901234567',email:'',address:'Tân Hạnh',avatar:'/portrait.webp',team:1,joined:'2026-01-01',profileData:{phone:'',team:'',introducedBy:'PH2',notes:0},references:{introducedBy:{id:'PH2',name:'Tâm An'}}};
 const values=memberProfileValues(member);
 assert.equal(values.birthday,'2000-01-01');
 assert.equal(values.address,'Tân Hạnh');
 assert.equal(values.avatar,'/portrait.webp');
 assert.equal(values.phone,'');
 assert.equal(values.team,'');
 assert.equal(values.introducedBy,'PH2');
 assert.equal(values.notes,0);
 assert.equal(values.id,'PH1');
 assert.equal(member.profileData.birthday,undefined);
});

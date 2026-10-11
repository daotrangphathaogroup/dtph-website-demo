import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teamAreas,wards,getTeam,teamLabel,matchesTeam,areaOptions} from '../src/lib/areas.ts';
test('Ward mapping has no duplicates and derives all three teams and unassigned legacy areas',()=>{
 assert.equal(wards.length,20);assert.equal(new Set(wards).size,20);
 for(const [team,areas]of Object.entries(teamAreas))for(const area of areas){assert.equal(getTeam(area),Number(team));assert.equal(teamLabel(area),'Tổ '+team);assert.equal(matchesTeam(area,team),true);}
 assert.equal(getTeam('Đồng Nai'),null);assert.equal(getTeam(''),null);assert.equal(matchesTeam('Đồng Nai','unassigned'),true);assert.equal(matchesTeam('Đồng Nai','1'),false);assert.equal(matchesTeam('Tân Phong','1'),false);assert.equal(matchesTeam('Tân Phong','all'),true);
 const options=areaOptions(['Đồng Nai','Đồng Nai','Tân Phong','']);assert.equal(options.length,21);assert.ok(options.includes('Đồng Nai'));
});

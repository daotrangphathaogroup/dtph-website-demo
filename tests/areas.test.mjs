import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teamAreas,wards,getTeam,teamLabel,matchesTeam,areaOptions,currentWard,unassignedWards} from '../src/lib/areas.ts';
test('Ward mapping has no duplicates and derives all three teams and unassigned legacy areas',()=>{
 assert.equal(wards.length,25);assert.equal(new Set(wards).size,25);
 for(const [team,areas]of Object.entries(teamAreas))for(const area of areas){assert.equal(getTeam(area),Number(team));assert.equal(teamLabel(area),'Tổ '+team);assert.equal(matchesTeam(area,team),true);}
 for(const ward of unassignedWards)assert.equal(getTeam(ward),null);
 assert.ok(wards.every(currentWard));
 assert.equal(currentWard('Hố Nai'),'Long Bình');
 assert.equal(currentWard('Tân Hòa'),'Hố Nai');
 assert.equal(currentWard('An Bình'),'Trấn Biên');
 assert.equal(currentWard('Đồng Nai'),'');
 assert.equal(getTeam('Đồng Nai'),null);assert.equal(getTeam(''),null);assert.equal(matchesTeam('Đồng Nai','unassigned'),true);assert.equal(matchesTeam('Đồng Nai','1'),false);assert.equal(matchesTeam('Tân Phong','1'),false);assert.equal(matchesTeam('Tân Phong','all'),true);
 const options=areaOptions(['Đồng Nai','Đồng Nai','Tân Phong','']);assert.equal(options.length,26);assert.ok(options.includes('Đồng Nai'));
});

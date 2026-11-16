import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teamAreas,wards,getTeam,teamLabel,matchesTeam,areaOptions,currentWard,teamsForGroup} from '../src/lib/areas.ts';
test('Ward mapping has no duplicates and maps all five teams with the extra teams scoped to Đạo tràng',()=>{
 assert.equal(wards.length,27);assert.equal(new Set(wards).size,27);
 for(const [team,areas]of Object.entries(teamAreas))for(const area of areas){assert.equal(getTeam(area),Number(team));assert.equal(teamLabel(area),'Tổ '+team);assert.equal(matchesTeam(area,team),true);}
 for(const [ward,team] of [['Quang Vinh',1],['Trung Dũng',1],['Tân Mai',2],['Bình Đa',3],['Tam Hiệp',3],['Trị An',4],['Thị trấn Vĩnh An',5]])assert.equal(getTeam(ward),team);
 assert.deepEqual(teamsForGroup('congregation'),[1,2,3,4,5]);
 for(const group of ['children','youth']){assert.deepEqual(teamsForGroup(group),[1,2,3]);assert.equal(getTeam('Thị trấn Vĩnh An',group),null);}
 assert.equal(currentWard('Thị trấn Vĩnh An'),'Trị An');
 assert.ok(wards.every(currentWard));
 assert.equal(currentWard('Hố Nai'),'Long Bình');
 assert.equal(currentWard('Tân Hòa'),'Hố Nai');
 assert.equal(currentWard('An Bình'),'Trấn Biên');
 assert.equal(currentWard('Đồng Nai'),'');
 assert.equal(getTeam('Đồng Nai'),null);assert.equal(getTeam(''),null);assert.equal(matchesTeam('Đồng Nai','unassigned'),true);assert.equal(matchesTeam('Đồng Nai','1'),false);assert.equal(matchesTeam('Tân Phong','1'),false);assert.equal(matchesTeam('Tân Phong','all'),true);
 const options=areaOptions(['Đồng Nai','Đồng Nai','Tân Phong','']);assert.equal(options.length,28);assert.ok(options.includes('Đồng Nai'));
});

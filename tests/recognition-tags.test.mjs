import {test} from 'node:test';import assert from 'node:assert/strict';
import {selectedRecognitionTags,recognitionTagText} from '../src/lib/recognition-tags.ts';
import {filterSheet,sheetExportData,sheetValue} from '../src/lib/sheet.ts';
const tags={key:'status',label:'Tình trạng',type:'tags',required:false};
test('Merit tags have stable identity, canonical order and never infer from old activity',()=>{
 assert.equal(selectedRecognitionTags('Hoạt động tích cực').length,0);
 assert.deepEqual(selectedRecognitionTags(['hoa-dong','fake','tinh-tan','tinh-tan']).map(t=>t.id),['tinh-tan','hoa-dong']);
 assert.equal(recognitionTagText(['hoa-dong','tinh-tan']),'Tinh tấn · Hòa đồng');
});
test('Sheet search, individual tag filtering and export use Vietnamese tag names',()=>{
 const members=[{id:'a',name:'An',profileData:{status:['tinh-tan','hoa-dong']}},{id:'b',name:'Bình',profileData:{status:['cham-chi']}},{id:'c',name:'Cúc',profileData:{status:[]}}];
 assert.equal(sheetValue(members[0],'status'),'Tinh tấn · Hòa đồng');
 assert.deepEqual(filterSheet(members,'tinh tan',{},[tags]).map(m=>m.id),['a']);
 assert.deepEqual(filterSheet(members,'',{status:'Hòa đồng'},[tags]).map(m=>m.id),['a']);
 assert.deepEqual(filterSheet(members,'',{status:'__empty'},[tags]).map(m=>m.id),['c']);
 assert.deepEqual(sheetExportData(members,[tags]),[['Tình trạng'],['Tinh tấn · Hòa đồng'],['Chăm chỉ'],['']]);
});

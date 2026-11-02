import test from 'node:test';
import assert from 'node:assert/strict';
import {filterSheet,sortSheet,sheetCsv,sheetValue} from '../src/lib/sheet.ts';
const fields=[{key:'name',label:'Họ tên',type:'text'},{key:'birthYear',label:'Năm sinh',type:'year'},{key:'phone',label:'SĐT',type:'phone'},{key:'team',label:'Tổ',type:'team'}];
const rows=[{id:'a',name:'Đặng An',team:1,profileData:{name:'Đặng An',birthYear:2010,phone:'0901234567'}},{id:'b',name:'Nguyễn Bình',profileData:{name:'Nguyễn Bình',birthYear:2002,team:2}},{id:'c',name:'Trần Cúc',profileData:{name:'Trần Cúc'}}];
test('sheet search handles Vietnamese accents and combines words across fields',()=>{assert.deepEqual(filterSheet(rows,'dang 090',{},fields).map(m=>m.id),['a']);assert.deepEqual(filterSheet(rows,'Nguyen',{team:'2'},fields).map(m=>m.id),['b']);assert.equal(filterSheet(rows,'dang',{team:'2'},fields).length,0);});
test('sheet filters empty values, uses legacy team fallback, and retains zero values',()=>{assert.deepEqual(filterSheet(rows,'',{team:'__empty'},fields).map(m=>m.id),['c']);assert.equal(sheetValue(rows[0],'team'),1);assert.equal(sheetValue({name:'A',profileData:{attendance:0}},'attendance'),0);});
test('numeric sorting leaves missing data last in both directions without mutating source',()=>{assert.deepEqual(sortSheet(rows,fields[1],'asc').map(m=>m.id),['b','a','c']);assert.deepEqual(sortSheet(rows,fields[1],'desc').map(m=>m.id),['a','b','c']);assert.deepEqual(rows.map(m=>m.id),['a','b','c']);});
test('CSV includes only supplied columns and protects formulas, quotes and newlines',()=>{const csv=sheetCsv([{name:' =SUM(1,2)',profileData:{phone:'0901234567',notes:'a"b\nc'}}],[fields[0],fields[2],{key:'notes',label:'Ghi chú',type:'textarea'}]);assert.ok(csv.startsWith('\ufeff"Họ tên","SĐT","Ghi chú"'));assert.ok(csv.includes('"\' =SUM(1,2)"'));assert.ok(csv.includes('"0901234567"'));assert.ok(csv.includes('"a""b\nc"'));assert.ok(!csv.includes('Năm sinh'));});
test('Workbook CSV uses shared phone field, readable references, generated fields and date format',()=>{
 const fields=[{key:'id',label:'ID',type:'text'},{key:'birthday',label:'Ngày sinh',type:'date'},{key:'job',label:'Nơi công tác',type:'text'},{key:'relativePhone',label:'SĐT PH',type:'phone'},{key:'introducedBy',label:'Người giới thiệu',type:'member'}];
 const member={id:'PH001',joined:'2026-10-27',name:'Học sinh',references:{introducedBy:{id:'PH002',name:'Huynh đệ A'}},profileData:{birthday:'2012-03-04',occupation:'Học sinh',job:'Trường A',relativePhone:'0901234567',introducedBy:'PH002'}};
 const csv=sheetCsv([member],fields);assert.ok(csv.includes('"Trường học"'));assert.ok(csv.includes('"SĐT PH"'));assert.ok(csv.includes('"04/03/2012"'));assert.ok(csv.includes('"PH001"'));assert.ok(csv.includes('"Huynh đệ A"'));assert.equal(sheetValue(member,'joined'),'2026-10-27');
});

test('Search uses the displayed Vietnamese date and team label', () => {
 const fields=[{key:'name',label:'Họ tên',type:'text'},{key:'birthday',label:'Ngày sinh',type:'date'},{key:'team',label:'Tổ',type:'team'}];
 const member={id:'PH101',name:'Nguyễn An',profileData:{name:'Nguyễn An',birthday:'2012-03-04',team:2}};
 assert.deepEqual(filterSheet([member],'04/03/2012',{},fields).map(m=>m.id),['PH101']);
 assert.deepEqual(filterSheet([member],'Tổ 2',{},fields).map(m=>m.id),['PH101']);
});
test('Search finds legacy column values and formatted phone numbers', () => {
 const fields=[{key:'name',label:'Họ tên',type:'text'},{key:'phone',label:'SĐT',type:'phone'},{key:'birthday',label:'Ngày sinh',type:'date'}];
 const member={id:'PH102',name:'Đặng An',phone:'0901234567',birthday:'2012-03-04',profileData:{}};
 assert.deepEqual(filterSheet([member],'0901-234-567',{},fields).map(m=>m.id),['PH102']);
 assert.deepEqual(filterSheet([member],'04/03/2012',{},fields).map(m=>m.id),['PH102']);
});
test('Name tokens match word starts, not unrelated substrings inside other names', () => {
 const fields=[{key:'name',label:'Họ tên',type:'text'}];
 const members=[{id:'an',name:'Đặng An'},{id:'thanh',name:'Đặng Thanh'},{id:'cuc',name:'Trần Cúc'}];
 assert.deepEqual(filterSheet(members,'an',{},fields).map(m=>m.id),['an']);
 assert.deepEqual(filterSheet(members,'DẶNG   AN',{},fields).map(m=>m.id),['an']);
});
test('Search does not mix date or team digits across unrelated fields', () => {
 const fields=[{key:'birthday',label:'Ngày sinh',type:'date'},{key:'team',label:'Tổ',type:'team'}];
 const member={id:'PH103',name:'A',birthday:'2012-03-04',team:1};
 assert.equal(filterSheet([member],'03/04/2012',{},fields).length,0);
 assert.equal(filterSheet([member],'Tổ 2',{},fields).length,0);
});
test('Search normalizes international Vietnamese phone prefix and punctuation', () => {
 const fields=[{key:'phone',label:'SĐT',type:'phone'}];
 assert.equal(filterSheet([{id:'PH104',phone:'0901 234 567'}],'+84 (901) 234-567',{},fields).length,1);
});

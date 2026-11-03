import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync, strFromU8} from 'fflate';
import {excelBlob} from '../src/lib/excel-export.ts';
import {sheetExportData} from '../src/lib/sheet.ts';

test('Excel export is a real XLSX preserving Vietnamese, phone zeroes, blanks, numbers and literal formulas', async () => {
 const blob=await excelBlob([
  ['Họ tên','SĐT','Ngày sinh','Ghi chú','Số lần'],
  ['Đặng An','0901234567','04/03/2012','=SUM(1,2)',0],
  ['Nguyễn Bình',undefined,null,'',2],
 ]);
 const zip=unzipSync(new Uint8Array(await blob.arrayBuffer()));
 assert.ok(zip['[Content_Types].xml']);
 const sheet=strFromU8(zip['xl/worksheets/sheet1.xml']);
 const strings=strFromU8(zip['xl/sharedStrings.xml']);
 for(const text of ['Đặng An','0901234567','04/03/2012','=SUM(1,2)'])assert.ok(strings.includes(text));
 assert.match(sheet,/<c r="B2"[^>]*t="s"/);
 assert.match(sheet,/<c r="E2"[^>]*><v>0<\/v>/);
 assert.match(sheet,/<c r="B3"[^>]*\/>/);
 assert.doesNotMatch(sheet,/<f[ >]/);
 assert.match(sheet,/state="frozen"/);
});

test('Excel member rows preserve visible column order, readable references, dates and student labels', () => {
 const rows=sheetExportData([{id:'PH1',name:'An',birthday:'2012-03-04',phone:'0901234567',references:{introducedBy:{id:'PH2',name:'Tâm An'}},profileData:{occupation:'Học sinh',job:'Trường A'}}], [
  {key:'phone',label:'SĐT',type:'phone'},
  {key:'birthday',label:'Ngày sinh',type:'date'},
  {key:'job',label:'Nơi công tác',type:'text'},
  {key:'introducedBy',label:'Người giới thiệu',type:'member'},
 ]);
 assert.deepEqual(rows,[['SĐT','Ngày sinh','Trường học','Người giới thiệu'],['0901234567','04/03/2012','Trường A','Tâm An']]);
});

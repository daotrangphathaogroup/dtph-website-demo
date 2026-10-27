import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';
import {validValues,memoryStorage} from './profile-fixtures.mjs';
function client(app){return async(path,method='GET',body,cookie)=>{const response=await handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:response.status,body:response.headers.get('content-type')?.includes('application/json')?await response.json():null,bytes:!response.headers.get('content-type')?.includes('application/json')?Buffer.from(await response.arrayBuffer()):null,cookie:response.headers.getSetCookie()[0]?.split(';')[0]};};}
test('Workbook profiles: exact public fields, full staff data, image and linked identities',async t=>{
 const storage=memoryStorage();const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false,storage});const call=client(app);
 try{
  const dev=(await call('/admin/login','POST',{username:'dev',password:'1@345678'})).cookie;
  await call('/admin/accounts','POST',{username:'viewer',password:'ViewOnly@123',role:'manager'},dev);const manager=(await call('/admin/login','POST',{username:'viewer',password:'ViewOnly@123'})).cookie;
  await t.test('empty database starts with no demo people or classes',async()=>{assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,0);assert.equal((await db.query('SELECT count(*)::int AS n FROM classes')).rows[0].n,0);});
  const expected=['avatar','name','dharmaName','gender','birthday','occupation','job','address','team','hometown','phone'];
  await t.test('sheet 2 determines public order and required fields; sheet 1 adds staff fields',async()=>{
   for(const group of ['children','youth','congregation']){
    const schema=(await call('/registration-schemas/'+group)).body.schema;
    assert.deepEqual(schema.fields.map(f=>f.key),[...expected,...(group==='children'?['parentName']:[]),'relativePhone','introducedBy']);
    assert.deepEqual(schema.fields.filter(f=>f.required).map(f=>f.key),['avatar','name','gender','birthday','address','team',...(group!=='children'?['phone']:[])]);
    assert.deepEqual(schema.fields.find(f=>f.key==='gender').options,['Nam','Nữ']);
    const staff=(await call('/registration-schemas/'+group,'GET',undefined,dev)).body.schema;assert.equal(staff.fields.length,group==='children'?20:19);
    assert.ok(staff.fields.find(f=>f.key==='id').readOnly);assert.ok(staff.fields.find(f=>f.key==='joined').readOnly);
    for(const old of ['birthYear','studentCode','clubSinceYear','attendance2026','studyDate','remarks','parentPhone','studentPhone'])assert.ok(!staff.fields.some(f=>f.key===old));
   }
  });
  const ids={};
  await t.test('all groups register without accounts; shared phone allowed; retry is idempotent; dates and IDs generated',async()=>{
   for(const group of ['children','youth','congregation']){
    const values=validValues({name:group+' mới',hometown:'Đồng Nai',relativePhone:'0901234567',...(group==='children'?{phone:'',parentName:'Phụ huynh'}:{})}),requestId=randomUUID();
    const r=await call('/registrations/'+group,'POST',{values,requestId},manager);assert.equal(r.status,201);assert.equal(r.body.status,'approved');assert.equal((await call('/registrations/'+group,'POST',{values,requestId},manager)).status,200);
    const row=(await db.query('SELECT * FROM members WHERE name=$1',[values.name])).rows[0];ids[group]=row.id;assert.equal(row.profile_data.birthday,'2000-02-29');assert.ok(row.joined);assert.ok(row.id);assert.equal(row.profile_data.relativePhone,'0901234567');
    assert.equal((await call('/registrations/'+group,'POST',{values:{...values,name:'Changed'},requestId},manager)).status,409);
   }
   assert.equal((await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n,2);assert.deepEqual((await call('/bootstrap')).body.store.members,[]);
  });
  await t.test('required, old, staff-only, impossible/future dates and invalid options rejected on server',async()=>{
   for(const values of [validValues({avatar:''}),validValues({phone:''}),validValues({gender:'Khác'}),validValues({birthday:'2001-02-29'}),validValues({birthday:'2999-01-01'}),validValues({address:'Sai phường'}),validValues({hometown:'Sai tỉnh'}),validValues({team:4}),validValues({occupation:'Nghề không có'}),validValues({notes:'Forged'}),validValues({caregiver:ids.children}),validValues({id:'fake'}),validValues({joined:'2000-01-01'}),validValues({birthYear:2000})])assert.equal((await call('/registrations/youth','POST',{values,requestId:randomUUID()})).status,400);
   assert.equal((await call('/registrations/youth','POST',{values:validValues({parentName:'Sai nhóm'}),requestId:randomUUID()})).status,400);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{name:'Legacy bypass'},dev)).status,400);
  });
  await t.test('personal and relative phone share keys; team override persists; no occupation clears job',async()=>{
   assert.equal((await call('/registrations/youth','POST',{values:validValues({occupation:'Không',job:'Must clear'}),requestId:randomUUID()})).status,201);
   const result=await call('/members/'+ids.youth,'PATCH',{profileData:{occupation:'Không',job:'Must clear',team:3}},dev);assert.equal(result.status,200);assert.equal(result.body.member.profileData.job,'');assert.equal(result.body.member.team,3);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{profileData:{occupation:'Khác: Thợ may',job:'Xưởng may'}},dev)).status,200);
   assert.equal((await call('/members/'+ids.children,'PATCH',{profileData:{personality:'Điềm tĩnh',nickname:'Mây',notes:'Ghi chú'}},manager)).status,403);
   assert.equal((await call('/members/'+ids.children,'PATCH',{profileData:{personality:'Điềm tĩnh',nickname:'Mây',notes:'Ghi chú'}},dev)).status,200);
  });
  await t.test('linked member picker exposes minimal approved identities and portrait; links store ID, not name',async()=>{
   const data=validValues({name:'Đồng tên',introducedBy:ids.children});await call('/registrations/youth','POST',{values:data,requestId:randomUUID()},manager);await call('/registrations/congregation','POST',{values:validValues({name:'Đồng tên'}),requestId:randomUUID()},manager);
   const options=(await call('/member-options?q='+encodeURIComponent('Đồng tên'))).body.results;assert.equal(options.length,2);assert.notEqual(options[0].id,options[1].id);assert.deepEqual(Object.keys(options[0]).sort(),['avatar','group','id','name']);
   const pending=await call('/registrations/youth','POST',{values:validValues({name:'Pending identity'}),requestId:randomUUID()});assert.equal(pending.status,201);assert.deepEqual((await call('/member-options?q=Pending')).body.results,[]);
   const pendingId=(await db.query('SELECT id FROM members WHERE name=$1',['Pending identity'])).rows[0].id;
   for(const introducedBy of ['Raw name',pendingId])assert.equal((await call('/registrations/youth','POST',{values:validValues({introducedBy}),requestId:randomUUID()})).status,400);
   const result=await call('/members/'+ids.youth,'PATCH',{profileData:{caregiver:ids.children,introducedBy:ids.congregation}},dev);assert.equal(result.status,200);assert.equal(result.body.member.profileData.caregiver,ids.children);assert.equal(result.body.member.references.caregiver.id,ids.children);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{profileData:{caregiver:ids.youth}},dev)).status,400);
   assert.equal((await call('/member-portraits/'+pendingId)).status,404);assert.equal((await call('/member-portraits/'+ids.children)).status,200);
   const image=(await call('/member-portraits/'+ids.children)).bytes,meta=await sharp(image).metadata();assert.equal(meta.width,360);assert.equal(meta.height,480);assert.equal(meta.format,'webp');
   const portrait=(await db.query('SELECT avatar FROM members WHERE id=$1',[ids.children])).rows[0].avatar;assert.equal((await call(portrait.replace('/api',''))).status,401);
  });
  await t.test('configuration APIs are retired; schema, records and future fields survive migration rerun',async()=>{
   assert.equal((await call('/registration-schemas/youth/fields/dharmaName','PATCH',{required:true},dev)).status,404);
   assert.equal((await call('/registration-schemas/youth/fields/id','PATCH',{required:true},dev)).status,404);
   assert.equal((await call('/registration-schemas/youth/fields/phone','PATCH',{required:false},manager)).status,404);
   const before=(await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n;
   await createBackend({database:db,seedData:false,rateLimits:false,storage});assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,before);assert.equal((await call('/registration-schemas/youth')).body.schema.fields.find(f=>f.key==='dharmaName').required,false);
   assert.equal((await call('/registrations/youth','POST',{values:validValues({name:''}),requestId:randomUUID()})).status,400);
   assert.equal((await call('/registrations/congregation','POST',{values:validValues(),requestId:randomUUID()})).status,201);
   const extra={key:'additionalNote',label:'Ghi chú bổ sung',type:'text',required:false};await db.query('UPDATE registration_schemas SET fields=fields || $2::jsonb WHERE group_id=$1',['congregation',JSON.stringify([extra])]);assert.equal((await call('/registrations/congregation','POST',{values:validValues({additionalNote:'Mới'}),requestId:randomUUID()})).status,201);
  });
 }finally{await db.close();}
});

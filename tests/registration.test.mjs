import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
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
  const expected=['avatar','name','dharmaName','gender','birthday','address','team','phone'];
  await t.test('sheet 2 determines public order and required fields; sheet 1 adds staff fields',async()=>{
   for(const group of ['children','youth','congregation']){
    const schema=(await call('/registration-schemas/'+group)).body.schema;
    assert.deepEqual(schema.fields.map(f=>f.key),[...expected.slice(0,5),...(group==='children'?['schoolClass']:['occupation']),...expected.slice(5),...(group==='children'?['parentName','relativePhone','nickname']:['introducedBy'])]);
    assert.deepEqual(schema.fields.filter(f=>f.required).map(f=>f.key),['avatar','name','gender','birthday','address','team',...(group!=='children'?['phone']:[])]);
    assert.deepEqual(schema.fields.find(f=>f.key==='gender').options,['Nam','Nữ']);
    if(group==='children'){
     assert.equal(schema.fields.find(f=>f.key==='schoolClass').required,false);
     assert.equal(schema.fields.find(f=>f.key==='nickname').label,'Mã số');
    }
    const staff=(await call('/registration-schemas/'+group,'GET',undefined,dev)).body.schema;assert.equal(staff.fields.length,group==='children'?20:17);
    assert.ok(staff.fields.find(f=>f.key==='addressNew').readOnly);
    assert.ok(staff.fields.find(f=>f.key==='id').readOnly);assert.ok(staff.fields.find(f=>f.key==='joined').readOnly);
    for(const old of ['birthYear','studentCode','clubSinceYear','attendance2026','studyDate','remarks','parentPhone','studentPhone'])assert.ok(!staff.fields.some(f=>f.key===old));
   }
  });
  const ids={};
  await t.test('all groups register without accounts; shared phone allowed; retry is idempotent; dates and IDs generated',async()=>{
   for(const group of ['children','youth','congregation']){
    const values=validValues({name:group+' mới',...(group==='children'?{phone:'',parentName:'Phụ huynh',relativePhone:'0901234567',nickname:'0012'}:{})}),requestId=randomUUID();
    const r=await call('/registrations/'+group,'POST',{values,requestId},manager);assert.equal(r.status,201);assert.equal(r.body.status,'approved');assert.equal((await call('/registrations/'+group,'POST',{values,requestId},manager)).status,200);
    const row=(await db.query('SELECT * FROM members WHERE name=$1',[values.name])).rows[0];ids[group]=row.id;assert.equal(row.profile_data.birthday,'2000-02-29');assert.ok(row.joined);assert.ok(row.id);assert.equal(row.profile_data.relativePhone,group==='children'?'0901234567':undefined);if(group==='children')assert.equal(row.profile_data.nickname,'0012');
    assert.equal((await call('/registrations/'+group,'POST',{values:{...values,name:'Changed'},requestId},manager)).status,409);
   }
   assert.equal((await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n,2);assert.deepEqual((await call('/bootstrap')).body.store.members,[]);
  });
  await t.test('Old address is accepted independently of its derived current ward',async()=>{
   const values=validValues({name:'Địa chỉ đối chiếu',address:'Bình Đa',team:3});
   assert.equal((await call('/registrations/youth','POST',{values,requestId:randomUUID()},dev)).status,201);
   assert.equal((await call('/registrations/youth','POST',{values:{...values,addressNew:'Hố Nai'},requestId:randomUUID()},dev)).status,400);
   const row=(await db.query('SELECT id FROM members WHERE name=$1',[values.name])).rows[0];
   const updated=await call('/members/'+row.id,'PATCH',{profileData:{address:'Hố Nai'}},dev);
   assert.equal(updated.status,200);
   assert.equal(updated.body.member.profileData.address,'Hố Nai');
   assert.equal(updated.body.member.profileData.addressNew,'Long Bình');
   assert.equal(updated.body.member.team,3);
  });
  await t.test('required, old, staff-only, impossible/future dates and invalid options rejected on server',async()=>{
   for(const values of [validValues({avatar:''}),validValues({phone:''}),validValues({gender:'Khác'}),validValues({birthday:'2001-02-29'}),validValues({birthday:'2999-01-01'}),validValues({address:'Sai phường'}),validValues({hometown:'Sai tỉnh'}),validValues({team:4}),validValues({occupation:'Nghề không có'}),validValues({notes:'Forged'}),validValues({caregiver:ids.children}),validValues({id:'fake'}),validValues({joined:'2000-01-01'}),validValues({birthYear:2000})])assert.equal((await call('/registrations/youth','POST',{values,requestId:randomUUID()})).status,400);
   assert.equal((await call('/registrations/youth','POST',{values:validValues({relativePhone:'0901234567'}),requestId:randomUUID()})).status,400);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{name:'Legacy bypass'},dev)).status,400);
  });
  await t.test('retired fields are rejected, team persists and children care/class fields are editable',async()=>{
   assert.equal((await call('/registrations/youth','POST',{values:validValues({occupation:'Không',job:'Must reject'}),requestId:randomUUID()})).status,400);
   const result=await call('/members/'+ids.youth,'PATCH',{profileData:{occupation:'Không',team:3}},dev);assert.equal(result.status,200);assert.equal('job' in result.body.member.profileData,false);assert.equal(result.body.member.team,3);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{profileData:{occupation:'Khác: Thợ may'}},dev)).status,200);
   assert.equal((await call('/members/'+ids.children,'PATCH',{profileData:{nickname:'Mây',notes:'Ghi chú'}},manager)).status,403);
   assert.equal((await call('/members/'+ids.children,'PATCH',{profileData:{personality:'Điềm tĩnh'}},dev)).status,400);
  });
  await t.test('new child fields, hidden retained values and role options are validated',async()=>{
   const child=(await call('/registration-schemas/children','GET',undefined,dev)).body.schema;
   for(const key of ['occupation','introducedBy']){assert.ok(child.fields.find(f=>f.key===key).hiddenInTable);}
   const edited=await call('/members/'+ids.children,'PATCH',{profileData:{schoolClass:'12',caregiver:ids.youth,occupation:'Học sinh',introducedBy:ids.youth}},dev);
   assert.equal(edited.status,200);assert.equal(edited.body.member.profileData.schoolClass,'12');assert.equal(edited.body.member.references.caregiver.id,ids.youth);
   const kept=await call('/members/'+ids.children,'PATCH',{profileData:{nickname:'Bông'}},dev);
   assert.equal(kept.body.member.profileData.occupation,'Học sinh');assert.equal(kept.body.member.profileData.introducedBy,ids.youth);
   for(const value of ['1','12','Không']) assert.equal((await call('/registrations/children','POST',{values:validValues({schoolClass:value}),requestId:randomUUID()})).status,201);
   for(const values of [{schoolClass:'13'},{occupation:'Học sinh'},{introducedBy:ids.youth},{caregiver:ids.youth}])assert.equal((await call('/registrations/children','POST',{values:validValues(values),requestId:randomUUID()})).status,400);
   const role=(await call('/registration-schemas/youth','GET',undefined,dev)).body.schema.fields.find(f=>f.key==='position');
   assert.equal(role.label,'Vai trò');assert.equal(role.options.length,7);
   for(const position of role.options)assert.equal((await call('/members/'+ids.youth,'PATCH',{profileData:{position}},dev)).status,200);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{profileData:{position:'Không đúng'}},dev)).status,400);
  });
  await t.test('field migration removes only retired values and is repeatable',async()=>{
   await db.query('UPDATE members SET profile_data=profile_data || $2::jsonb WHERE id=$1',[ids.children,JSON.stringify({job:'Old school',hometown:'Đồng Nai',occupation:'Học sinh',introducedBy:ids.youth,schoolClass:'5'})]);
   await db.query("DELETE FROM app_meta WHERE key='profile_fields_20261105'");
   const sql=await readFile(new URL('../server/migrations/013_profile_fields.sql',import.meta.url),'utf8');
   await db.exec(sql);await db.exec(sql);
   const data=(await db.query('SELECT profile_data FROM members WHERE id=$1',[ids.children])).rows[0].profile_data;
   assert.equal('job' in data,false);assert.equal('hometown' in data,false);
   assert.equal(data.occupation,'Học sinh');assert.equal(data.introducedBy,ids.youth);assert.equal(data.schoolClass,'5');
   const schema=(await call('/registration-schemas/children','GET',undefined,dev)).body.schema;
   assert.equal(schema.fields.filter(f=>f.key==='caregiver').length,1);
   assert.equal(schema.fields.filter(f=>f.key==='schoolClass').length,1);
  });
  await t.test('merit tags store validated arrays, preserve prior activity separately and respect roles',async()=>{
   const {recognitionTags}=await import('../src/lib/recognition-tags.ts');const ids=recognitionTags.map(t=>t.id);
   for(const group of ['children','youth','congregation']){
    const schema=(await call('/registration-schemas/'+group,'GET',undefined,dev)).body.schema;
    const field=schema.fields.find(f=>f.key==='status');assert.equal(field.label,'Tình trạng');assert.equal(field.type,'tags');assert.deepEqual(field.options,ids);
    assert.ok(!(await call('/registration-schemas/'+group)).body.schema.fields.some(f=>f.key==='status'));
   }
   const youth=(await db.query("SELECT id FROM members WHERE \"group\"='youth' LIMIT 1")).rows[0].id;
   await db.query('UPDATE members SET profile_data=profile_data || $2::jsonb WHERE id=$1',[youth,JSON.stringify({status:'Hoạt động tích cực'})]);
   const preserved=await call('/members/'+youth,'PATCH',{profileData:{notes:'Đổi ghi chú'}},dev);
   assert.equal(preserved.status,200);assert.deepEqual(preserved.body.member.profileData.status,[]);assert.equal(preserved.body.member.profileData.legacyActivityStatus,'Hoạt động tích cực');
   for(const status of ['Tinh tấn',['fake'],[{}],null,42]){
    assert.equal((await call('/members/'+youth,'PATCH',{profileData:{status}},dev)).status,400);
   }
   assert.equal((await call('/members/'+youth,'PATCH',{profileData:{status:['tinh-tan']}},manager)).status,403);
   assert.equal((await call('/registrations/youth','POST',{values:validValues({status:['tinh-tan']}),requestId:randomUUID()})).status,400);
   const saved=await call('/members/'+youth,'PATCH',{profileData:{status:['hoa-dong','tinh-tan','tinh-tan']}},dev);
   assert.equal(saved.status,200);assert.deepEqual(saved.body.member.profileData.status,['tinh-tan','hoa-dong']);
   const kept=await call('/members/'+youth,'PATCH',{profileData:{notes:'Giữ thẻ'}},dev);assert.deepEqual(kept.body.member.profileData.status,['tinh-tan','hoa-dong']);
   const cleared=await call('/members/'+youth,'PATCH',{profileData:{status:[]}},dev);assert.equal(cleared.status,200);assert.deepEqual(cleared.body.member.profileData.status,[]);
   await db.query('UPDATE members SET profile_data=profile_data || $2::jsonb WHERE id=$1',[youth,JSON.stringify({status:'Nội dung cũ',notes:'Giữ nguyên'})]);
   await db.query("DELETE FROM app_meta WHERE key='recognition_tags_20261105'");
   const migration=await readFile(new URL('../server/migrations/014_recognition_tags.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
   const migrated=(await db.query('SELECT profile_data FROM members WHERE id=$1',[youth])).rows[0].profile_data;
   assert.deepEqual(migrated.status,[]);assert.equal(migrated.legacyActivityStatus,'Nội dung cũ');assert.equal(migrated.notes,'Giữ nguyên');

  });
  await t.test('linked member picker exposes minimal approved identities and portrait; links store ID, not name',async()=>{
   const data=validValues({name:'Đồng tên',dharmaName:'Thiện Tâm',introducedBy:ids.children});await call('/registrations/youth','POST',{values:data,requestId:randomUUID()},manager);await call('/registrations/congregation','POST',{values:validValues({name:'Đồng tên'}),requestId:randomUUID()},manager);
   const options=(await call('/member-options?q='+encodeURIComponent('Đồng tên'))).body.results;assert.equal(options.length,2);assert.ok(options.some(p=>p.dharmaName==='Thiện Tâm'));assert.ok(options.some(p=>p.dharmaName===''));assert.notEqual(options[0].id,options[1].id);assert.deepEqual(Object.keys(options[0]).sort(),['avatar','dharmaName','group','id','name']);
   const pending=await call('/registrations/youth','POST',{values:validValues({name:'Pending identity'}),requestId:randomUUID()});assert.equal(pending.status,201);assert.deepEqual((await call('/member-options?q=Pending')).body.results,[]);
   const pendingId=(await db.query('SELECT id FROM members WHERE name=$1',['Pending identity'])).rows[0].id;
   for(const introducedBy of ['Raw name',pendingId])assert.equal((await call('/registrations/youth','POST',{values:validValues({introducedBy}),requestId:randomUUID()})).status,400);
   const result=await call('/members/'+ids.youth,'PATCH',{profileData:{caregiver:ids.children,introducedBy:ids.congregation}},dev);assert.equal(result.status,200);assert.equal(result.body.member.profileData.caregiver,ids.children);assert.equal(result.body.member.references.caregiver.id,ids.children);
   assert.equal((await call('/members/'+ids.youth,'PATCH',{profileData:{caregiver:ids.youth}},dev)).status,400);
   assert.equal((await call('/member-portraits/'+pendingId)).status,404);assert.equal((await call('/member-portraits/'+ids.children)).status,404);
   assert.deepEqual((await call('/member-options?id='+ids.children)).body.results,[]);
   const childName=(await db.query('SELECT name FROM members WHERE id=$1',[ids.children])).rows[0].name;
   assert.ok(!(await call('/search?q='+encodeURIComponent(childName))).body.results.some(p=>p.group==='children'));
   assert.equal((await call('/member-options?id='+ids.children,'GET',undefined,manager)).body.results[0].id,ids.children);
   assert.equal((await call('/member-portraits/'+ids.children,'GET',undefined,manager)).status,200);
   const image=(await call('/member-portraits/'+ids.children,'GET',undefined,manager)).bytes,meta=await sharp(image).metadata();assert.equal(meta.width,360);assert.equal(meta.height,480);assert.equal(meta.format,'webp');
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

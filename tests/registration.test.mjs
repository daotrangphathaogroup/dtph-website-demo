import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';
import sharp from 'sharp';
function client(app){return async(path,method='GET',body,cookie)=>{const response=await handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:response.status,body:await response.json(),cookie:response.headers.getSetCookie()[0]?.split(';')[0]};};}
test('Separate registration schemas, anonymous submissions and managed group profiles',async t=>{
 const images=new Map();const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false,storage:{async put(key,bytes){images.set(key,bytes);},async get(key){return images.get(key);}}});const call=client(app);let dev,manager;
 try{
  dev=(await call('/admin/login','POST',{username:'dev',password:'1@345678'})).cookie;
  await call('/admin/accounts','POST',{username:'viewonly',password:'ViewOnly@123',role:'manager'},dev);
  manager=(await call('/admin/login','POST',{username:'viewonly',password:'ViewOnly@123'})).cookie;
  await t.test('public schema is group-specific and hides three child tracking fields',async()=>{
   const children=(await call('/registration-schemas/children')).body.schema;
   assert.equal(children.fields.length,11);assert.ok(!children.fields.some(f=>f.staffOnly));assert.ok(children.fields.some(f=>f.key==='parentPhone'));assert.ok(!children.fields.some(f=>f.key==='phone'));
   const staff=(await call('/registration-schemas/children','GET',undefined,dev)).body.schema;assert.equal(staff.fields.length,14);
   const youth=(await call('/registration-schemas/youth')).body.schema,congregation=(await call('/registration-schemas/congregation')).body.schema;
   assert.equal(youth.fields.length,10);assert.deepEqual(youth.fields,congregation.fields);assert.notEqual(youth.group,congregation.group);
  });
  await t.test('submit all three groups without account creation; repeat phone allowed; retries do not duplicate',async()=>{
   const accountCount=(await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n;
   for(const group of ['children','youth','congregation']){
    const values=group==='children'?{name:'Thiếu nhi thử',studentCode:'HS2026',dharmaName:'Tâm An',birthYear:2015,gender:'Nữ',schoolClass:'6A',studentPhone:'0901234567',parentName:'Phụ huynh thử',parentPhone:'0901234567',address:'Biên Hòa'}:{name:group+' thử',dharmaName:'Tâm An',birthYear:1990,gender:'Nam',phone:'0901234567',address:'Biên Hòa',team:2,clubSinceYear:2020,introducedBy:'Huynh đệ Minh Tâm'};
    const requestId=randomUUID();assert.equal((await call('/registrations/'+group,'POST',{values,requestId})).status,201);assert.equal((await call('/registrations/'+group,'POST',{values,requestId})).status,200);
    const rows=(await db.query('SELECT * FROM members WHERE name=$1',[values.name])).rows;assert.equal(rows.length,1);assert.equal(rows[0].profile_data.birthYear,values.birthYear);assert.equal(rows[0].group,group);
    assert.equal((await call('/registrations/'+group,'POST',{values:{...values,name:'Changed'},requestId})).status,409);
   }
   assert.equal((await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n,accountCount);assert.equal((await db.query('SELECT count(*)::int AS n FROM accounts')).rows[0].n,0);
   assert.deepEqual((await call('/bootstrap')).body.store.members,[]);
  });
  await t.test('server rejects cross-group/staff fields, invalid years, phones, dates and teams',async()=>{
   for(const [group,values]of [['children',{name:'Reject',attendance2026:1}],['children',{name:'Reject',remarks:'Forged'}],['children',{name:'Reject',studyDate:'2026-10-12'}],['youth',{name:'Reject',parentName:'Wrong group'}],['youth',{name:'Reject',birthYear:2099}],['youth',{name:'Reject',clubSinceYear:2020.5}],['youth',{name:'Reject',phone:'123'}],['youth',{name:'Reject',team:4}],['children',{name:'Reject',studentPhone:'wrong'}],['youth',{name:''}]])assert.equal((await call('/registrations/'+group,'POST',{values,requestId:randomUUID()})).status,400);
   assert.equal((await call('/registrations/not-a-group','POST',{values:{name:'Invalid'},requestId:randomUUID()})).status,400);
   assert.equal((await call('/registrations/youth','POST',{values:{name:'Invalid'},requestId:'bad'})).status,400);
  });
  await t.test('Dev and Admin update tracking fields; manager cannot; group fields stay isolated',async()=>{
   const child=(await db.query('SELECT * FROM members WHERE name=$1',['Thiếu nhi thử'])).rows[0];
   assert.equal((await call('/members/'+child.id,'PATCH',{profileData:{attendance2026:15,studyDate:'2026-10-12',remarks:'Chăm học'}},manager)).status,403);
   const result=await call('/members/'+child.id,'PATCH',{profileData:{attendance2026:15,studyDate:'2026-10-12',remarks:'Chăm học'}},dev);assert.equal(result.status,200);assert.equal(result.body.member.profileData.parentName,'Phụ huynh thử');assert.equal(result.body.member.profileData.attendance2026,15);
   assert.equal((await call('/members/'+child.id,'PATCH',{profileData:{studyDate:'2026-02-30'}},dev)).status,400);assert.equal((await call('/members/'+child.id,'PATCH',{profileData:{attendance2026:-1}},dev)).status,400);assert.equal((await call('/members/'+child.id,'PATCH',{profileData:{clubSinceYear:2020}},dev)).status,400);
   await call('/admin/accounts','POST',{username:'editor',password:'Editor@123',role:'admin'},dev);const admin=(await call('/admin/login','POST',{username:'editor',password:'Editor@123'})).cookie;
   assert.equal((await call('/members/'+child.id,'PATCH',{profileData:{remarks:'Admin cập nhật'}},admin)).status,200);
  });
  await t.test('required toggles are separate for youth/congregation and enforced on server',async()=>{
   assert.equal((await call('/registration-schemas/youth/fields/dharmaName','PATCH',{required:true},manager)).status,403);
   assert.equal((await call('/registration-schemas/youth/fields/dharmaName','PATCH',{required:true},dev)).status,200);
   assert.equal((await call('/registration-schemas/congregation')).body.schema.fields.find(f=>f.key==='dharmaName').required,false);
   assert.equal((await call('/registrations/youth','POST',{values:{name:'Missing dharma'},requestId:randomUUID()})).status,400);
   assert.equal((await call('/registrations/congregation','POST',{values:{name:'Separate form'},requestId:randomUUID()})).status,201);
   // A required staff-only field must not block public registration.
   await call('/registration-schemas/children/fields/attendance2026','PATCH',{required:true},dev);
   assert.equal((await call('/registrations/children','POST',{values:{name:'Still public'},requestId:randomUUID()})).status,201);
  });
  await t.test('avatar converts to WebP, remains private, and invalid images do not create profiles',async()=>{
   const png=await sharp({create:{width:600,height:600,channels:3,background:'#ab2933'}}).png().toBuffer();
   assert.equal((await call('/registrations/youth','POST',{requestId:randomUUID(),values:{name:'With avatar',dharmaName:'Tâm An',avatar:'data:image/png;base64,'+png.toString('base64')} })).status,201);
   const member=(await db.query('SELECT avatar FROM members WHERE name=$1',['With avatar'])).rows[0];assert.match(member.avatar,/\.webp$/);const key=member.avatar.split('/').at(-1),meta=await sharp(images.get(key)).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,480);
   assert.equal((await call(member.avatar.replace('/api',''))).status,401);
   assert.equal((await call('/registrations/congregation','POST',{requestId:randomUUID(),values:{name:'Bad image',avatar:'data:image/png;base64,bm90YW5pbWFnZQ=='}})).status,400);
   assert.equal((await db.query('SELECT id FROM members WHERE name=$1',['Bad image'])).rows.length,0);
  });
  await t.test('schema and values persist through migration rerun; fields can be added without SQL columns',async()=>{
   const before=(await db.query('SELECT profile_data FROM members WHERE name=$1',['Thiếu nhi thử'])).rows[0].profile_data;
   await createBackend({database:db,seedData:false,rateLimits:false});assert.deepEqual((await db.query('SELECT profile_data FROM members WHERE name=$1',['Thiếu nhi thử'])).rows[0].profile_data,before);
   assert.equal((await call('/registration-schemas/youth')).body.schema.fields.find(f=>f.key==='dharmaName').required,true);
   const extra={key:'additionalNote',label:'Ghi chú bổ sung',type:'text',required:false};await db.query('UPDATE registration_schemas SET fields=fields || $2::jsonb WHERE group_id=$1',['congregation',JSON.stringify([extra])]);
   assert.equal((await call('/registrations/congregation','POST',{values:{name:'Flexible data',additionalNote:'Thông tin mới'},requestId:randomUUID()})).status,201);
   assert.equal((await db.query('SELECT profile_data FROM members WHERE name=$1',['Flexible data'])).rows[0].profile_data.additionalNote,'Thông tin mới');
  });
 }finally{await db.close();}
});

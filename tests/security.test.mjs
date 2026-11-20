import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createBackend,passwordHash} from '../server/backend.mjs';
import {DEV_ACCOUNT} from '../server/dev-account.mjs';
import {handleRequest} from '../server/next-handler.mjs';

const origin='http://127.0.0.1:5173';
function client(app,{vercel=false,base=origin}={}){
 return async(path,method='GET',body,cookie,headers={})=>{
  const response=await handleRequest(app,new Request(base+'/api'+path,{method,headers:{Origin:base,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:body?JSON.stringify(body):undefined}),{vercel});
  return {status:response.status,body:await response.json(),cookie:response.headers.getSetCookie()[0]?.split(';')[0],headers:response.headers};
 };
}
async function manager(db,id,password='OldPassword@123'){
 await db.query('INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ($1,$1,$1,$2,\'manager\')',[id,await passwordHash(password)]);
}

test('Every directory and portrait path rejects anonymous and invalid sessions before looking up data',async()=>{
 const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false});
 try{
  const call=client(app);
  for(const path of ['/search','/search?q=Nguyen','/member-options','/member-options?id=PH00001','/member-portraits/PH00001','/avatars/00000000-0000-4000-8000-000000000000.webp']){
   for(const cookie of [undefined,'ph_staff_session=invalid']){
    const response=await call(path,'GET',undefined,cookie);
    assert.equal(response.status,401,path);assert.equal(response.body.results,undefined);assert.equal(response.headers.get('cache-control'),'no-store');
   }
  }
 }finally{await db.close();}
});

test('Production never seeds the source Dev credential and refuses reusing it',async()=>{
 const local=await createBackend({dataDir:'memory://',rateLimits:false});const db=local.db;
 try{
  await db.query('DELETE FROM staff_accounts');
  const {app}=await createBackend({database:db,production:true,initialize:false,secret:'s'.repeat(64),origin:'https://example.com',storage:{},rateLimits:false});
  assert.equal((await db.query('SELECT count(*)::int AS n FROM staff_accounts')).rows[0].n,0);
  await db.query('INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ($1,$2,\'Dev\',$3,\'dev\')',[DEV_ACCOUNT.id,DEV_ACCOUNT.username,await passwordHash(DEV_ACCOUNT.password)]);
  const call=client(app,{base:'https://example.com'});
  assert.notEqual((await call('/admin/login','POST',{username:DEV_ACCOUNT.username,password:DEV_ACCOUNT.password})).status,200);
  const rotated=await passwordHash('ProductionRotated@123');await db.query('UPDATE staff_accounts SET password_hash=$1',[rotated]);
  const login=await call('/admin/login','POST',{username:DEV_ACCOUNT.username,password:'ProductionRotated@123'});assert.equal(login.status,200);
  await createBackend({database:db,production:true,initialize:false,secret:'s'.repeat(64),origin:'https://example.com',storage:{},rateLimits:false});
  assert.equal((await db.query('SELECT password_hash FROM staff_accounts')).rows[0].password_hash,rotated);
  assert.equal((await call('/admin/password','PATCH',{currentPassword:'ProductionRotated@123',password:DEV_ACCOUNT.password},login.cookie)).status,400);
 }finally{await db.close();}
});

for(const mode of ['reset','change'])test(`An old-password login cannot outlive a completed password ${mode}`,{timeout:15000},async()=>{
 const {db}=await createBackend({dataDir:'memory://',rateLimits:false});
 let armed=false,pausedInTransaction=false,release,arrived;
 const gate=new Promise(resolve=>{release=resolve;}),reached=new Promise(resolve=>{arrived=resolve;});
 const capture=async(query,sql,params,inTransaction)=>{
  const result=await query(sql,params);
  if(armed&&sql.startsWith('SELECT * FROM staff_accounts WHERE username=')&&params[0]==='target'){
   armed=false;pausedInTransaction=inTransaction;arrived();await gate;
  }
  return result;
 };
 const database={
  query(sql,params){
   // Let an already locked login finish when recovery reaches its first session read.
   if(pausedInTransaction&&sql.startsWith('SELECT a.id,a.username'))release();
   return capture(db.query.bind(db),sql,params,false);
  },
  transaction(fn){return db.transaction(tx=>fn({query:(sql,params)=>capture(tx.query.bind(tx),sql,params,true)}));},
 };
 try{
  await manager(db,'target');
  const {app}=await createBackend({database,initialize:false,rateLimits:false}),call=client(app);
  const dev=(await call('/admin/login','POST',{username:DEV_ACCOUNT.username,password:DEV_ACCOUNT.password})).cookie;
  const target=(await call('/admin/login','POST',{username:'target',password:'OldPassword@123'})).cookie;
  armed=true;const oldLogin=call('/admin/login','POST',{username:'target',password:'OldPassword@123'});await reached;
  const recovery=mode==='reset'
   ?call('/admin/accounts/target/password','PATCH',{password:'NewPassword@123'},dev)
   :call('/admin/password','PATCH',{currentPassword:'OldPassword@123',password:'NewPassword@123'},target);
  recovery.finally(release);const [login,result]=await Promise.all([oldLogin,recovery]);assert.equal(result.status,200);
  if(login.status===200)assert.equal((await call('/bootstrap','GET',undefined,login.cookie)).body.session,null);
  else assert.equal(login.status,401);
  assert.equal((await call('/bootstrap','GET',undefined,target)).body.session,null);
  assert.equal((await call('/admin/login','POST',{username:'target',password:'OldPassword@123'})).status,401);
  assert.equal((await call('/admin/login','POST',{username:'target',password:'NewPassword@123'})).status,200);
 }finally{release();await db.close();}
});

test('Staff quotas are per account; forwarded identity is trusted only inside Vercel',async()=>{
 const secret='test-only-secret-'.repeat(4),now=()=>1800000000000;const {app,db}=await createBackend({dataDir:'memory://',secret,now});
 const seed=async(scope,hits)=>db.query('INSERT INTO rate_limits(scope_key,window_id,hits) VALUES ($1,$2,$3) ON CONFLICT(scope_key) DO UPDATE SET hits=EXCLUDED.hits',[createHmac('sha256',secret).update(scope).digest('hex'),Math.floor(now()/60000),hits]);
 try{
  await manager(db,'first');await manager(db,'second');const call=client(app);
  const first=(await call('/admin/login','POST',{username:'first',password:'OldPassword@123'})).cookie,second=(await call('/admin/login','POST',{username:'second',password:'OldPassword@123'})).cookie;
  await seed('member-options:first',90);
  assert.equal((await call('/member-options?q=Test','GET',undefined,first)).status,429);
  assert.equal((await call('/member-options?q=Test','GET',undefined,second)).status,200);
  await seed('registration:127.0.0.1',5);
  for(const ip of ['198.51.100.1','198.51.100.2'])assert.equal((await call('/registrations/auto','POST',{},undefined,{'x-vercel-forwarded-for':ip})).status,429);
  const cloud=client(app,{vercel:true});await seed('registration:198.51.100.1',5);
  assert.equal((await cloud('/registrations/auto','POST',{},undefined,{'x-vercel-forwarded-for':'198.51.100.1'})).status,429);
  assert.equal((await cloud('/registrations/auto','POST',{},undefined,{'x-vercel-forwarded-for':'198.51.100.2'})).status,400);
  assert.equal((await cloud('/registrations/auto','POST',{},undefined,{'x-vercel-forwarded-for':'arbitrary-label'})).status,429);
  await seed('staff-login-ip:127.0.0.1',20);
  for(const path of ['/admin/login','/ADMIN/LOGIN/'])assert.equal((await call(path,'POST',{username:'nonexistent',password:'WrongPassword@123'})).status,429);
 }finally{await db.close();}
});

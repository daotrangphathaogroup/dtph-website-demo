import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createBackend} from '../server/backend.mjs';
import {createGoogleAuth} from '../server/google-auth.mjs';
import {handleRequest} from '../server/next-handler.mjs';
const origin='http://127.0.0.1:5173';
test('Google OAuth state, PKCE, first-link proof, stable subject and replay protection',async()=>{
 let clock=Date.now(),exchanges=0,identity={subject:'google-admin',email:'minhtam@gmail.com'};
 const google={clientId:'test-client',async exchange({code,verifier,nonce,redirectUri}){exchanges++;assert.equal(code,'valid');assert.ok(verifier);assert.ok(nonce);assert.equal(redirectUri,origin+'/api/auth/google/callback');return identity;}};
 const {app,db}=await createBackend({authDefaults:{smsOtp:true,googleLogin:true},dataDir:'memory://',rateLimits:false,google,now:()=>clock});
 async function call(path,method='GET',body,cookie,requestOrigin=origin){const res=await handleRequest(app,new Request(origin+'/api'+path,{method,headers:{...(method==='POST'?{'Content-Type':'application/json',Origin:requestOrigin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined}));return {status:res.status,location:res.headers.get('location'),cookies:res.headers.getSetCookie(),body:res.headers.get('content-type')?.includes('application/json')?await res.json():null};}
 const cookie=(response,name)=>response.cookies.find(x=>x.startsWith(name+'=')&&!x.startsWith(name+'=;'))?.split(';')[0];
 async function flow(){const start=await call('/auth/google/start');assert.equal(start.status,303);const url=new URL(start.location);assert.equal(url.searchParams.get('scope'),'openid email');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(url.searchParams.get('redirect_uri'),origin+'/api/auth/google/callback');const state=url.searchParams.get('state');const stored=(await db.query('SELECT * FROM google_oauth_flows WHERE token_hash=$1',[createHash('sha256').update(state).digest('hex')])).rows[0];assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(stored.verifier).digest('base64url'));return {state,cookie:cookie(start,'ph_google_state')};}
 try{
  await db.query('UPDATE members SET email=$1 WHERE id=$2',['minhtam@gmail.com','PH00001']);
  assert.equal((await call('/bootstrap')).body.googleEnabled,true);
  assert.equal((await call('/auth/google/pending')).status,400);
  const first=await flow();assert.equal((await call('/auth/google/callback?code=valid&state=wrong','GET',undefined,first.cookie)).location,'/?google=failed');assert.equal(exchanges,0);
  assert.equal((await call('/auth/google/callback?code=valid&state='+first.state)).location,'/?google=failed');
  const callback=await call('/auth/google/callback?code=valid&state='+first.state,'GET',undefined,first.cookie);assert.equal(callback.location,'/?google=link');assert.equal(cookie(callback,'ph_session'),undefined);const pending=cookie(callback,'ph_google_link');
  assert.equal((await call('/auth/google/pending','GET',undefined,pending)).body.email,identity.email);
  assert.equal((await call('/auth/google/callback?code=valid&state='+first.state,'GET',undefined,first.cookie)).location,'/?google=failed');assert.equal(exchanges,1);
  assert.equal((await call('/auth/google/link','POST',{password:'PhatHao@123'},pending,'https://attacker.test')).status,403);
  assert.equal((await call('/auth/google/link','POST',{password:'Incorrect@123'},pending)).status,401);
  assert.equal((await db.query('SELECT attempts FROM google_oauth_flows WHERE subject=$1',[identity.subject])).rows[0].attempts,1);
  const linked=await call('/auth/google/link','POST',{password:'PhatHao@123'},pending);assert.equal(linked.status,200);const loggedIn=(await call('/bootstrap','GET',undefined,cookie(linked,'ph_session'))).body;assert.equal(loggedIn.session.id,'PH00001');assert.equal(loggedIn.session.role,'admin');
  assert.equal((await call('/auth/google/link','POST',{password:'PhatHao@123'},pending)).status,400);
  await db.query('UPDATE members SET email=$1 WHERE id=$2',['changed@example.com','PH00001']);
  const second=await flow();const login=await call('/auth/google/callback?code=valid&state='+second.state,'GET',undefined,second.cookie);assert.equal(login.location,'/');assert.ok(cookie(login,'ph_session'));assert.equal((await call('/bootstrap','GET',undefined,cookie(login,'ph_session'))).body.session.id,'PH00001');
  identity={subject:'unknown-subject',email:'new@gmail.com'};const before=(await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n;const unknown=await flow();const unlinked=await call('/auth/google/callback?code=valid&state='+unknown.state,'GET',undefined,unknown.cookie);const unknownCookie=cookie(unlinked,'ph_google_link');assert.equal((await call('/auth/google/link','POST',{password:'PhatHao@123'},unknownCookie)).status,401);assert.equal((await db.query('SELECT count(*)::int AS n FROM members')).rows[0].n,before);
  for(let i=0;i<4;i++)await call('/auth/google/link','POST',{password:'PhatHao@123'},unknownCookie);assert.equal((await call('/auth/google/link','POST',{password:'PhatHao@123'},unknownCookie)).status,429);
  const cancelled=await flow();assert.equal((await call('/auth/google/callback?error=access_denied&state='+cancelled.state,'GET',undefined,cancelled.cookie)).location,'/?google=cancelled');
  const expired=await flow();clock+=600001;assert.equal((await call('/auth/google/callback?code=valid&state='+expired.state,'GET',undefined,expired.cookie)).location,'/?google=failed');
  await db.exec(await readFile(new URL('../server/migrations/003_google_auth.sql',import.meta.url),'utf8'));assert.equal((await db.query('SELECT google_subject FROM accounts WHERE member_id=$1',['PH00001'])).rows[0].google_subject,'google-admin');
  await assert.rejects(db.query('UPDATE accounts SET google_subject=$1 WHERE member_id=$2',['google-admin','PH00002']),e=>e.code==='23505');
 }finally{await db.close();}
});
test('Google is optional and partial configuration fails explicitly',async()=>{
 assert.equal(createGoogleAuth({}),null);assert.throws(()=>createGoogleAuth({GOOGLE_CLIENT_ID:'test'}),/GOOGLE_CLIENT_SECRET/);
 const {app,db}=await createBackend({authDefaults:{smsOtp:true,googleLogin:true},dataDir:'memory://',rateLimits:false,google:null});try{const res=await handleRequest(app,new Request(origin+'/api/auth/google/start'));assert.equal(res.headers.get('location'),'/?google=unavailable');}finally{await db.close();}
});
test('Google token exchange requires verified email and matching nonce after SDK validation',async()=>{
 let payload={sub:'google-sub',email:'MEMBER@gmail.com',email_verified:true,nonce:'correct-nonce'};
 const env={GOOGLE_CLIENT_ID:'client-id',GOOGLE_CLIENT_SECRET:'server-secret'};
 const provider=createGoogleAuth(env,{async fetchImpl(url,options){assert.equal(url,'https://oauth2.googleapis.com/token');assert.equal(options.body.get('code_verifier'),'pkce-verifier');assert.equal(options.body.get('client_secret'),'server-secret');return Response.json({id_token:'signed-token'});},client:{async verifyIdToken(options){assert.deepEqual(options,{idToken:'signed-token',audience:'client-id'});return {getPayload:()=>payload};}}});
 const request={code:'auth-code',verifier:'pkce-verifier',nonce:'correct-nonce',redirectUri:origin+'/api/auth/google/callback'};
 assert.deepEqual(await provider.exchange(request),{subject:'google-sub',email:'member@gmail.com'});
 payload={...payload,email_verified:false};await assert.rejects(provider.exchange(request),/Invalid Google identity/);
 payload={...payload,email_verified:true,nonce:'wrong-nonce'};await assert.rejects(provider.exchange(request),/Invalid Google identity/);
 const invalid=createGoogleAuth(env,{fetchImpl:async()=>Response.json({id_token:'tampered'}),client:{async verifyIdToken(){throw new Error('Invalid JWT signature');}}});await assert.rejects(invalid.exchange(request),/Invalid JWT signature/);
});

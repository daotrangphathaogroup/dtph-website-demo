import {OAuth2Client} from 'google-auth-library';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
const random=()=>randomBytes(32).toString('base64url');
const reject=(status,message)=>{throw Object.assign(new Error(message),{status});};
export function createGoogleAuth(env=process.env,{fetchImpl=fetch,client:providedClient}={}){
 const clientId=env.GOOGLE_CLIENT_ID,clientSecret=env.GOOGLE_CLIENT_SECRET;
 if(!clientId&&!clientSecret)return null;
 if(!clientId||!clientSecret)throw new Error('Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
 const client=providedClient??new OAuth2Client(clientId);
 return {clientId,async exchange({code,verifier,nonce,redirectUri}){
  const response=await fetchImpl('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,code,code_verifier:verifier,redirect_uri:redirectUri,grant_type:'authorization_code'}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Google token exchange failed.');
  const {id_token}=await response.json();
  const ticket=await client.verifyIdToken({idToken:id_token,audience:clientId});const payload=ticket.getPayload();
  if(!payload?.sub||payload.email_verified!==true||!payload.email||payload.nonce!==nonce)throw new Error('Invalid Google identity.');
  return {subject:payload.sub,email:payload.email.trim().toLowerCase()};
 }};
}
export function installGoogleRoutes({route,db,google,origin,production,now,issueSession,passwordMatches,checkPassword}){
 const cookieOptions={httpOnly:true,secure:production,sameSite:'lax',path:'/api/auth/google',maxAge:600000};
 const cookie=(req,name)=>(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
 const clear=(res,name)=>res.clearCookie(name,{path:cookieOptions.path,httpOnly:true,secure:production,sameSite:'lax'});
 const configured=()=>{if(!google)reject(503,'Đăng nhập Google chưa được cấu hình.');};
 const callbackUri=origin+'/api/auth/google/callback';
 route('get','/api/auth/google/start',async(req,res)=>{
  if(!google)return res.redirect(303,'/?google=unavailable');
  const state=random(),verifier=random(),nonce=random();
  await db.transaction(async tx=>{await tx.query('DELETE FROM google_oauth_flows WHERE expires_at <= $1',[now()]);await tx.query('INSERT INTO google_oauth_flows (token_hash,verifier,nonce,expires_at) VALUES ($1,$2,$3,$4)',[digest(state),verifier,nonce,now()+600000]);});
  clear(res,'ph_google_link');res.cookie('ph_google_state',state,cookieOptions);
  const query=new URLSearchParams({client_id:google.clientId,redirect_uri:callbackUri,response_type:'code',scope:'openid email',state,nonce,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',prompt:'select_account'});
  res.redirect(303,'https://accounts.google.com/o/oauth2/v2/auth?'+query);
 });
 route('get','/api/auth/google/callback',async(req,res)=>{
  clear(res,'ph_google_state');clear(res,'ph_google_link');
  try{
   configured();const state=req.query.state,expected=cookie(req,'ph_google_state');
   if(typeof state!=='string'||!expected||state.length!==expected.length||!timingSafeEqual(Buffer.from(state),Buffer.from(expected)))throw new Error('State mismatch.');
   const flow=(await db.query('DELETE FROM google_oauth_flows WHERE token_hash=$1 AND subject IS NULL RETURNING *',[digest(state)])).rows[0];
   if(!flow||Number(flow.expires_at)<=now())throw new Error('Expired OAuth flow.');
   if(req.query.error)return res.redirect(303,'/?google=cancelled');
   if(typeof req.query.code!=='string')throw new Error('Missing code.');
   const identity=await google.exchange({code:req.query.code,verifier:flow.verifier,nonce:flow.nonce,redirectUri:callbackUri});
   if(!identity.subject||!identity.email)throw new Error('Invalid identity.');
   const linked=(await db.query('SELECT member_id,verified FROM accounts WHERE google_subject=$1',[identity.subject])).rows[0];
   if(linked){if(!linked.verified)return res.redirect(303,'/?google=inactive');await issueSession(res,linked.member_id);return res.redirect(303,'/');}
   const pending=random();await db.query('INSERT INTO google_oauth_flows (token_hash,verifier,nonce,subject,email,expires_at) VALUES ($1,$2,$3,$4,$5,$6)',[digest(pending),'','',identity.subject,identity.email,now()+600000]);
   res.cookie('ph_google_link',pending,cookieOptions);res.redirect(303,'/?google=link');
  }catch{res.redirect(303,'/?google=failed');}
 });
 route('get','/api/auth/google/pending',async(req,res)=>{
  configured();const flow=(await db.query('SELECT email FROM google_oauth_flows WHERE token_hash=$1 AND subject IS NOT NULL AND expires_at>$2',[digest(cookie(req,'ph_google_link')??''),now()])).rows[0];
  if(!flow)reject(400,'Phiên liên kết Google đã hết hạn. Vui lòng thử lại.');res.json({email:flow.email});
 });
 route('post','/api/auth/google/link',async(req,res)=>{
  configured();if(req.headers.origin!==origin)reject(403,'Nguồn yêu cầu không hợp lệ.');checkPassword(req.body.password);
  const id=await db.transaction(async tx=>{
   const flow=(await tx.query('SELECT * FROM google_oauth_flows WHERE token_hash=$1 AND subject IS NOT NULL AND expires_at>$2 FOR UPDATE',[digest(cookie(req,'ph_google_link')??''),now()])).rows[0];
   if(!flow)reject(400,'Phiên liên kết Google đã hết hạn. Vui lòng thử lại.');
   if(flow.attempts>=5)reject(429,'Vượt số lần thử. Vui lòng đăng nhập Google lại.');
   const account=(await tx.query('SELECT a.* FROM accounts a JOIN members m ON m.id=a.member_id WHERE lower(btrim(m.email))=$1 FOR UPDATE OF a',[flow.email])).rows[0];
   if(!account||!account.verified||!await passwordMatches(req.body.password,account.password_hash)){
    await tx.query('UPDATE google_oauth_flows SET attempts=attempts+1 WHERE token_hash=$1',[flow.token_hash]);return null;
   }
   if(account.google_subject&&account.google_subject!==flow.subject)reject(409,'Hồ sơ đã liên kết với tài khoản Google khác.');
   await tx.query('UPDATE accounts SET google_subject=$1 WHERE member_id=$2',[flow.subject,account.member_id]);
   await tx.query('DELETE FROM google_oauth_flows WHERE token_hash=$1',[flow.token_hash]);
   await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ($1,'google_link',$1)",[account.member_id]);return account.member_id;
  });
  if(!id)reject(401,'Chưa thể liên kết. Kiểm tra mật khẩu và email trong hồ sơ; tài khoản cần hoàn tất đăng ký trước.');
  clear(res,'ph_google_link');await issueSession(res,id);res.json({ok:true});
 });
}

import express from 'express';
import {DEV_ACCOUNT} from './dev-account.mjs';
import {getTeam} from '../src/lib/areas.ts';
import {randomBytes,randomUUID,createHash,createHmac,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {seed} from './seed.mjs';
const scrypt=promisify(scryptCallback),hash=value=>createHash('sha256').update(value).digest('hex'),token=()=>randomBytes(32).toString('hex');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
export async function passwordHash(password){const salt=token();return `${salt}:${(await scrypt(password,salt,64)).toString('hex')}`;}
async function passwordMatches(password,encoded){const [salt,key]=encoded.split(':');const value=await scrypt(password,salt,64);return value.length===Buffer.from(key,'hex').length&&timingSafeEqual(value,Buffer.from(key,'hex'));}
const fields=['name','birthday','phone','email','address','area','group','referrer','joined','avatar'];
const configurable=['name','birthday','phone','email','address','group','joined','avatar'];
function profile(row){return {...Object.fromEntries(['id',...fields].map(k=>[k,row[k] instanceof Date?row[k].toISOString().slice(0,10):row[k]??''])),team:getTeam(row.area??'')};}
export async function createBackend({dataDir='./.local/postgres',uploadDir='./.local/avatars',seedData=true,now=()=>Date.now(),rateLimits=true,database,production=false,initialize=true,secret:configuredSecret,origin,storage}={}){
 if(process.env.NODE_ENV==='production'&&!production)throw new Error('Use createProductionBackend for production.');
 if(production&&(!database||initialize||seedData||!configuredSecret||!origin||!storage))throw new Error('Production requires external database/storage, stable secret, no local seeding.');
 let db=database;
 if(!db){const {PGlite}=await import('@electric-sql/pglite');if(dataDir!=='memory://')await mkdir(path.dirname(path.resolve(/* turbopackIgnore: true */ dataDir)),{recursive:true});db=new PGlite(dataDir);await db.waitReady;}
 if(initialize){
  // Explicit static paths prevent Turbopack folding every dynamic URL to the first file.
  await db.exec(await readFile(new URL('./migrations/001_initial.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('./migrations/002_member_email.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('./migrations/004_staff_portal.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('./migrations/005_staff_roles.sql',import.meta.url),'utf8'));
 }
 let secret=configuredSecret;
 if(!secret){const existing=await db.query("SELECT value FROM app_meta WHERE key='staff_session_secret'");secret=existing.rows[0]?.value??token();if(!existing.rows.length)await db.query("INSERT INTO app_meta VALUES ('staff_session_secret',$1)",[secret]);}
 if(seedData&&!(await db.query('SELECT id FROM members LIMIT 1')).rows.length){
  await db.transaction(async tx=>{
   for(const m of seed.members)await tx.query('INSERT INTO members (id,name,birthday,phone,address,area,"group",referrer,joined,avatar) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[m.id,m.name,m.birthday,m.phone,m.address,m.area,m.group,m.referrer||null,m.joined,m.avatar]);
   await tx.query("INSERT INTO classes VALUES ('tldd-01','Tâm Lý Đạo Đức','children')");
   for(const e of seed.enrollments)await tx.query('INSERT INTO enrollments VALUES ($1,$2,$3)',[e.memberId,e.classId,e.date]);
   for(const [field,required]of Object.entries(seed.requirements))if(configurable.includes(field))await tx.query('INSERT INTO registration_fields VALUES ($1,$2) ON CONFLICT DO NOTHING',[field,required]);
  });
 }
 // Seed exactly one developer account without resetting an existing password.
 await db.query("INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ($1,$2,'Nhà phát triển',$3,'dev') ON CONFLICT DO NOTHING",[DEV_ACCOUNT.id,DEV_ACCOUNT.username,await passwordHash(DEV_ACCOUNT.password)]);
 const app=express();app.disable('x-powered-by');app.use(express.json({limit:'2mb'}));
 async function limit(scope,maximum,windowMs){const key=createHmac('sha256',secret).update(scope).digest('hex'),window=Math.floor(now()/windowMs);const result=await db.query('INSERT INTO rate_limits (scope_key,window_id,hits) VALUES ($1,$2,1) ON CONFLICT (scope_key) DO UPDATE SET hits=CASE WHEN rate_limits.window_id=EXCLUDED.window_id THEN rate_limits.hits+1 ELSE 1 END,window_id=EXCLUDED.window_id RETURNING hits',[key,window]);if(result.rows[0].hits>maximum)fail(429,'Quá nhiều yêu cầu. Vui lòng thử lại sau.');}
 app.use('/api',async(req,res,next)=>{try{
  res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)&&(!req.headers.origin||!(production?req.headers.origin===origin:/^http:\/\/(127\.0\.0\.1|localhost):(5173|4173|3001)$/.test(req.headers.origin))))fail(403,'Nguồn yêu cầu không hợp lệ.');
  if(rateLimits&&req.path==='/admin/login')await limit('staff-login-ip:'+String(req.headers['x-vercel-forwarded-for']??req.ip),20,60000);
  next();
 }catch(e){next(e);}});
 const route=(method,url,fn)=>app[method](url,async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}});
 async function session(req,required=true,executor=db){const raw=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('ph_staff_session='))?.slice(17);if(!raw){if(required)fail(401,'Vui lòng đăng nhập quản trị.');return null;}
  const row=(await executor.query('SELECT a.id,a.username,a.display_name AS "displayName",a.role,s.token_hash FROM staff_sessions s JOIN staff_accounts a ON a.id=s.staff_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND a.active=true',[hash(raw),now()])).rows[0];if(!row&&required)fail(401,'Phiên quản trị đã hết hạn.');return row??null;
 }
 async function issueSession(res,id){const raw=token();await db.query('INSERT INTO staff_sessions VALUES ($1,$2,$3)',[hash(raw),id,now()+8*3600000]);res.cookie('ph_staff_session',raw,{httpOnly:true,secure:production,sameSite:'strict',maxAge:8*3600000,path:'/api'});}
 const requireDev=s=>{if(s.role!=='dev')fail(403,'Chỉ Dev có quyền thực hiện.');};
 const requireAdmin=s=>{if(!['admin','dev'].includes(s.role))fail(403,'Chỉ quản lý tổng có quyền thực hiện.');};
 async function managed(s,classId,executor=db){return ['admin','dev'].includes(s.role)||(await executor.query('SELECT 1 FROM staff_class_managers WHERE staff_id=$1 AND class_id=$2',[s.id,classId])).rows.length>0;}
 function checkPassword(value){if(typeof value!=='string'||value.length<8||value.length>128)fail(400,'Mật khẩu quản trị cần từ 8 đến 128 ký tự.');}
 route('get','/api/health',async(_,res)=>{await db.query('SELECT id FROM staff_accounts LIMIT 1');res.json({ok:true,database:production?'Supabase PostgreSQL':'PostgreSQL / PGlite',mode:'staff-portal'});});
 route('get','/api/bootstrap',async(req,res)=>res.json(await db.transaction(async tx=>{
  const s=await session(req,false,tx);if(!s)return {session:null,managedClassIds:[],classes:[],store:{members:[],enrollments:[],requirements:{}}};
  const requirements=Object.fromEntries((await tx.query('SELECT * FROM registration_fields')).rows.filter(r=>configurable.includes(r.field)).map(r=>[r.field,r.required]));
  const classes=(await tx.query('SELECT * FROM classes')).rows;
  const members=(await tx.query('SELECT * FROM members')).rows.map(profile);
  const enrollments=(await tx.query('SELECT member_id AS "memberId",class_id AS "classId",date FROM enrollments')).rows.map(e=>({...e,date:e.date instanceof Date?e.date.toISOString().slice(0,10):e.date}));
  return {session:{id:s.id,username:s.username,displayName:s.displayName,role:s.role},managedClassIds:classes.map(c=>c.id),classes,store:{members,enrollments,requirements}};
 })));
 const dummyHash=await passwordHash(token());
 route('post','/api/admin/login',async(req,res)=>{const {username,password}=req.body;checkPassword(password);if(typeof username!=='string'||!/^[a-z0-9][a-z0-9._-]{0,39}$/i.test(username.trim()))fail(401,'Tên đăng nhập hoặc mật khẩu không đúng.');const identity=username.trim().toLowerCase();if(rateLimits)await limit('staff-login-name:'+identity,10,900000);
  const a=(await db.query('SELECT * FROM staff_accounts WHERE username=$1 AND active=true',[identity])).rows[0];const matches=await passwordMatches(password,a?.password_hash??dummyHash);if(!a||!matches)fail(401,'Tên đăng nhập hoặc mật khẩu không đúng.');await issueSession(res,a.id);res.json({ok:true});
 });
 route('post','/api/admin/logout',async(req,res)=>{const s=await session(req,false);if(s)await db.query('DELETE FROM staff_sessions WHERE token_hash=$1',[s.token_hash]);res.clearCookie('ph_staff_session',{path:'/api'});res.json({ok:true});});
 route('get','/api/admin/accounts',async(req,res)=>{requireDev(await session(req));res.json({accounts:(await db.query("SELECT id,username,role FROM staff_accounts WHERE role<>'dev' ORDER BY created_at,id")).rows});});
 route('post','/api/admin/accounts',async(req,res)=>{const actor=await session(req);requireDev(actor);const {username,password,role}=req.body;checkPassword(password);if(typeof username!=='string'||!/^[a-z0-9]{1,40}$/i.test(username)||!['admin','manager'].includes(role))fail(400,'ID chỉ gồm chữ cái và chữ số, tối đa 40 ký tự.');
  const id=randomUUID(),encoded=await passwordHash(password);await db.transaction(async tx=>{await tx.query('INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ($1,$2,$2,$3,$4)',[id,username.toLowerCase(),encoded,role]);await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ($1,'staff_create',$2)",[actor.id,id]);});res.status(201).json({ok:true});});
 route('patch','/api/admin/accounts/:id/password',async(req,res)=>{const actor=await session(req);requireDev(actor);checkPassword(req.body.password);await db.transaction(async tx=>{const result=await tx.query("UPDATE staff_accounts SET password_hash=$2 WHERE id=$1 AND role IN ('admin','manager') RETURNING id",[req.params.id,await passwordHash(req.body.password)]);if(!result.rows.length)fail(404,'Không tìm thấy tài khoản.');await tx.query('DELETE FROM staff_sessions WHERE staff_id=$1',[req.params.id]);await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ($1,'staff_password_reset',$2)",[actor.id,req.params.id]);});res.json({ok:true});});
 route('delete','/api/admin/accounts/:id',async(req,res)=>{const actor=await session(req);requireDev(actor);await db.transaction(async tx=>{const account=(await tx.query("SELECT id FROM staff_accounts WHERE id=$1 AND role IN ('admin','manager') FOR UPDATE",[req.params.id])).rows[0];if(!account)fail(404,'Không tìm thấy tài khoản.');await tx.query('DELETE FROM staff_sessions WHERE staff_id=$1',[account.id]);await tx.query('DELETE FROM staff_class_managers WHERE staff_id=$1',[account.id]);await tx.query('DELETE FROM staff_accounts WHERE id=$1',[account.id]);await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ($1,'staff_delete',$2)",[actor.id,account.id]);});res.json({ok:true});});
 route('patch','/api/admin/password',async(req,res)=>{const actor=await session(req);checkPassword(req.body.password);if(typeof req.body.currentPassword!=='string')fail(400,'Vui lòng nhập mật khẩu hiện tại.');const encoded=await passwordHash(req.body.password);await db.transaction(async tx=>{const account=(await tx.query('SELECT password_hash FROM staff_accounts WHERE id=$1 FOR UPDATE',[actor.id])).rows[0];if(!await passwordMatches(req.body.currentPassword,account.password_hash))fail(403,'Mật khẩu hiện tại không đúng.');await tx.query('UPDATE staff_accounts SET password_hash=$2 WHERE id=$1',[actor.id,encoded]);await tx.query('DELETE FROM staff_sessions WHERE staff_id=$1',[actor.id]);await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ($1,'staff_password_change',$1)",[actor.id]);});res.clearCookie('ph_staff_session',{path:'/api'});res.json({ok:true});});
 route('get','/api/search',async(req,res)=>{const q=typeof req.query.q==='string'?req.query.q.trim():'';if(q.length<2||q.length>100)return res.json({results:[]});if(rateLimits)await limit('public-search:'+req.ip,30,60000);const pattern='%'+q.replace(/[\\%_]/g,'\\$&')+'%';const results=(await db.query('SELECT name,"group" FROM members WHERE name ILIKE $1 ORDER BY name LIMIT 20',[pattern])).rows;res.json({results});});
 async function validate(data,old){const requirements=Object.fromEntries((await db.query('SELECT * FROM registration_fields')).rows.map(r=>[r.field,r.required]));if(!data||typeof data!=='object')fail(400,'Thông tin hồ sơ không hợp lệ.');const result={};for(const field of fields){const value=data[field]??old[field]??'';if(typeof value!=='string'||value.length>(field==='avatar'?1500000:500))fail(400,'Thông tin hồ sơ không hợp lệ.');result[field]=value.trim();if(configurable.includes(field)&&requirements[field]&&!result[field])fail(400,'Vui lòng cung cấp '+field+'.');}
  if(getTeam(result.area)===null&&result.area!==old.area)fail(400,'Vui lòng chọn phường trong danh sách khu vực.');result.email=result.email.toLowerCase();if(result.email&&(result.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)))fail(400,'Email không hợp lệ.');if(result.phone&&!/^0[35789]\d{8}$/.test(result.phone))fail(400,'SĐT Việt Nam cần 10 chữ số.');if(!['children','youth','congregation'].includes(result.group))fail(400,'Nhóm sinh hoạt không hợp lệ.');for(const field of ['birthday','joined'])if(result[field]&&(!/^\d{4}-\d{2}-\d{2}$/.test(result[field])||Number.isNaN(Date.parse(result[field]))||new Date(result[field]).toISOString().slice(0,10)!==result[field]))fail(400,'Ngày tháng không hợp lệ.');if(result.birthday>new Date(now()).toISOString().slice(0,10))fail(400,'Ngày sinh không thể ở tương lai.');return result;
 }
 async function avatar(value,old){if(!value||value===old)return value;if(!/^data:image\/(webp|png|jpeg);base64,/.test(value))fail(400,'Ảnh đại diện không hợp lệ.');let buffer;try{buffer=await sharp(Buffer.from(value.split(',')[1],'base64'),{limitInputPixels:20000000}).rotate().resize(480,480,{fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();}catch{fail(400,'Không đọc được ảnh đại diện.');}const key=randomUUID()+'.webp';if(storage)await storage.put(key,buffer);else{await mkdir(uploadDir,{recursive:true});await writeFile(path.join(uploadDir,key),buffer);}return '/api/avatars/'+key;}
 async function updateMember(req,res,classId=null){const s=await session(req);requireAdmin(s);if(classId){if(!await managed(s,classId))fail(403,'Không có quyền quản lý lớp này.');if(!(await db.query('SELECT 1 FROM enrollments WHERE class_id=$1 AND member_id=$2',[classId,req.params.id])).rows.length)fail(404,'Học viên không thuộc lớp này.');}else requireAdmin(s);const old=(await db.query('SELECT * FROM members WHERE id=$1',[req.params.id])).rows[0];if(!old)fail(404,'Không tìm thấy hồ sơ.');const m=await validate(req.body,profile(old));m.avatar=await avatar(m.avatar,old.avatar);await db.transaction(async tx=>{await tx.query('UPDATE members SET name=$2,birthday=$3,phone=$4,address=$5,area=$6,"group"=$7,referrer=$8,joined=$9,avatar=$10,email=$11 WHERE id=$1',[old.id,m.name,m.birthday||null,m.phone,m.address,m.area,m.group,m.referrer||null,m.joined||old.joined,m.avatar,m.email]);await tx.query("INSERT INTO audit_log(actor,action,target) VALUES ($1,'profile_update',$2)",[s.id,old.id]);});res.json({ok:true,member:profile({...m,id:old.id,joined:m.joined||profile(old).joined})});}
 route('patch','/api/members/:id',async(req,res)=>updateMember(req,res));
 route('patch','/api/classes/:classId/members/:id',async(req,res)=>updateMember(req,res,req.params.classId));
 route('patch','/api/requirements/:field',async(req,res)=>{await db.transaction(async tx=>{requireDev(await session(req,true,tx));if(!configurable.includes(req.params.field)||typeof req.body.required!=='boolean')fail(400,'Cấu hình không hợp lệ.');await tx.query('INSERT INTO registration_fields VALUES ($1,$2) ON CONFLICT(field) DO UPDATE SET required=EXCLUDED.required',[req.params.field,req.body.required]);});res.json({field:req.params.field,required:req.body.required});});
 route('put','/api/enrollments/:classId/:memberId',async(req,res)=>{const enrollment=await db.transaction(async tx=>{const s=await session(req,true,tx);requireAdmin(s);if(!await managed(s,req.params.classId,tx))fail(403,'Không có quyền quản lý lớp này.');return (await tx.query('INSERT INTO enrollments(member_id,class_id) VALUES ($1,$2) ON CONFLICT(member_id,class_id) DO UPDATE SET date=enrollments.date RETURNING member_id AS "memberId",class_id AS "classId",date',[req.params.memberId,req.params.classId])).rows[0];});res.json({ok:true,enrollment:{...enrollment,date:enrollment.date instanceof Date?enrollment.date.toISOString().slice(0,10):enrollment.date}});});
 route('delete','/api/enrollments/:classId/:memberId',async(req,res)=>{const s=await session(req);requireAdmin(s);if(!await managed(s,req.params.classId))fail(403,'Không có quyền quản lý lớp này.');await db.query('DELETE FROM enrollments WHERE class_id=$1 AND member_id=$2',[req.params.classId,req.params.memberId]);res.json({ok:true});});
 route('get','/api/avatars/:key',async(req,res)=>{const s=await session(req);if(!/^[a-f0-9-]{36}\.webp$/.test(req.params.key))fail(404,'Không tìm thấy ảnh.');const known=(await db.query('SELECT 1 FROM members WHERE avatar=$1',['/api/avatars/'+req.params.key])).rows.length;if(!known)fail(404,'Không tìm thấy ảnh.');res.type('webp').send(storage?await storage.get(req.params.key):await readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ uploadDir,req.params.key)));});
 app.use((err,req,res,next)=>{if(res.headersSent)return next(err);if(err.code==='23505'){err.status=409;err.message=err.constraint==='staff_accounts_username_key'?'Tên đăng nhập quản trị đã được sử dụng.':'Thông tin trùng với dữ liệu hiện có.';}const status=err.status??(['23503','22008'].includes(err.code)?400:500);if(status===500)console.error('API request failed:',err.code??'internal');res.status(status).json({error:status===500?'Không thể xử lý yêu cầu. Vui lòng thử lại.':err.message});});
 return {app,db};
}

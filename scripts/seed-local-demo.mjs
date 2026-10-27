import {mkdir,open,readFile,unlink,writeFile} from 'node:fs/promises';
import {randomInt,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {createBackend} from '../server/backend.mjs';
import {generateDemoProfiles} from './lib/demo-profiles.mjs';
if(!process.argv.includes('--local')||!process.argv.includes('--execute')||process.env.NODE_ENV==='production'||process.env.APP_BACKEND==='cloud')throw new Error('This command only seeds local data: --local --execute');
const lock='.local/server.lock';let db,locked=false;
try{
 await mkdir('.local',{recursive:true});try{const pid=Number(await readFile(lock,'utf8'));if(pid>0){try{process.kill(pid,0);throw new Error('Stop the local backend before adding demo data.');}catch(e){if(e.code!=='ESRCH')throw e;}}await unlink(lock);}catch(e){if(e.code!=='ENOENT')throw e;}
 const handle=await open(lock,'wx');await handle.writeFile(String(process.pid));await handle.close();locked=true;
 ({db}=await createBackend({seedData:false}));
 const marker='local_dashboard_demo_v1';
 if((await db.query('SELECT 1 FROM app_meta WHERE key=$1',[marker])).rows.length){console.log('Local demo dataset already exists; no duplicates added.');}
 else{
  const seed=randomInt(1,2147483647),asOf=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}),rows=generateDemoProfiles({seed,asOf}),avatarKeys=[];
  await mkdir('.local/avatars',{recursive:true});
  const colors=['#a32d3a','#a47d4e','#71835d','#987b8e','#567f85','#9b6d50'];
  for(let i=0;i<12;i++){const key=randomUUID()+'.webp';const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480"><rect width="360" height="480" fill="${colors[i%colors.length]}"/><circle cx="180" cy="150" r="67" fill="#ffffff" opacity=".8"/><path d="M58 370c0-150 244-150 244 0" fill="#ffffff" opacity=".7"/><text x="180" y="433" fill="#fff" font-family="sans-serif" font-size="23" text-anchor="middle">ẢNH MẪU ${i+1}</text></svg>`;await writeFile('.local/avatars/'+key,await sharp(Buffer.from(svg)).webp({quality:80}).toBuffer());avatarKeys.push(key);}
  const summary=await db.transaction(async tx=>{
   const ids=[];for(const record of rows){const data={...record.profileData,avatar:'/api/avatars/'+avatarKeys[record.avatarIndex]};const row=(await tx.query(`INSERT INTO members(name,birthday,phone,address,area,"group",joined,avatar,profile_data,profile_version,registration_status,submitted_at,submitted_by,approved_by,approved_at) VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8::jsonb,10,$9,$10,'source-dev',CASE WHEN $9='approved' THEN 'source-dev' ELSE NULL END,CASE WHEN $9='approved' THEN $10::timestamptz ELSE NULL END) RETURNING id`,[data.name,data.birthday,data.phone,data.address,record.group,record.joined,data.avatar,JSON.stringify(data),record.registrationStatus,record.submittedAt])).rows[0];ids.push(row.id);}
   const adults=rows.flatMap((r,i)=>r.group!=='children'&&r.registrationStatus==='approved'?[ids[i]]:[]);
   for(let i=0;i<rows.length;i++){const introducedBy=adults[(i*7)%adults.length],caregiver=adults[(i*3+11)%adults.length],links={introducedBy:introducedBy===ids[i]?'':introducedBy,...(rows[i].group!=='children'?{caregiver:caregiver===ids[i]?'':caregiver}:{})};await tx.query('UPDATE members SET profile_data=profile_data || $2::jsonb WHERE id=$1',[ids[i],JSON.stringify(links)]);}
   await tx.query('INSERT INTO app_meta VALUES ($1,$2)',[marker,JSON.stringify({ids,avatarKeys,seed,createdAt:new Date().toISOString()})]);
   return {approved:rows.filter(r=>r.registrationStatus==='approved').length,pending:rows.filter(r=>r.registrationStatus==='pending').length,groups:{children:90,youth:120,congregation:150}};
  });console.log(JSON.stringify({mode:'local',...summary,seed}));
 }
}catch(e){console.error('Local demo generation failed:',e.code??e.message);process.exitCode=1;}finally{await db?.close();if(locked)await unlink(lock).catch(()=>{});}

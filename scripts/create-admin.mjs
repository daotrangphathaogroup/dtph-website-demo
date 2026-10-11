import {randomUUID} from 'node:crypto';
import {Writable} from 'node:stream';
import {createInterface} from 'node:readline';
import {createPostgresDatabase} from '../server/postgres.mjs';
import {passwordHash} from '../server/backend.mjs';
const [username,displayName]=process.argv.slice(2);
if(!/^[a-z0-9][a-z0-9._-]{2,39}$/i.test(username??'')||!displayName?.trim()||displayName.length>100)throw new Error('Usage: npm run admin:create -- admin-name "Họ tên quản lý"');
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL locally and run database migrations first.');
if(!process.stdin.isTTY)throw new Error('Run this command in an interactive terminal to enter a hidden password.');
process.stdout.write('Mật khẩu quản trị (8–128 ký tự, không hiển thị): ');
const output=new Writable({write(chunk,encoding,callback){callback();}});const input=createInterface({input:process.stdin,output,terminal:true});
const password=await new Promise(resolve=>input.question('',resolve));input.close();process.stdout.write('\n');if(password.length<8||password.length>128)throw new Error('Password must contain 8–128 characters.');
const db=createPostgresDatabase({connectionString:process.env.DATABASE_URL,ca:process.env.DATABASE_SSL_CA});
try{await db.query('INSERT INTO staff_accounts(id,username,display_name,password_hash,role) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),username.toLowerCase(),displayName.trim(),await passwordHash(password),'admin']);console.log('Created administrator:',username.toLowerCase());}finally{await db.close();}

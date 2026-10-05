import pg from 'pg';
import {readFile,readdir} from 'node:fs/promises';
if(!process.env.MIGRATION_DATABASE_URL)throw new Error('Set MIGRATION_DATABASE_URL locally; never put it in NEXT_PUBLIC_* variables.');
const client=new pg.Client({connectionString:process.env.MIGRATION_DATABASE_URL,ssl:{rejectUnauthorized:true,...(process.env.DATABASE_SSL_CA?{ca:process.env.DATABASE_SSL_CA.replace(/\\n/g,'\n')}:{})}});
try{await client.connect();const directory=new URL('../supabase/migrations/',import.meta.url);for(const file of (await readdir(directory)).filter(name=>name.endsWith('.sql')).sort())await client.query(await readFile(new URL(file,directory),'utf8'));console.log('Supabase schema migration completed. No demo members created.');}finally{await client.end();}

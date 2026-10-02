import pg from 'pg';
import {readFile} from 'node:fs/promises';
if(!process.env.MIGRATION_DATABASE_URL)throw new Error('Set MIGRATION_DATABASE_URL locally; never put it in VITE_* variables.');
const client=new pg.Client({connectionString:process.env.MIGRATION_DATABASE_URL,ssl:{rejectUnauthorized:true,...(process.env.DATABASE_SSL_CA?{ca:process.env.DATABASE_SSL_CA.replace(/\\n/g,'\n')}:{})}});
try{await client.connect();await client.query(await readFile(new URL('../supabase/migrations/202610020001_initial.sql',import.meta.url),'utf8'));console.log('Supabase schema migration completed. No demo members created.');}finally{await client.end();}

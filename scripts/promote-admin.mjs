import {createPostgresDatabase} from '../server/postgres.mjs';
const id=process.argv[2];if(!/^PH\d{5,}$/.test(id??''))throw new Error('Usage: npm run admin:promote -- PH00001');
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL locally.');
const db=createPostgresDatabase({connectionString:process.env.DATABASE_URL,ca:process.env.DATABASE_SSL_CA});
try{const result=await db.query("UPDATE accounts SET role='admin' WHERE member_id=$1 AND verified=true RETURNING member_id",[id]);if(result.rows.length!==1)throw new Error('Verified member not found. Register and verify SMS first.');console.log('Updated administrator:',id);}finally{await db.close();}

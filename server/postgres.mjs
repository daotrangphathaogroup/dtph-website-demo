import pg from 'pg';
// Vercel instances must share transaction slots instead of reserving a session.
export function runtimeDatabaseUrl(connectionString){
 let url;try{url=new URL(connectionString);}catch{return connectionString;}
 if(['postgres:','postgresql:'].includes(url.protocol)&&url.hostname.endsWith('.pooler.supabase.com')&&(!url.port||url.port==='5432')){url.port='6543';return url.toString();}
 return connectionString;
}
/** SET LOCAL is applied in every transaction; safe with Supavisor transaction pooling. */
export function createPostgresDatabase({connectionString,ca,poolFactory=options=>new pg.Pool(options)}){
 // PEM copied into environment settings can contain indentation or escaped newlines.
 const certificate=ca?.replace(/\\n/g,'\n').split(/\r?\n/).map(line=>line.trim()).join('\n').trim();
 const pool=poolFactory({connectionString,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true,...(certificate?{ca:certificate}:{})}});
 pool.on('error',()=>console.error('PostgreSQL pool connection failed.'));
 async function transaction(fn){const client=await pool.connect();try{await client.query('BEGIN');await client.query('SET LOCAL search_path TO phat_hao, pg_catalog');const result=await fn({query:(sql,params)=>client.query(sql,params)});await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}}
 return {query:(sql,params)=>transaction(tx=>tx.query(sql,params)),transaction,close:()=>pool.end()};
}

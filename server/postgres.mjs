import pg from 'pg';
/** SET LOCAL is applied in every transaction; safe with Supavisor transaction pooling. */
export function createPostgresDatabase({connectionString,ca,poolFactory=options=>new pg.Pool(options)}){
 const pool=poolFactory({connectionString,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true,...(ca?{ca:ca.replace(/\\n/g,'\n')}:{})}});
 pool.on('error',()=>console.error('PostgreSQL pool connection failed.'));
 async function transaction(fn){const client=await pool.connect();try{await client.query('BEGIN');await client.query('SET LOCAL search_path TO phat_hao, pg_catalog');const result=await fn({query:(sql,params)=>client.query(sql,params)});await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}}
 return {query:(sql,params)=>transaction(tx=>tx.query(sql,params)),transaction,close:()=>pool.end()};
}

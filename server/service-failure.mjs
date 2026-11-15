/** Public diagnostic categories never include credentials, SQL or connection addresses. */
export function serviceFailure(error){
 const code=String(error?.code??'');const message=String(error?.message??'');
 if(/^Missing production configuration:|^ADMIN_SESSION_SECRET|^APP_ORIGIN/.test(message))return 'configuration';
 if(/CERT|TLS|SSL/.test(code)||/certificate|TLS|SSL/i.test(message))return 'database-tls';
 if(code==='53300'||/MaxClients|too many clients|remaining connection slots|max client connections/i.test(message))return 'database-capacity';
 if(/^08\w{3}$/.test(code)||['ECONNRESET','ETIMEDOUT','ECONNREFUSED','ENETUNREACH','ENOTFOUND','EHOSTUNREACH'].includes(code)||/Connection terminated|timeout.*connect|connect.*timeout|Circuit breaker|unable to establish connection/i.test(message))return 'database-connection';
 return 'initialization';
}
export function databaseMode(connectionString){try{const url=new URL(connectionString);return url.hostname.endsWith('.pooler.supabase.com')?(url.port==='6543'?'transaction':'session'):'direct';}catch{return 'unknown';}}

import {getBackend} from '../../../../server/runtime.mjs';
import {handleRequest} from '../../../../server/next-handler.mjs';
import {serviceFailure,databaseMode} from '../../../../server/service-failure.mjs';
import {runtimeDatabaseUrl} from '../../../../server/postgres.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
async function handler(request:Request){try{const {app}=await getBackend();return await handleRequest(app,request);}catch(error){const reason=serviceFailure(error);console.error('API unavailable:',reason);return Response.json({error:'Dịch vụ chưa được cấu hình hoàn tất.'},{status:503,headers:{'Cache-Control':'no-store','X-Service-Failure':reason,'X-Database-Mode':databaseMode(runtimeDatabaseUrl(process.env.DATABASE_URL)),'X-Service-Code':error&&typeof error==='object'&&'code' in error&&/^[A-Z0-9_]{1,40}$/.test(String(error.code))?String(error.code):'unknown','X-Service-Exception':error instanceof TypeError?'TypeError':error instanceof ReferenceError?'ReferenceError':'Error'}});}}
export {handler as GET,handler as POST,handler as PATCH,handler as PUT,handler as DELETE,handler as HEAD};

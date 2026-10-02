import {getBackend} from '../../../../server/runtime.mjs';
import {handleRequest} from '../../../../server/next-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
async function handler(request:Request){try{const {app}=await getBackend();return await handleRequest(app,request);}catch(error){console.error('API initialization failed:',process.env.NODE_ENV==='production'?'configuration':(error as Error).message);return Response.json({error:'Dịch vụ chưa được cấu hình hoàn tất.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
export {handler as GET,handler as POST,handler as PATCH,handler as PUT,handler as DELETE,handler as HEAD};

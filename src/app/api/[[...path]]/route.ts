import {getBackend} from '../../../../server/runtime.mjs';
import {handleRequest} from '../../../../server/next-handler.mjs';
import {serviceFailure} from '../../../../server/service-failure.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
async function handler(request:Request){
 try{const {app}=await getBackend();return await handleRequest(app,request,{vercel:process.env.VERCEL==='1'});}
 catch(error){
  const reason=serviceFailure(error);
  console.error('API unavailable:',reason);
  return Response.json({error:'Dịch vụ chưa được cấu hình hoàn tất.'},{status:503,headers:{'Cache-Control':'no-store','X-Service-Failure':reason}});
 }
}
export {handler as GET,handler as POST,handler as PATCH,handler as PUT,handler as DELETE,handler as HEAD};

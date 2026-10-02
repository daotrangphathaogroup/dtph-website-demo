import {createProductionBackend} from '../server/production.mjs';
let pending;
export default async function handler(req,res){try{pending??=createProductionBackend().catch(error=>{pending=undefined;throw error;});const {app}=await pending;return app(req,res);}catch(error){console.error('API initialization failed:',error.code??'configuration');res.statusCode=503;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:'Dịch vụ chưa được cấu hình hoàn tất.'}));}}

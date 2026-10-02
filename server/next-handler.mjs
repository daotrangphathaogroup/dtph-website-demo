import {IncomingMessage,ServerResponse} from 'node:http';
import {Socket} from 'node:net';
const BODY_LIMIT=2*1024*1024;
/** Bridge the tested HTTP application to Next's Web Request/Response interface. */
export async function handleRequest(app,request){
 const headers=new Headers({'Cache-Control':'no-store','Content-Type':'application/json'});
 if(Number(request.headers.get('content-length'))>BODY_LIMIT)return new Response(JSON.stringify({error:'Dữ liệu vượt dung lượng cho phép.'}),{status:413,headers});
 const chunks=[];let size=0;
 if(request.body){const reader=request.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>BODY_LIMIT){await reader.cancel();return new Response(JSON.stringify({error:'Dữ liệu vượt dung lượng cho phép.'}),{status:413,headers});}chunks.push(Buffer.from(value));}}
 const socket=new Socket();Object.defineProperty(socket,'remoteAddress',{value:'127.0.0.1'});
 const req=new IncomingMessage(socket);req.method=request.method;const url=new URL(request.url);req.url=url.pathname+url.search;req.headers=Object.fromEntries(request.headers.entries());req.headers['content-length']=String(size);req.push(Buffer.concat(chunks));req.push(null);
 const res=new ServerResponse(req);
 return new Promise((resolve,reject)=>{
  const output=[];
  res.write=(chunk,encoding,callback)=>{if(chunk)output.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,typeof encoding==='string'?encoding:undefined));if(typeof encoding==='function')encoding();else callback?.();return true;};
  res.end=(chunk,encoding,callback)=>{if(chunk)res.write(chunk,encoding);const resultHeaders=new Headers();for(const [key,value]of Object.entries(res.getHeaders())){for(const entry of Array.isArray(value)?value:[value])if(entry!==undefined)resultHeaders.append(key,String(entry));}resolve(new Response(request.method==='HEAD'||res.statusCode===204?null:Buffer.concat(output),{status:res.statusCode,headers:resultHeaders}));res.emit('finish');if(typeof encoding==='function')encoding();else callback?.();return res;};
  res.on('error',reject);app(req,res,error=>{if(error)reject(error);else{res.statusCode=404;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Không tìm thấy API.'}));}});
 });
}

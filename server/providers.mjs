import { S3Client,PutObjectCommand,GetObjectCommand } from '@aws-sdk/client-s3';
export function createR2Storage({accountId,accessKeyId,secretAccessKey,bucket,client}){
 const s3=client??new S3Client({region:'auto',endpoint:`https://${accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId,secretAccessKey}});
 return {async put(key,body){await s3.send(new PutObjectCommand({Bucket:bucket,Key:'avatars/'+key,Body:body,ContentType:'image/webp',CacheControl:'private, max-age=0'}));},async get(key){const result=await s3.send(new GetObjectCommand({Bucket:bucket,Key:'avatars/'+key}));return Buffer.from(await result.Body.transformToByteArray());}};
}
export function createTwilioSms({accountSid,authToken,messagingServiceSid,from,fetchImpl=fetch}){
 return {canSend:true,async send({phone,message}){const body=new URLSearchParams({To:'+84'+phone.slice(1),Body:message,...(messagingServiceSid?{MessagingServiceSid:messagingServiceSid}:{From:from})});const response=await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(accountSid+':'+authToken).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(10000)});if(!response.ok)throw Object.assign(new Error('Không gửi được SMS. Vui lòng thử lại sau.'),{status:502});}};
}
export function productionConfig(env=process.env){
 const required=['DATABASE_URL','OTP_SECRET','APP_ORIGIN','R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'];const missing=required.filter(key=>!env[key]);if(missing.length)throw new Error('Missing production configuration: '+missing.join(', '));
 if(env.OTP_SECRET.length<32)throw new Error('OTP_SECRET must have at least 32 characters.');
 const origin=new URL(env.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN)throw new Error('APP_ORIGIN must be an exact HTTPS origin.');
 const mode=env.SMS_PROVIDER??'disabled';if(!['twilio','disabled','preview'].includes(mode))throw new Error('Unsupported SMS_PROVIDER.');
 if(mode==='twilio'&&(!env.TWILIO_ACCOUNT_SID||!env.TWILIO_AUTH_TOKEN||(!env.TWILIO_MESSAGING_SERVICE_SID&&!env.TWILIO_FROM)))throw new Error('Twilio credentials and sender are required.');
 return {origin:origin.origin,secret:env.OTP_SECRET,sms:mode==='twilio'?createTwilioSms({accountSid:env.TWILIO_ACCOUNT_SID,authToken:env.TWILIO_AUTH_TOKEN,messagingServiceSid:env.TWILIO_MESSAGING_SERVICE_SID,from:env.TWILIO_FROM}):{canSend:false,preview:mode==='preview',async send(){throw Object.assign(new Error('OTP SMS chưa được cấu hình. Đăng ký và đăng nhập chưa mở.'),{status:503});}},storage:createR2Storage({accountId:env.R2_ACCOUNT_ID,accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY,bucket:env.R2_BUCKET})};
}

import { S3Client,PutObjectCommand,GetObjectCommand } from '@aws-sdk/client-s3';
export function createR2Storage({accountId,accessKeyId,secretAccessKey,bucket,client}){
 const s3=client??new S3Client({region:'auto',endpoint:`https://${accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId,secretAccessKey}});
 return {async put(key,body){await s3.send(new PutObjectCommand({Bucket:bucket,Key:'avatars/'+key,Body:body,ContentType:'image/webp',CacheControl:'private, max-age=0'}));},async get(key){const result=await s3.send(new GetObjectCommand({Bucket:bucket,Key:'avatars/'+key}));return Buffer.from(await result.Body.transformToByteArray());}};
}
export function productionConfig(env=process.env){
 const required=['DATABASE_URL','APP_ORIGIN','R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'];const missing=required.filter(key=>!env[key]);if(missing.length)throw new Error('Missing production configuration: '+missing.join(', '));
 // Transitional compatibility only: old deployments may still name the stable server secret OTP_SECRET.
 const secret=env.ADMIN_SESSION_SECRET||env.OTP_SECRET;if(!secret||secret.length<32)throw new Error('ADMIN_SESSION_SECRET must have at least 32 characters.');
 const origin=new URL(env.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN)throw new Error('APP_ORIGIN must be an exact HTTPS origin.');
 return {origin:origin.origin,secret,storage:createR2Storage({accountId:env.R2_ACCOUNT_ID,accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY,bucket:env.R2_BUCKET})};
}

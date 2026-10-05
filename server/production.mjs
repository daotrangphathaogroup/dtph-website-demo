import {createGoogleAuth} from './google-auth.mjs';
import {createBackend} from './backend.mjs';
import {createPostgresDatabase} from './postgres.mjs';
import {productionConfig} from './providers.mjs';
export async function createProductionBackend(env=process.env){const config=productionConfig(env);const db=createPostgresDatabase({connectionString:env.DATABASE_URL,ca:env.DATABASE_SSL_CA});try{return await createBackend({database:db,production:true,seedData:false,initialize:false,secret:config.secret,origin:config.origin,storage:config.storage,sms:config.sms,google:env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET?createGoogleAuth(env):null});}catch(e){await db.close();throw e;}}

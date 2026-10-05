export const defaultAuthFeatures={smsOtp:false,emailOtp:false,googleLogin:false};
export async function readAuthFeatures(db,defaults=defaultAuthFeatures){
 const result={...defaultAuthFeatures,...defaults};
 const rows=(await db.query("SELECT key,value FROM app_meta WHERE key IN ('auth_smsOtp','auth_emailOtp','auth_googleLogin')")).rows;
 for(const row of rows)result[row.key.slice(5)]=row.value==='true';
 return result;
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from '../server/backend.mjs';
import {handleRequest} from '../server/next-handler.mjs';

test('Historical records preserve missing participation and registration dates through the API', async () => {
  const {app,db}=await createBackend({dataDir:'memory://',rateLimits:false});
  const call=async(path,init={})=>handleRequest(app,new Request('http://127.0.0.1:5173/api'+path,init));
  try {
    const result=await db.query(`INSERT INTO members(name,"group",joined,submitted_at,profile_data)
      VALUES ('Historical record','congregation',NULL,NULL,'{"congregationStartYear":""}') RETURNING id,joined,submitted_at`);
    assert.equal(result.rows[0].joined,null);
    assert.equal(result.rows[0].submitted_at,null);
    const login=await call('/admin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5173'},body:JSON.stringify({username:'dev',password:'1@345678'})});
    assert.equal(login.status,200);
    const response=await call('/bootstrap',{headers:{Cookie:login.headers.getSetCookie()[0].split(';')[0]}});
    assert.equal(response.status,200);
    const row=(await response.json()).store.members.find(member=>member.id===result.rows[0].id);
    assert.equal(row.joined,'');
    assert.equal(row.submittedAt,null);
    assert.equal(row.profileData.congregationStartYear,'');
  } finally {await db.close();}
});

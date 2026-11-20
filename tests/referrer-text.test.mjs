import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBackend} from '../server/backend.mjs';

test('Referral migration resolves existing IDs once and keeps future free text unchanged', async () => {
  const {db}=await createBackend({dataDir:'memory://',rateLimits:false});
  try {
    await db.query(`INSERT INTO members(id,name,"group",profile_data) VALUES
      ('ref','Huynh đệ giới thiệu','youth','{}'),
      ('person','Hồ sơ cũ','youth','{"introducedBy":"ref","caregiver":"ref"}')`);
    await db.query("DELETE FROM app_meta WHERE key='referrer_plain_text_v1'");
    const migration=await readFile(new URL('../server/migrations/016_referrer_text.sql',import.meta.url),'utf8');
    await db.exec(migration);
    const data=(await db.query("SELECT profile_data FROM members WHERE id='person'")).rows[0].profile_data;
    assert.equal(data.introducedBy,'Huynh đệ giới thiệu');
    assert.equal(data.caregiver,'ref');
    for(const row of (await db.query('SELECT fields FROM registration_schemas')).rows)
      assert.equal(row.fields.find(field=>field.key==='introducedBy').type,'text');
    await db.query(`UPDATE members SET profile_data=jsonb_set(profile_data,'{introducedBy}','"ref"') WHERE id='person'`);
    await db.exec(migration);
    assert.equal((await db.query("SELECT profile_data->>'introducedBy' AS value FROM members WHERE id='person'")).rows[0].value,'ref');
  } finally {await db.close();}
});

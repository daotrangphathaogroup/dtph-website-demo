// Canonical fields are transcribed from the two sheets of the ĐHPH workbook.
import {writeFile} from 'node:fs/promises';
import {defaultSchemas} from '../src/lib/registration.ts';
const lines=Object.values(defaultSchemas).map(s=>`INSERT INTO registration_schemas(group_id,version,fields) VALUES ('${s.group}',${s.version},'${JSON.stringify(s.fields).replaceAll("'","''")}'::jsonb) ON CONFLICT(group_id) DO UPDATE SET version=EXCLUDED.version,fields=EXCLUDED.fields;`);
const sql=`-- Replace schemas exactly once; never delete people or reset future required toggles.\nDO $$ BEGIN\n IF NOT EXISTS(SELECT 1 FROM app_meta WHERE key='workbook_profiles_20261027') THEN\n ${lines.join('\n ')}\n INSERT INTO app_meta VALUES('workbook_profiles_20261027','true');\n END IF;\nEND $$;\n`;
for(const file of ['server/migrations/010_workbook_profiles.sql','supabase/migrations/202610270001_workbook_profiles.sql'])await writeFile(file,file.startsWith('supabase/')?'BEGIN;\nSET LOCAL search_path TO phat_hao, pg_catalog;\n'+sql+'COMMIT;\n':sql);

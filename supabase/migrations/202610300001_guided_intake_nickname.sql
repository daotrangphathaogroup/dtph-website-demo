BEGIN;
SET LOCAL search_path TO phat_hao, pg_catalog;
-- Expose the existing children's nickname field to the guided registration form.
-- Preserve all member data and schema extensions; run once.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM app_meta WHERE key='guided_intake_nickname_20261030') THEN
  UPDATE registration_schemas
   SET fields=(SELECT jsonb_agg(CASE WHEN item->>'key'='nickname' THEN item - 'staffOnly' ELSE item END ORDER BY ord)
     FROM jsonb_array_elements(fields) WITH ORDINALITY AS f(item,ord)),
       version=GREATEST(version,11)
   WHERE group_id='children';
  INSERT INTO app_meta VALUES('guided_intake_nickname_20261030','true');
 END IF;
END $$;

COMMIT;

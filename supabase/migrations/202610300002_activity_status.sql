BEGIN;
SET LOCAL search_path TO phat_hao, pg_catalog;
-- Change schema metadata only. Existing free-text statuses remain untouched.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM app_meta WHERE key='activity_status_20261030') THEN
  UPDATE registration_schemas
  SET fields=(SELECT jsonb_agg(
    CASE WHEN item->>'key'='status' THEN
      (item - 'allowOther') || '{"label":"Trạng thái","type":"select","options":["Không hoạt động","Ít hoạt động","Hoạt động thường xuyên","Hoạt động tích cực"],"staffOnly":true}'::jsonb
    ELSE item END ORDER BY ord)
    FROM jsonb_array_elements(fields) WITH ORDINALITY AS f(item,ord)),
    version=GREATEST(version,12);
  INSERT INTO app_meta VALUES ('activity_status_20261030','true');
 END IF;
END $$;

COMMIT;

-- Archive old activity classification; positive tags require a deliberate choice.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM app_meta WHERE key='recognition_tags_20261105') THEN
 UPDATE registration_schemas SET fields=(SELECT jsonb_agg(CASE WHEN item->>'key'='status' THEN (item-'allowOther') || '{"label":"Tình trạng","type":"tags","options":["tinh-tan","cham-chi","hoa-dong","cong-qua","trach-nhiem","giup-do"],"staffOnly":true,"required":false}'::jsonb ELSE item END ORDER BY ord) FROM jsonb_array_elements(fields) WITH ORDINALITY f(item,ord)),version=GREATEST(version,14);
 UPDATE members SET profile_data=(CASE WHEN jsonb_typeof(profile_data->'status')='string' AND profile_data->>'status'<>'' THEN profile_data || jsonb_build_object('legacyActivityStatus',profile_data->'status') ELSE profile_data END) || jsonb_build_object('status',CASE WHEN jsonb_typeof(profile_data->'status')='array' THEN profile_data->'status' ELSE '[]'::jsonb END), profile_version=GREATEST(profile_version,14);
 INSERT INTO app_meta VALUES ('recognition_tags_20261105','true');
 END IF;
END $$;

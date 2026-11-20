-- Resolve previous member IDs once; new referral values are ordinary text.
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM app_meta WHERE key='referrer_plain_text_v1') THEN
  UPDATE members AS m
  SET profile_data=jsonb_set(m.profile_data,'{introducedBy}',to_jsonb(ref.name))
  FROM members AS ref
  WHERE m.profile_data->>'introducedBy'=ref.id;
  INSERT INTO app_meta(key,value) VALUES ('referrer_plain_text_v1','1');
 END IF;
END $$;
UPDATE registration_schemas AS s
SET fields=(SELECT jsonb_agg(CASE WHEN f.item->>'key'='introducedBy'
 THEN f.item || '{"type":"text"}'::jsonb ELSE f.item END ORDER BY f.ord)
 FROM jsonb_array_elements(s.fields) WITH ORDINALITY AS f(item,ord)),
 version=GREATEST(s.version,17);

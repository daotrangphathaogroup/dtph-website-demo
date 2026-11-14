BEGIN;
SET LOCAL search_path TO phat_hao, pg_catalog;

UPDATE registration_schemas
SET fields = (
  SELECT jsonb_agg(
    CASE item->>'key'
      WHEN 'nickname' THEN item || '{"label":"Mã số","type":"text","required":false}'::jsonb
      WHEN 'schoolClass' THEN item || '{"required":false}'::jsonb
      ELSE item
    END ORDER BY ord
  )
  FROM jsonb_array_elements(fields) WITH ORDINALITY AS f(item, ord)
  WHERE item->>'key' <> 'personality'
    AND (group_id = 'children' OR item->>'key' <> 'relativePhone')
)
WHERE group_id IN ('children', 'youth', 'congregation');

UPDATE members
SET profile_data = CASE WHEN "group" = 'children'
  THEN profile_data - 'personality'
  ELSE profile_data - 'personality' - 'relativePhone'
END
WHERE profile_data ? 'personality'
   OR ("group" IN ('youth', 'congregation') AND profile_data ? 'relativePhone');

COMMIT;

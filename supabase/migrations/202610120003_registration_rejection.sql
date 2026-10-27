BEGIN;
SET LOCAL search_path TO phat_hao, pg_catalog;
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_registration_status_check;
ALTER TABLE members ADD CONSTRAINT members_registration_status_check CHECK (registration_status IN ('pending','approved','rejected'));
COMMIT;

BEGIN;
SET LOCAL search_path TO phat_hao, pg_catalog;
ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
UPDATE staff_accounts SET role='manager' WHERE role='class_manager';
ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check CHECK(role IN ('dev','admin','manager'));
CREATE UNIQUE INDEX IF NOT EXISTS staff_single_dev ON staff_accounts(role) WHERE role='dev';
COMMIT;

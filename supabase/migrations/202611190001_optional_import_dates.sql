SET search_path TO phat_hao, pg_catalog;
ALTER TABLE members ALTER COLUMN joined DROP NOT NULL;
ALTER TABLE members ALTER COLUMN submitted_at DROP NOT NULL;

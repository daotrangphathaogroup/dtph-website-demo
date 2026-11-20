-- Historical imports must preserve unknown dates instead of inventing today's date.
ALTER TABLE members ALTER COLUMN joined DROP NOT NULL;
ALTER TABLE members ALTER COLUMN submitted_at DROP NOT NULL;

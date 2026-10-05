ALTER TABLE members ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique ON members (lower(btrim(email))) WHERE btrim(email) <> '';
INSERT INTO registration_fields(field,required) VALUES ('email',false) ON CONFLICT DO NOTHING;

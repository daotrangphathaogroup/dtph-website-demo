CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY, value text NOT NULL);
CREATE SEQUENCE IF NOT EXISTS member_code_seq START 37;
CREATE OR REPLACE FUNCTION next_member_code() RETURNS text LANGUAGE plpgsql AS $$
DECLARE code text := nextval('member_code_seq')::text;
BEGIN RETURN 'PH' || lpad(code,greatest(5,length(code)),'0'); END; $$;
CREATE TABLE IF NOT EXISTS members (
 id text PRIMARY KEY DEFAULT next_member_code(),
 name text NOT NULL, birthday date, phone text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '',
 area text NOT NULL DEFAULT '', "group" text NOT NULL CHECK ("group" IN ('children','youth','congregation')),
 referrer text REFERENCES members(id), joined date NOT NULL DEFAULT CURRENT_DATE, avatar text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS members_phone_idx ON members(phone);
CREATE INDEX IF NOT EXISTS members_group_area_idx ON members("group",area);
CREATE TABLE IF NOT EXISTS accounts (
 member_id text PRIMARY KEY REFERENCES members(id), password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'member' CHECK(role IN ('admin','class_manager','member')), verified boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS classes (id text PRIMARY KEY, name text NOT NULL, group_id text NOT NULL);
CREATE TABLE IF NOT EXISTS class_managers (member_id text REFERENCES members(id), class_id text REFERENCES classes(id), PRIMARY KEY(member_id,class_id));
CREATE TABLE IF NOT EXISTS enrollments (member_id text REFERENCES members(id), class_id text REFERENCES classes(id), date date NOT NULL DEFAULT CURRENT_DATE, PRIMARY KEY(member_id,class_id));
CREATE TABLE IF NOT EXISTS registration_fields (field text PRIMARY KEY, required boolean NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, member_id text REFERENCES accounts(member_id), expires_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS challenges (
 id text PRIMARY KEY, token_hash text NOT NULL, member_id text REFERENCES accounts(member_id), phone text NOT NULL,
 purpose text NOT NULL CHECK(purpose IN ('login','registration','password_change')), code_hash text NOT NULL,
 expires_at bigint NOT NULL, attempts integer NOT NULL DEFAULT 0, consumed boolean NOT NULL DEFAULT false,
 session_hash text, created_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS challenges_account_idx ON challenges(member_id,purpose);
CREATE TABLE IF NOT EXISTS password_grants (token_hash text PRIMARY KEY, member_id text REFERENCES accounts(member_id), session_hash text NOT NULL, expires_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log (id bigserial PRIMARY KEY, actor text, action text NOT NULL, target text, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE members ALTER COLUMN id SET DEFAULT next_member_code();
CREATE TABLE IF NOT EXISTS rate_limits (scope_key text PRIMARY KEY, window_id bigint NOT NULL, hits integer NOT NULL);

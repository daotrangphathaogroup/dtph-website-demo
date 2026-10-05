ALTER TABLE accounts ADD COLUMN IF NOT EXISTS google_subject text;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_google_subject_unique ON accounts(google_subject) WHERE google_subject IS NOT NULL;
CREATE TABLE IF NOT EXISTS google_oauth_flows (
 token_hash text PRIMARY KEY, verifier text NOT NULL, nonce text NOT NULL,
 subject text, email text NOT NULL DEFAULT '', expires_at bigint NOT NULL,
 attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS google_oauth_flows_expiry_idx ON google_oauth_flows(expires_at);

ALTER TABLE members ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'approved' CHECK(registration_status IN ('pending','approved'));
ALTER TABLE members ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE members ADD COLUMN IF NOT EXISTS submitted_by text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE members ADD COLUMN IF NOT EXISTS approved_by text;
CREATE INDEX IF NOT EXISTS members_pending_group_idx ON members("group",submitted_at) WHERE registration_status='pending';

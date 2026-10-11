CREATE TABLE IF NOT EXISTS staff_accounts (
 id text PRIMARY KEY, username text NOT NULL UNIQUE, display_name text NOT NULL,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('admin','class_manager')),
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_sessions (
 token_hash text PRIMARY KEY, staff_id text NOT NULL REFERENCES staff_accounts(id), expires_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS staff_class_managers (
 staff_id text REFERENCES staff_accounts(id), class_id text REFERENCES classes(id), PRIMARY KEY(staff_id,class_id)
);
-- Preserve old credentials for existing managers once, without activating member logins.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM app_meta WHERE key='staff_portal_migrated') THEN
  INSERT INTO staff_accounts(id,username,display_name,password_hash,role)
  SELECT 'migrated-'||a.member_id,
   CASE WHEN a.role='admin' THEN 'admin-' ELSE 'manager-' END||row_number() OVER(PARTITION BY a.role ORDER BY a.member_id),
   m.name,a.password_hash,a.role
  FROM accounts a JOIN members m ON m.id=a.member_id WHERE a.role IN ('admin','class_manager') AND a.verified=true
  ON CONFLICT DO NOTHING;
  INSERT INTO staff_class_managers(staff_id,class_id)
  SELECT 'migrated-'||c.member_id,c.class_id FROM class_managers c JOIN staff_accounts s ON s.id='migrated-'||c.member_id
  ON CONFLICT DO NOTHING;
  INSERT INTO app_meta(key,value) VALUES('staff_portal_migrated','true');
 END IF;
END $$;

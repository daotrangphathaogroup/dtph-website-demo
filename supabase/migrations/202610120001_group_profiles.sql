BEGIN;
SET LOCAL search_path TO phat_hao, pg_catalog;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_data jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_version integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS members_profile_data_gin ON members USING gin(profile_data);
CREATE TABLE IF NOT EXISTS registration_schemas (
 group_id text PRIMARY KEY CHECK(group_id IN ('children','youth','congregation')),
 version integer NOT NULL DEFAULT 1,
 fields jsonb NOT NULL CHECK(jsonb_typeof(fields)='array')
);
INSERT INTO registration_schemas(group_id,version,fields) VALUES ('youth',1,'[{"key":"avatar","label":"Ảnh đại diện","type":"image","required":false},{"key":"name","label":"Họ tên","type":"text","required":true},{"key":"dharmaName","label":"Pháp danh","type":"text","required":false},{"key":"birthYear","label":"Năm sinh","type":"year","required":false},{"key":"gender","label":"Giới tính","type":"select","required":false,"options":["Nam","Nữ","Khác"]},{"key":"phone","label":"SĐT","type":"phone","required":false},{"key":"address","label":"Địa chỉ","type":"textarea","required":false},{"key":"team","label":"Tổ","type":"team","required":false},{"key":"clubSinceYear","label":"Tham gia CLB từ năm","type":"year","required":false},{"key":"introducedBy","label":"Người giới thiệu","type":"text","required":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO registration_schemas(group_id,version,fields) VALUES ('congregation',1,'[{"key":"avatar","label":"Ảnh đại diện","type":"image","required":false},{"key":"name","label":"Họ tên","type":"text","required":true},{"key":"dharmaName","label":"Pháp danh","type":"text","required":false},{"key":"birthYear","label":"Năm sinh","type":"year","required":false},{"key":"gender","label":"Giới tính","type":"select","required":false,"options":["Nam","Nữ","Khác"]},{"key":"phone","label":"SĐT","type":"phone","required":false},{"key":"address","label":"Địa chỉ","type":"textarea","required":false},{"key":"team","label":"Tổ","type":"team","required":false},{"key":"clubSinceYear","label":"Tham gia CLB từ năm","type":"year","required":false},{"key":"introducedBy","label":"Người giới thiệu","type":"text","required":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO registration_schemas(group_id,version,fields) VALUES ('children',1,'[{"key":"avatar","label":"Ảnh đại diện","type":"image","required":false},{"key":"studentCode","label":"Mã số","type":"text","required":false},{"key":"name","label":"Họ tên","type":"text","required":true},{"key":"dharmaName","label":"Pháp danh","type":"text","required":false},{"key":"gender","label":"Giới tính","type":"select","required":false,"options":["Nam","Nữ","Khác"]},{"key":"birthYear","label":"Năm sinh","type":"year","required":false},{"key":"schoolClass","label":"HS lớp","type":"text","required":false},{"key":"studentPhone","label":"SĐT (Zalo HS)","type":"phone","required":false},{"key":"parentName","label":"Họ tên PH","type":"text","required":false},{"key":"parentPhone","label":"SĐT PH","type":"phone","required":false},{"key":"address","label":"Địa chỉ","type":"textarea","required":false},{"key":"attendance2026","label":"Số lần học năm 2026","type":"number","required":false,"staffOnly":true},{"key":"studyDate","label":"Thứ / Ngày / Tháng","type":"date","required":false,"staffOnly":true},{"key":"remarks","label":"Nhận xét","type":"textarea","required":false,"staffOnly":true}]'::jsonb) ON CONFLICT DO NOTHING;
-- One-time backfill only; retain legacy columns and relationships.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM app_meta WHERE key='group_profiles_migrated') THEN
  UPDATE members SET profile_data=jsonb_strip_nulls(jsonb_build_object('name',name,'avatar',avatar,'birthYear',EXTRACT(YEAR FROM birthday)::integer,'address',address)) ||
   CASE WHEN "group"='children' THEN jsonb_build_object('studentCode',id,'studentPhone',phone)
   ELSE jsonb_build_object('phone',phone) END;
  INSERT INTO app_meta VALUES('group_profiles_migrated','true');
 END IF;
END $$;

ALTER TABLE registration_schemas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON registration_schemas FROM anon,authenticated;
CREATE TABLE IF NOT EXISTS registration_submissions(request_id text PRIMARY KEY,fingerprint text NOT NULL,member_id text NOT NULL REFERENCES members(id));
ALTER TABLE registration_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON registration_submissions FROM anon,authenticated;
COMMIT;

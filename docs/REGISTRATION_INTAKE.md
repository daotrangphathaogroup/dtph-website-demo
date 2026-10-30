# Guided registration intake

The former Trang chủ tab is now Đăng ký thông tin. The public entry and `/dang-ky-thong-tin` show the same wizard inside the existing workspace. Signed-in staff retain the dashboard as their default entry. Old group-specific registration links redirect to the automatic intake.

## Steps and routing

1. Name, Nam/Nữ, full birth date.
2. Ward and team. The existing Đạo Tràng ward list maps to teams 1/2/3. The registrar can override the team.
3. Personal phone; relative phone. Children additionally have parent name before parent phone. Personal phone is required for youth/congregation, optional for children; other contact fields remain optional.
4. Required portrait: upload or camera, crop 3×4 and confirm; the existing input generates WebP.
5. Children only: optional nickname.
6. Optional referrer selected by stored ID from approved members. Results show portrait, name and dharma name if present. For adults this is step 5.

Only the newest revealed cluster has the Tiếp tục button, regardless of which cluster is being edited. Advancing revalidates all revealed information. Revealed clusters remain fully visible and editable; earlier clusters use subdued neutral surfaces while the active cluster has a white surface and stronger border. A 240ms fade/slide introduces each new cluster, disabled for reduced-motion preferences. The form and page heading are centered within the content area. Editing earlier inputs makes that cluster active without unmounting the other revealed clusters. Subsequent steps are revalidated, including personal-phone requirements after a birth-date change. The final submit button exists only at the last step. Optional labels include “(nếu có)”; required labels have no asterisk. The first submit opens a centered confirmation dialog with “Quay lại kiểm tra” and Escape to return without submitting; only the subsequent “Xác nhận gửi phiếu” sends the request. Editing a value resets that confirmation. Drafts stay in React memory and are not stored in localStorage.

Shared frontend/server policy (`src/lib/registration-flow.ts`), calculated using today's date in Asia/Ho_Chi_Minh:

- Age < 16: children.
- 16 ≤ age ≤ 40: youth.
- Age > 40: congregation.

The server derives the group for `POST /api/registrations/auto`; no client role or group is trusted to approve a registration. Existing public/staff approval rules remain in force. Avatar and all other submitted values are validated by the existing backend. Content-stable retries reuse a UUID so a lost response does not create duplicate records. Unrelated staff fields are never sent by the intake.

## Storage / deployment

The nickname uses the existing `profile_data.nickname` field; no duplicate member columns are introduced. Migration 011 makes the existing children's nickname field available to public registration, preserves all records and schema extensions, and runs once. Local initialization applies it automatically.

Before deploying against Supabase, apply the included `supabase/migrations/202610300001_guided_intake_nickname.sql` using the project's normal migration process. Applied to the deployed Supabase database on 2026-10-30 to resolve children registration being rejected for `nickname`. The production migration explicitly sets `search_path` to `phat_hao, pg_catalog` inside a transaction. The deployed schema endpoint was verified at version 11 with a public nickname field; a deliberately invalid-image probe passed field validation and stopped before storage or record creation.

`GET /api/member-options` adds `dharmaName` to the existing minimal approved identity response. It does not expose phone, address, birthday or pending identities.

## Verification

- Unit/API tests cover exact 16/40/41 birthday boundaries, invalid/future dates, phone requirements, children-only fields, server routing, nickname persistence, public pending, staff approval and idempotent retries.
- Chromium checks use an isolated in-memory backend, with real image upload/crop, two same-name referrers distinguished by dharma name, all cluster gates, child/adult paths, Manager approval, and a committed registration with a simulated lost response followed by retry.
- Screens checked at 320, 390, 760 and 1280px; no horizontal document overflow. Test writes do not alter local member records or Supabase.

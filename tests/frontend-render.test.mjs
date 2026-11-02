import "./tsx-hook.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
const { default: WorkspaceShell } =
  await import("../src/components/layout/WorkspaceShell.tsx");
const { default: ProfileForm } =
  await import("../src/components/ProfileForm.tsx");
const { default: MemberDataTable } =
  await import("../src/components/MemberDataTable.tsx");
const { default: PendingRegistrations } =
  await import("../src/features/members/PendingRegistrations.tsx");
const { default: MemberProfileDialog } =
  await import("../src/features/members/MemberProfileDialog.tsx");
const { default: ManagementDashboard } =
  await import("../src/components/ManagementDashboard.tsx");
const { default: RegistrationComplete } =
  await import("../src/components/RegistrationComplete.tsx");
const { defaultSchemas } = await import("../src/lib/registration.ts");
const noop = () => {},
  waiting = { children: 2, youth: 0, congregation: 1 };
const member = (n) => ({
  id: `PH${String(n).padStart(5, "0")}`,
  name: `Huynh đệ ${n}`,
  group: "children",
  birthday: "2014-02-12",
  joined: "2026-01-10",
  phone: "0901234567",
  email: "",
  address: "Tân Hạnh",
  area: "Tân Hạnh",
  team: 1,
  avatar: "",
  referrer: "",
  registrationStatus: "approved",
  profileData: {
    name: `Huynh đệ ${n}`,
    birthday: "2014-02-12",
    gender: "Nam",
    address: "Tân Hạnh",
    team: "1",
  },
});
test("Public, Manager, Admin and Dev navigation preserves access-specific controls", () => {
  for (const role of [null, "manager", "admin", "dev"]) {
    const markup = render(
      h(
        WorkspaceShell,
        {
          page: "overview",
          group: "children",
          heading: "Đăng ký thông tin",
          staff: role ? { id: "staff", username: "staff", role } : null,
          waiting,
          onNavigate: noop,
          onLogout: noop,
        },
        h("p", null, "Content"),
      ),
    );
    assert.match(markup, /aria-label="Đăng ký thông tin"/);
    assert.match(markup, /aria-label="Tìm kiếm nhanh"/);
    assert.equal(markup.includes('aria-label="Tổng quan"'), !!role);
    assert.equal(markup.includes('aria-label="Chúng thiếu nhi"'), !!role);
    assert.equal(
      markup.includes('aria-label="Quản lý tài khoản"'),
      role === "dev",
    );
    assert.equal(markup.includes('aria-label="Tài khoản staff"'), !!role);
    assert.match(markup, /id="main-content"/);
  }
});
test("Public forms retain workbook fields, hide staff-only data and disable workplace for Không", () => {
  for (const group of ["children", "youth", "congregation"]) {
    const markup = render(
      h(ProfileForm, {
        schema: defaultSchemas[group],
        publicForm: true,
        initial: { occupation: "Không" },
        onSave: async () => {},
      }),
    );
    assert.match(markup, /Gửi thông tin đăng ký/);
    assert.match(markup, /type="date"/);
    assert.match(markup, /placeholder="Không áp dụng"/);
    assert.match(
      markup,
      /<input[^>]*disabled=""[^>]*placeholder="Không áp dụng"/,
    );
    for (const field of defaultSchemas[group].fields.filter((f) => f.staffOnly))
      assert.doesNotMatch(markup, new RegExp(`id="[^\"]*-${field.key}"`));
    assert.equal(markup.includes('type="password"'), false);
    assert.equal(markup.includes('value="Khác"'), true);
  }
});
test("Detailed sheet paginates to 25 rows, preserves selection, sorting, export and read-only Manager", () => {
  const members = Array.from({ length: 30 }, (_, i) => member(i + 1));
  for (const canEdit of [false, true]) {
    const markup = render(
      h(MemberDataTable, {
        members,
        schema: defaultSchemas.children,
        canEdit,
        onOpen: noop,
      }),
    );
    assert.equal((markup.match(/aria-label="Chọn Huynh đệ/g) || []).length, 25);
    assert.equal(
      (markup.match(/aria-label="Chỉnh sửa Huynh đệ/g) || []).length,
      canEdit ? 25 : 0,
    );
    assert.match(markup, /Tùy chỉnh bảng/);
    assert.match(markup, /Xuất CSV/);
    assert.match(markup, /role="separator"/);
    assert.match(markup, /aria-sort="ascending"/);
    assert.match(markup, /Số dòng mỗi trang/);
  }
});
test("Pending review and member details preserve Admin actions and Manager view-only", () => {
  const m = {
    ...member(1),
    registrationStatus: "pending",
    submittedAt: "2026-10-01T12:00:00Z",
  };
  for (const canEdit of [false, true]) {
    const pending = render(
      h(PendingRegistrations, {
        members: [m],
        canApprove: canEdit,
        saving: new Set(),
        rejecting: null,
        onView: noop,
        onApprove: noop,
        onRejectRequest: noop,
        onReject: noop,
        onRefresh: noop,
      }),
    );
    assert.match(pending, /aria-label="Xem hồ sơ/);
    assert.equal(pending.includes('aria-label="Duyệt đăng ký'), canEdit);
    assert.equal(pending.includes('aria-label="Từ chối đăng ký'), canEdit);
    const detail = render(
      h(MemberProfileDialog, {
        member: m,
        schema: defaultSchemas.children,
        editing: false,
        canEdit,
        approving: false,
        onClose: noop,
        onEdit: noop,
        onApprove: noop,
        onSave: async () => {},
      }),
    );
    assert.match(detail, /<dialog/);
    assert.match(detail, /<dl class="detail-grid"/);
    assert.equal(detail.includes("Chỉnh sửa thông tin"), canEdit);
    assert.equal(detail.includes("Duyệt đăng ký"), canEdit);
  }
});
test("Management opens with records and defers charts to statistics mode", () => {
  const markup = render(
    h(ManagementDashboard, {
      members: [member(1), member(2)],
      pending: [],
      schemas: defaultSchemas,
      scope: "children",
      canEdit: false,
      onOpen: noop,
      pendingPanel: () => null,
      lastUpdated: "2026-10-01T00:00:00Z",
      onRefresh: async () => {},
    }),
  );
  assert.doesNotMatch(markup, /Phân bố theo Tổ/);
  assert.doesNotMatch(markup, /Đăng ký theo tháng/);
  assert.match(markup, /Chế độ quản lý/);
  assert.match(markup, /Chờ duyệt/);
  assert.match(markup, /Thống kê/);
  assert.match(markup, /Xuất CSV/);
  assert.doesNotMatch(markup, /Tổng hợp/);
  assert.match(markup, /Bảng dữ liệu/);
  assert.match(markup, /<strong>2<\/strong> hồ sơ đã duyệt/);
  assert.equal(markup.includes('aria-label="Lọc nhóm"'), false);
});
test("Registration completion exposes only one action back to home", () => {
  const markup = render(h(RegistrationComplete, { status: "pending" }));
  assert.match(markup, /Đã hoàn thành đăng ký/);
  assert.match(markup, /chờ phía quản lý/);
  assert.equal((markup.match(/<a\s/g) || []).length, 1);
  assert.match(markup, /href="\/"/);
});

test("Overview combines filters, metrics, charts and records while group pages keep working modes", () => {
  const markup = render(
    h(ManagementDashboard, {
      members: [member(1), member(2)],
      pending: [],
      schemas: defaultSchemas,
      canEdit: false,
      onOpen: noop,
      pendingPanel: () => null,
      lastUpdated: "2026-10-01T00:00:00Z",
      onRefresh: async () => {},
    }),
  );
  assert.match(markup, /Hiện trạng hồ sơ/);
  assert.match(markup, /Cơ cấu nhóm/);
  assert.match(markup, /Đăng ký theo tháng/);
  assert.match(markup, /Xuất CSV/);
  assert.match(markup, /Lọc năm đăng ký/);
  assert.match(markup, /Lọc tháng đăng ký/);
  assert.doesNotMatch(markup, /Chế độ quản lý/);
  assert.match(markup, /area-chart/);
});

test("Guided intake starts with only basic information and exposes no premature submit or group choice", async () => {
  const { default: RegistrationIntake } =
    await import("../src/features/registration/RegistrationIntake.tsx");
  const markup = render(h(RegistrationIntake));
  assert.match(markup, /Thông tin cơ bản/);
  assert.match(markup, /autoComplete="bday"/);
  assert.match(markup, /Tiếp tục/);
  assert.doesNotMatch(markup, /Gửi phiếu đăng ký/);
  assert.doesNotMatch(markup, /Chọn nhóm sinh hoạt/);
  assert.doesNotMatch(markup, /Địa chỉ \/ Phường/);
});

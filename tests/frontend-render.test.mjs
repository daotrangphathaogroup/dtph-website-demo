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
const { default: QuickSearch } = await import("../src/components/QuickSearch.tsx");
const { default: PublicShell } = await import("../src/components/PublicShell.tsx");
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
    assert.equal(markup.includes('aria-label="Tìm kiếm nhanh"'), !!role);
    assert.equal(markup.includes('app-shell sidebar-collapsed'), !role);
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
test("Public forms remove retired fields and hide child occupations and referrals", () => {
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
    assert.doesNotMatch(markup, /Quê quán|Nơi công tác|Trường học/);
    if(group==='children'){
      assert.doesNotMatch(markup,/Nghề nghiệp|Người giới thiệu|HĐ chăm sóc/);
      assert.match(markup,/Lớp/);assert.match(markup,/value="12"/);assert.match(markup,/value="Không"/);
    }
    for (const field of defaultSchemas[group].fields.filter((f) => f.staffOnly))
      assert.doesNotMatch(markup, new RegExp(`id="[^\"]*-${field.key}"`));
    assert.equal(markup.includes('type="password"'), false);
    assert.equal(markup.includes('value="Khác"'), group!=='children');
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
    assert.doesNotMatch(markup,/Nghề nghiệp|Người giới thiệu|Quê quán|Nơi công tác/);
    assert.match(markup,/HĐ chăm sóc/);assert.match(markup,/Lớp/);
    assert.match(markup, /Tùy chỉnh bảng/);
    assert.match(markup, /Xuất Excel/);
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
        registrationMatches: new Map([[m.id, [{member: member(2), reason: "Trùng họ tên, trùng ngày sinh", likely: true}]]]),
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
    assert.match(pending, /Có thể trùng hồ sơ/);
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
  assert.match(markup, /Xuất Excel/);
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

test("Overview keeps working filters and member table alongside the two summary charts", () => {
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
  for (const label of ['Hồ sơ đã duyệt','Đăng ký chờ duyệt','Cơ cấu 3 chúng','Chúng thiếu nhi','Chúng thanh niên','Đạo tràng']) assert.ok(markup.includes(label), label);
  assert.match(markup, /Không có phiếu chờ duyệt/);
  for (const control of ['Bộ lọc tổng quan','Lọc công việc','Xuất Excel']) assert.ok(markup.includes(control), control);
  assert.doesNotMatch(markup, /Tổ × Chúng|Phân công cho HĐ chăm sóc|Địa chỉ \(mới\) × Chúng/);
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
  assert.doesNotMatch(markup, /Địa chỉ \(cũ\)/);
});

test('Member profile displays stored core columns when profileData is incomplete', () => {
 const m={...member(1),name:'Hồ sơ dữ liệu cũ',birthday:'2001-03-04',phone:'0909876543',address:'Tân Phong',avatar:'/api/avatars/example.webp',team:2,profileData:{dharmaName:'Tâm An'}};
 const markup=render(h(MemberProfileDialog,{member:m,schema:defaultSchemas.youth,editing:false,canEdit:false,approving:false,onClose:noop,onEdit:noop,onApprove:noop,onSave:async()=>{}}));
 for(const expected of ['<dd>Hồ sơ dữ liệu cũ</dd>','<dd>04/03/2001</dd>','<dd>0909876543</dd>','<dd>Tân Phong</dd>','<dd>Tổ 2</dd>','<dd>Tâm An</dd>'])assert.ok(markup.includes(expected),`Missing profile value: ${expected}`);
});

test('Every group profile shows all configured information including staff fields, zero and linked names', () => {
 for(const group of ['children','youth','congregation']) {
  const schema=defaultSchemas[group];
  const profileData=Object.fromEntries(schema.fields.map(f=>[f.key, f.key==='team'?2:f.key==='birthday'?'2000-03-04':f.key==='status'?['tinh-tan','hoa-dong']:`Thông tin ${f.key}`]));
  profileData.notes='Dòng một\nDòng hai';
  profileData.introducedBy='PH2';
  profileData.caregiver='PH3';
  const m={...member(1),group,profileData,references:{introducedBy:{id:'PH2',name:'Người giới thiệu A'},caregiver:{id:'PH3',name:'Huynh đệ chăm sóc B'}}};
  const markup=render(h(MemberProfileDialog,{member:m,schema,editing:false,canEdit:false,approving:false,onClose:noop,onEdit:noop,onApprove:noop,onSave:async()=>{}}));
  assert.equal((markup.match(/<dt>/g)||[]).length,schema.fields.filter(f=>f.type!=='image').length);
  assert.match(markup,/Người giới thiệu A/);
  assert.match(markup,/Dòng một\nDòng hai/);
  assert.match(markup,/Tinh tấn/);assert.match(markup,/Hòa đồng/);
  if(group==='children'){assert.match(markup,/Thông tin nickname/);assert.doesNotMatch(markup,/Thông tin personality/);assert.match(markup,/Thông tin parentName/);}
  else {assert.match(markup,/Huynh đệ chăm sóc B/);assert.match(markup,/Thông tin position/);}
 }
});

test("Quick search keeps its accessible entry and empty-query guidance", () => {
  const markup = render(h(QuickSearch, {members: [member(1)], onOpen: noop}));
  assert.match(markup, /Tìm tên, pháp danh, mã số hoặc SĐT/);
  assert.match(markup, /Nhập ít nhất 2 ký tự/);
  assert.doesNotMatch(markup, /Đang tìm kiếm|Xem hồ sơ/);
});
test("Public shell preserves home navigation and optional hidden navigation", () => {
  const markup = render(h(PublicShell, null, h("p", null, "Content")));
  assert.match(markup, /Điều hướng chính/);
  assert.match(markup, /id="public-content"/);
  assert.doesNotMatch(render(h(PublicShell, {hideNavigation:true}, "Content")), /Điều hướng chính/);
});

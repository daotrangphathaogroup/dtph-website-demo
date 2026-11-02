"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import WorkspaceShell from "./components/layout/WorkspaceShell";
import type { WorkspacePage } from "./components/layout/WorkspaceShell";
import {
  Feedback,
  FeatureSkeleton,
  PageHeader,
} from "./components/ui/primitives";

import PendingRegistrations from "./features/members/PendingRegistrations";
import { emptyState, usePortalData } from "./hooks/usePortalData";
import { defaultSchemas } from "./lib/registration";
import type { ProfileValues } from "./lib/registration";
import { api } from "./lib/api";
import type { Member, MemberGroup } from "./lib/types";
import { groupLabels } from "./lib/types";

const RegistrationIntake = dynamic(
  () => import("./features/registration/RegistrationIntake"),
  { loading: () => <FeatureSkeleton /> },
);
const loading = () => <FeatureSkeleton />;
const ManagementDashboard = dynamic(
  () => import("./components/ManagementDashboard"),
  { loading },
);
const StaffAccounts = dynamic(() => import("./components/StaffAccounts"), {
  loading,
});
const ChangePassword = dynamic(() => import("./components/ChangePassword"), {
  loading,
});
const QuickSearch = dynamic(() => import("./components/QuickSearch"), {
  loading,
});
const MemberProfileDialog = dynamic(
  () => import("./features/members/MemberProfileDialog"),
  {
    loading: () => null,
  },
);
const titles = {
  dashboard: "Tổng quan",
  overview: "Đăng ký thông tin",
  search: "Tìm kiếm nhanh",
  members: "Huynh đệ",
  accounts: "Quản lý tài khoản",
  password: "Đổi mật khẩu",
};
export default function App({
  initialPage,
}: { initialPage?: WorkspacePage } = {}) {
  const portal = usePortalData();
  const {
    data,
    setData,
    error,
    loading: booting,
    updatedAt,
    refresh,
    invalidate,
  } = portal;
  const [page, setPage] = useState<WorkspacePage>(initialPage ?? "overview"),
    [group, setGroup] = useState<MemberGroup>("children");
  const [detail, setDetail] = useState<Member | null>(null),
    [editing, setEditing] = useState(false),
    [rejecting, setRejecting] = useState<Member | null>(null);
  const [notice, setNotice] = useState(""),
    [saving, setSaving] = useState<Set<string>>(new Set());
  const initialRoute = useRef(false),
    pending = useRef(new Set<string>());
  const staff = data.session,
    admin = staff?.role === "admin" || staff?.role === "dev";
  const schemas = useMemo(
    () => ({ ...defaultSchemas, ...data.schemas }),
    [data.schemas],
  );
  const waiting = useMemo(() => {
    const count = { children: 0, youth: 0, congregation: 0 };
    for (const m of data.pendingRegistrations ?? []) count[m.group]++;
    return count;
  }, [data.pendingRegistrations]);
  useEffect(() => {
    if (booting || error || initialRoute.current) return;
    initialRoute.current = true;
    if (data.session && !initialPage) setPage("dashboard");
  }, [booting, error, data.session, initialPage]);
  function markSaving(key: string, busy: boolean) {
    setSaving((old) => {
      const next = new Set(old);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }
  async function approve(member: Member) {
    const key = "review:" + member.id;
    if (pending.current.has(key)) return;
    pending.current.add(key);
    markSaving(key, true);
    try {
      const result = await api<{ member: Member }>(
        `/registrations/${member.id}/approve`,
        "POST",
        {},
      );
      invalidate();
      setData((d) => ({
        ...d,
        pendingRegistrations: d.pendingRegistrations?.filter(
          (m) => m.id !== member.id,
        ),
        store: {
          ...d.store,
          members: [
            result.member,
            ...d.store.members.filter((m) => m.id !== member.id),
          ],
        },
      }));
      if (detail?.id === member.id) setDetail(result.member);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      pending.current.delete(key);
      markSaving(key, false);
    }
  }
  async function reject(member: Member) {
    const key = "review:" + member.id;
    if (pending.current.has(key)) return;
    pending.current.add(key);
    markSaving(key, true);
    try {
      await api(`/registrations/${member.id}/reject`, "POST", {});
      invalidate();
      setData((d) => ({
        ...d,
        pendingRegistrations: d.pendingRegistrations?.filter(
          (m) => m.id !== member.id,
        ),
      }));
      setRejecting(null);
      if (detail?.id === member.id) setDetail(null);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      pending.current.delete(key);
      markSaving(key, false);
    }
  }
  async function saveProfile(profileData: ProfileValues) {
    if (!detail) return;
    const result = await api<{ member: Member }>(
      `/members/${detail.id}`,
      "PATCH",
      { profileData },
    );
    invalidate();
    setData((d) => ({
      ...d,
      store: {
        ...d.store,
        members: d.store.members.map((m) =>
          m.id === result.member.id ? result.member : m,
        ),
      },
      pendingRegistrations: d.pendingRegistrations?.map((m) =>
        m.id === result.member.id ? result.member : m,
      ),
    }));
    setDetail(result.member);
    setEditing(false);
  }
  async function logout() {
    try {
      await api("/admin/logout", "POST");
      invalidate();
      setData(emptyState);
      setDetail(null);
      setPage("overview");
      setNotice("");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  const refreshWithNotice = async () => {
    try {
      await refresh();
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  function navigate(next: WorkspacePage, nextGroup?: MemberGroup) {
    if (nextGroup) setGroup(nextGroup);
    setPage(next);
  }
  function openProfile(member: Member, edit: boolean) {
    setDetail(member);
    setEditing(edit);
  }
  const heading = page === "members" ? groupLabels[group] : titles[page];
  const description =
    page === "overview"
      ? "Thông tin sinh hoạt và tu học của Đạo Tràng."
      : page === "dashboard"
        ? "Thống kê và quản lý huynh đệ toàn Đạo Tràng."
        : page === "members"
          ? `Thống kê và hồ sơ ${groupLabels[group].toLocaleLowerCase("vi")}.`
          : page === "accounts"
            ? "Tạo tài khoản và quản lý quyền truy cập của nhân sự."
            : undefined;
  return (
    <WorkspaceShell
      page={page}
      group={group}
      staff={staff}
      waiting={waiting}
      onNavigate={navigate}
      onLogout={() => void logout()}
    >
      <div className={page === "overview" ? "intake-page-heading" : undefined}>
        <PageHeader
          title={heading}
          description={
            page === "dashboard" || page === "members" || page === "overview"
              ? undefined
              : description
          }
          actions={
            data.demoData && (page === "dashboard" || page === "members") ? (
              <span
                className="demo-data-label"
                title="Hồ sơ và ảnh giả lập trên local"
              >
                Dữ liệu mẫu
              </span>
            ) : undefined
          }
        />
      </div>
      {error && (
        <Feedback
          action={
            <button
              className="text-button"
              onClick={() => void refreshWithNotice()}
            >
              Thử lại
            </button>
          }
        >
          {error}
        </Feedback>
      )}
      {notice && <Feedback onDismiss={() => setNotice("")}>{notice}</Feedback>}
      {booting ? (
        <FeatureSkeleton />
      ) : (
        <>
          {page === "overview" && (
            <RegistrationIntake
              isStaff={!!staff}
              onRegistered={() => void refreshWithNotice()}
            />
          )}
          {page === "search" && <QuickSearch members={staff ? data.store.members : undefined} onOpen={staff ? member => openProfile(member, false) : undefined} />}
          {page === "accounts" && staff?.role === "dev" && <StaffAccounts />}
          {page === "password" && staff && (
            <ChangePassword
              onChanged={() => {
                invalidate();
                setData(emptyState);
                setDetail(null);
                setPage("overview");
                window.location.assign("/quan-tri");
              }}
            />
          )}
          {(page === "dashboard" || page === "members") && staff && (
            <ManagementDashboard
              key={page === "members" ? group : "all"}
              scope={page === "members" ? group : undefined}
              members={data.store.members}
              pending={data.pendingRegistrations ?? []}
              schemas={schemas}
              canEdit={admin}
              onOpen={openProfile}
              pendingPanel={(members) => (
                <PendingRegistrations
                  members={members}
                  canApprove={admin}
                  saving={saving}
                  rejecting={rejecting}
                  onView={(m) => openProfile(m, false)}
                  onApprove={(m) => void approve(m)}
                  onRejectRequest={setRejecting}
                  onReject={(m) => void reject(m)}
                  onRefresh={() => void refreshWithNotice()}
                />
              )}
              lastUpdated={updatedAt}
              onRefresh={refreshWithNotice}
            />
          )}
        </>
      )}
      {detail && (
        <MemberProfileDialog
          member={detail}
          schema={schemas[detail.group]}
          editing={editing}
          canEdit={admin}
          approving={saving.has("review:" + detail.id)}
          onClose={() => setDetail(null)}
          onEdit={setEditing}
          onApprove={() => void approve(detail)}
          onSave={saveProfile}
        />
      )}
    </WorkspaceShell>
  );
}

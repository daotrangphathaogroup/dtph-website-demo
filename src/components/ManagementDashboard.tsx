"use client";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  List,
  Clock3,
  Users,
  Flower2,
  Leaf,
  Baby,
  ArrowDown,
} from "lucide-react";
import { EmptyState } from "./ui/primitives";
import type { Member, MemberGroup } from "../lib/types";
import type { RegistrationSchema } from "../lib/registration";
import { groupLabels } from "../lib/types";
import { wards } from "../lib/areas";
import {
  distribution,
  emptyDashboardFilters,
  filterDashboard,
  memberTeam,
  memberWard,
  monthlyRegistrations,
  registrationDate,
  todayInVietnam,
} from "../lib/dashboard";
import type { DashboardFilters as Filters } from "../lib/dashboard";
import OverviewFilters from "../features/dashboard/OverviewFilters";
import DashboardFilters from "../features/dashboard/DashboardFilters";
import DashboardCharts from "../features/dashboard/DashboardCharts";
import type { Dimension } from "../features/dashboard/DashboardCharts";
import DashboardMemberList from "../features/dashboard/DashboardMemberList";
type Props = {
  members: Member[];
  pending: Member[];
  schemas: Record<MemberGroup, RegistrationSchema>;
  scope?: MemberGroup;
  canEdit: boolean;
  onOpen: (m: Member, edit: boolean) => void;
  pendingPanel: (members: Member[]) => ReactNode;
  lastUpdated: string;
  onRefresh: () => Promise<void>;
};
const groupOrder: MemberGroup[] = ["congregation", "youth", "children"];
export default function ManagementDashboard({
  members,
  pending,
  schemas,
  scope,
  canEdit,
  onOpen,
  pendingPanel,
  lastUpdated,
  onRefresh,
}: Props) {
  const [filters, setFilters] = useState<Filters>({ ...emptyDashboardFilters }),
    [dimension, setDimension] = useState<Dimension>("ward"),
    [refreshing, setRefreshing] = useState(false),
    [resets, setResets] = useState({ page: 0, query: 0 });
  const [view, setView] = useState<"list" | "pending" | "statistics">("list");
  const [showPending, setShowPending] = useState(false);
  const pendingRef = useRef<HTMLDivElement>(null);
  const asOf = todayInVietnam();
  const effectiveGroup =
    scope ?? (filters.group !== "all" ? filters.group : undefined);
  const approved = useMemo(
    () => filterDashboard(members, filters, scope, asOf),
    [members, filters, scope, asOf],
  );
  const waiting = useMemo(
    () => filterDashboard(pending, filters, scope, asOf),
    [pending, filters, scope, asOf],
  );
  const source = useMemo(
    () => [...members, ...pending].filter((m) => !scope || m.group === scope),
    [members, pending, scope],
  );
  const years = useMemo(
    () =>
      Array.from(
        new Set([
          new Date().getFullYear().toString(),
          ...source.map((m) => registrationDate(m).slice(0, 4)).filter(Boolean),
        ]),
      )
        .sort()
        .reverse(),
    [source],
  );
  const wardOptions = useMemo(
    () =>
      Array.from(
        new Set([...wards, ...source.map(memberWard).filter(Boolean)]),
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [source],
  );
  const composition = useMemo(() => {
    const items = scope
      ? [1, 2, 3].map((team) => ({
          label: `Tổ ${team}`,
          count: approved.filter((m) => memberTeam(m) === String(team)).length,
        }))
      : groupOrder.map((group) => ({
          label: groupLabels[group],
          count: approved.filter((m) => m.group === group).length,
        }));
    if (scope && approved.some((m) => !["1", "2", "3"].includes(memberTeam(m))))
      items.push({
        label: "Chưa phân tổ",
        count: approved.filter((m) => !["1", "2", "3"].includes(memberTeam(m)))
          .length,
      });
    return items;
  }, [approved, scope]);
  const bars = useMemo(
      () => distribution(approved, dimension, asOf),
      [approved, dimension, asOf],
    ),
    months = useMemo(() => monthlyRegistrations(approved), [approved]);
  const total = approved.length;
  function change<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setResets((r) => ({ ...r, page: r.page + 1 }));
  }
  function reset() {
    setFilters({ ...emptyDashboardFilters });
    setResets((r) => ({ page: r.page + 1, query: r.query + 1 }));
  }
  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }
  const period =
    filters.year === "all"
      ? filters.month === null
        ? "Mọi thời điểm"
        : `Tháng ${filters.month}, tất cả các năm`
      : filters.month === null
        ? `Cả năm ${filters.year}`
        : `Tháng ${filters.month}/${filters.year}`;
  return (
    <div
      className={`management-dashboard ${!scope ? "overview-dashboard" : ""}`}
    >
      {!scope ? (
        <OverviewFilters
          filters={filters}
          wardOptions={wardOptions}
          years={years}
          period={period}
          refreshing={refreshing}
          onChange={change}
          onReset={reset}
          onRefresh={() => void refresh()}
        />
      ) : (
        <DashboardFilters
          filters={filters}
          scope={scope}
          wardOptions={wardOptions}
          years={years}
          period={period}
          refreshing={refreshing}
          onChange={change}
          onReset={reset}
          onRefresh={() => void refresh()}
        />
      )}
      {!scope && (
        <div className="overview-metrics" aria-label="Số liệu tổng quan">
          {[
            { label: "Tổng huynh đệ", value: total, Icon: Users },
            ...composition.map((item, i) => ({
              ...item,
              value: item.count,
              Icon: [Flower2, Leaf, Baby][i],
            })),
          ].map(({ label, value, Icon }) => (
            <section className="overview-metric" key={label}>
              <div>
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </div>
              <strong>{value.toLocaleString("vi-VN")}</strong>
            </section>
          ))}
          <button
            className="overview-metric overview-pending-metric"
            disabled={!waiting.length}
            onClick={() => {
              setShowPending(true);
              requestAnimationFrame(() =>
                pendingRef.current?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                  block: "start",
                }),
              );
              pendingRef.current?.focus({ preventScroll: true });
            }}
          >
            <div>
              <Clock3 size={16} />
              <span>Chờ duyệt</span>
            </div>
            <strong>{waiting.length}</strong>
            <ArrowDown className="metric-arrow" size={15} />
          </button>
        </div>
      )}
      {scope && (
        <>
          <div className="management-summary" aria-label="Hồ sơ theo bộ lọc">
            <span>
              <strong>{total.toLocaleString("vi-VN")}</strong> hồ sơ đã duyệt
            </span>
            {composition.map((item) => (
              <span key={item.label}>
                {item.label} <b>{item.count}</b>
              </span>
            ))}
          </div>
          <nav className="management-views" aria-label="Chế độ quản lý">
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List size={16} />
              Danh sách <span>{total}</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "pending"}
              onClick={() => setView("pending")}
            >
              <Clock3 size={16} />
              Chờ duyệt{" "}
              <span className={waiting.length ? "pending-count" : ""}>
                {waiting.length}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={view === "statistics"}
              onClick={() => setView("statistics")}
            >
              <BarChart3 size={16} />
              Thống kê
            </button>
          </nav>
        </>
      )}
      {(!scope || view === "statistics") && (
        <div className="statistics-view">
          <DashboardCharts
            scope={scope}
            total={total}
            composition={composition}
            bars={bars}
            months={months}
            month={filters.month}
            period={period}
            dimension={dimension}
            onDimension={setDimension}
          />
        </div>
      )}
      {(!scope ? waiting.length > 0 : view === "pending") && (
        <div ref={pendingRef} tabIndex={-1} className="dashboard-pending">
          {waiting.length ? (
            scope ? (
              pendingPanel(waiting)
            ) : (
              <details
                open={showPending}
                onToggle={(e) => setShowPending(e.currentTarget.open)}
                className="overview-review-disclosure"
              >
                <summary>
                  <span>{waiting.length} đăng ký chờ duyệt</span>
                  <span>Xem đăng ký</span>
                </summary>
                {pendingPanel(waiting)}
              </details>
            )
          ) : (
            <EmptyState
              title="Không có đăng ký chờ duyệt"
              description="Các đăng ký mới phù hợp với bộ lọc sẽ hiển thị tại đây."
            />
          )}
        </div>
      )}
      <div hidden={!!scope && view !== "list"}>
        {!scope && (
          <h2 className="overview-list-title">
            Danh sách huynh đệ{" "}
            <span>{total.toLocaleString("vi-VN")} hồ sơ</span>
          </h2>
        )}
        <DashboardMemberList
          members={approved}
          hasMembers={members.length > 0}
          schemas={schemas}
          scope={scope}
          effectiveGroup={effectiveGroup}
          canEdit={canEdit}
          asOf={asOf}
          lastUpdated={lastUpdated}
          onOpen={onOpen}
          queryReset={resets.query}
          pageReset={resets.page}
        />
      </div>
    </div>
  );
}

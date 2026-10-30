"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  List,
  Pencil,
  Table2,
} from "lucide-react";
import type { Member, MemberGroup } from "../../lib/types";
import { groupLabels } from "../../lib/types";
import type { ProfileField, RegistrationSchema } from "../../lib/registration";
import { memberAge, memberTeam, memberWard } from "../../lib/dashboard";
import { sheetCsv, sheetText } from "../../lib/sheet";
import Pagination from "../../components/ui/Pagination";
import {
  Button,
  EmptyState,
  FeatureSkeleton,
  IconButton,
  SearchField,
  SegmentedControl,
} from "../../components/ui/primitives";
const MemberDataTable = dynamic(
  () => import("../../components/MemberDataTable"),
  {
    loading: () => <FeatureSkeleton />,
  },
);
const compactFields: ProfileField[] = [
  { key: "name", label: "Họ và tên", type: "text", required: false },
  { key: "dharmaName", label: "Pháp danh", type: "text", required: false },
  { key: "groupLabel", label: "Nhóm", type: "text", required: false },
  { key: "age", label: "Tuổi", type: "number", required: false },
  { key: "address", label: "Phường", type: "text", required: false },
  { key: "team", label: "Tổ", type: "team", required: false },
];
type Props = {
  members: Member[];
  hasMembers: boolean;
  schemas: Record<MemberGroup, RegistrationSchema>;
  scope?: MemberGroup;
  effectiveGroup?: MemberGroup;
  canEdit: boolean;
  asOf: string;
  lastUpdated: string;
  onOpen: (m: Member, edit: boolean) => void;
  queryReset: number;
  pageReset: number;
};
export default function DashboardMemberList({
  members,
  hasMembers,
  schemas,
  scope,
  effectiveGroup,
  canEdit,
  asOf,
  lastUpdated,
  onOpen,
  queryReset,
  pageReset,
}: Props) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [size, setSize] = useState(25),
    [sort, setSort] = useState({ key: "name", direction: 1 }),
    [view, setView] = useState<"summary" | "sheet">("summary");
  const [previousReset, setPreviousReset] = useState({
    query: queryReset,
    page: pageReset,
  });
  if (previousReset.query !== queryReset || previousReset.page !== pageReset) {
    setPreviousReset({ query: queryReset, page: pageReset });
    setPage(1);
    if (previousReset.query !== queryReset) setQuery("");
  }
  const searched = useMemo(() => {
    const words = sheetText(query).trim().split(/\s+/).filter(Boolean);
    return members
      .filter((m) =>
        words.every((w) =>
          sheetText(
            `${m.name} ${m.profileData?.dharmaName ?? ""} ${m.id} ${memberWard(m)}`,
          ).includes(w),
        ),
      )
      .sort((a, b) => {
        if (sort.key === "age") {
          const x = memberAge(a, asOf),
            y = memberAge(b, asOf);
          return x === null
            ? y === null
              ? 0
              : 1
            : y === null
              ? -1
              : (x - y) * sort.direction;
        }
        const text = (m: Member) =>
          sort.key === "ward"
            ? memberWard(m)
            : sort.key === "group"
              ? groupLabels[m.group]
              : sort.key === "dharmaName"
                ? String(m.profileData?.dharmaName ?? "")
                : m.name;
        return (
          text(a).localeCompare(text(b), "vi", {
            numeric: true,
            sensitivity: "base",
          }) * sort.direction
        );
      });
  }, [members, query, sort, asOf]);
  const pages = Math.max(1, Math.ceil(searched.length / size)),
    activePage = Math.min(page, pages),
    rows = searched.slice((activePage - 1) * size, activePage * size);
  function exportList() {
    const exported = searched.map((m) => ({
      ...m,
      profileData: {
        ...m.profileData,
        name: m.name,
        groupLabel: groupLabels[m.group],
        age: memberAge(m, asOf) ?? "",
        address: memberWard(m),
        team: memberTeam(m),
      },
    }));
    const url = URL.createObjectURL(
      new Blob([sheetCsv(exported, compactFields)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scope ?? "tong-quan"}-huynh-de.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="dashboard-card dashboard-list">
      {effectiveGroup && (
        <header className="dashboard-list-heading">
          <SegmentedControl
            label="Kiểu danh sách"
            value={view}
            onChange={(v) => {
              setView(v);
              if (v === "sheet") {
                setQuery("");
                setPage(1);
              }
            }}
            items={[
              {
                value: "summary",
                label: (
                  <>
                    <List size={14} />
                    Tổng hợp
                  </>
                ),
              },
              {
                value: "sheet",
                label: (
                  <>
                    <Table2 size={14} />
                    Bảng dữ liệu
                  </>
                ),
              },
            ]}
          />
        </header>
      )}
      {view === "sheet" && effectiveGroup ? (
        <MemberDataTable
          key={effectiveGroup}
          schema={schemas[effectiveGroup]}
          members={members}
          canEdit={canEdit}
          onOpen={onOpen}
        />
      ) : (
        <>
          <div className="dashboard-list-tools">
            <SearchField
              label="Tìm trong danh sách huynh đệ"
              placeholder="Tìm tên, pháp danh, ID…"
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
            />
            <Button
              variant="secondary"
              disabled={!searched.length}
              onClick={exportList}
            >
              <Download size={16} />
              Tải danh sách
              <span className="button-count">{searched.length}</span>
            </Button>
          </div>
          <div
            className="dashboard-table-scroll"
            tabIndex={0}
            aria-label="Danh sách thống kê"
          >
            <table className="dashboard-table">
              <caption className="sr-only">
                Danh sách huynh đệ theo bộ lọc đang chọn
              </caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {[
                    ["name", "Họ tên"],
                    ["dharmaName", "Pháp danh"],
                    ["group", "Nhóm"],
                    ["age", "Tuổi"],
                    ["ward", "Phường"],
                  ].map(([key, label]) => (
                    <th
                      scope="col"
                      key={key}
                      aria-sort={
                        sort.key === key
                          ? sort.direction === 1
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        onClick={() => {
                          setSort((s) => ({
                            key,
                            direction: s.key === key ? -s.direction : 1,
                          }));
                          setPage(1);
                        }}
                      >
                        {label}
                        {sort.key === key ? (
                          sort.direction === 1 ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          )
                        ) : (
                          <ArrowUpDown size={13} />
                        )}
                      </button>
                    </th>
                  ))}
                  <th scope="col">Tổ</th>
                  <th scope="col">Hồ sơ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => (
                  <tr key={m.id}>
                    <td>{(activePage - 1) * size + i + 1}</td>
                    <td>
                      <button
                        className="table-person"
                        onClick={() => onOpen(m, false)}
                      >
                        {m.avatar && (
                          <img
                            src={m.avatar}
                            alt=""
                            width={28}
                            height={36}
                            loading="lazy"
                          />
                        )}
                        <span>{m.name}</span>
                      </button>
                    </td>
                    <td>
                      {m.profileData?.dharmaName || (
                        <span className="cell-missing">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`dashboard-group ${m.group}`}>
                        <i aria-hidden="true" />
                        {groupLabels[m.group]}
                      </span>
                    </td>
                    <td>{memberAge(m, asOf) ?? "—"}</td>
                    <td>{memberWard(m) || "—"}</td>
                    <td>{memberTeam(m) ? `Tổ ${memberTeam(m)}` : "—"}</td>
                    <td>
                      <div className="row-actions">
                        <IconButton
                          label={`Xem hồ sơ ${m.name}`}
                          onClick={() => onOpen(m, false)}
                        >
                          <Eye size={17} />
                        </IconButton>
                        {canEdit && (
                          <IconButton
                            label={`Chỉnh sửa ${m.name}`}
                            onClick={() => onOpen(m, true)}
                          >
                            <Pencil size={16} />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <EmptyState
                title={
                  hasMembers
                    ? "Không có hồ sơ phù hợp"
                    : "Chưa có hồ sơ đã duyệt"
                }
                description={
                  hasMembers
                    ? "Thử điều chỉnh từ khóa hoặc bộ lọc."
                    : "Các đăng ký mới sẽ xuất hiện sau khi được duyệt."
                }
              />
            )}
          </div>
          <Pagination
            page={activePage}
            pages={pages}
            total={searched.length}
            size={size}
            onPage={setPage}
            onSize={(v) => {
              setSize(v);
              setPage(1);
            }}
            syncedAt={lastUpdated}
          />
        </>
      )}
    </section>
  );
}

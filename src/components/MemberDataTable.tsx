"use client";
import { ArrowDown, ArrowUp, ChevronsUpDown, Eye, Pencil, Table2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {groupLabels} from '../lib/types';
import type { Member, MemberGroup } from "../lib/types";
import type { RegistrationSchema } from "../lib/registration";
import { displayValue } from "../lib/registration";
import { sheetValue } from "../lib/sheet";
import { useMemberSheet } from "../hooks/useMemberSheet";
import MemberSheetToolbar from "../features/members/MemberSheetToolbar";
import type {SheetScopeFilter} from '../features/members/sheet-types';
import Pagination from "./ui/Pagination";
import ActivityStatus from "./ActivityStatus";
import { EmptyState, IconButton } from "./ui/primitives";
function columnLetter(index: number) {
  let label = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    label = String.fromCharCode(65 + (n - 1) % 26) + label;
  return label;
}
export default function MemberDataTable({
  members,
  schema,
  canEdit,
  onOpen,
  preferenceScope,
  label,
  sheetScope,
}: {
  members: Member[];
  schema: RegistrationSchema;
  canEdit: boolean;
  preferenceScope?: string;
  label?: string;
  sheetScope?: SheetScopeFilter;
  onOpen: (member: Member, edit: boolean) => void;
}) {
  const sheet = useMemberSheet(members, schema, preferenceScope);
  const [expanded, setExpanded] = useState(false);
  const fullscreenDialog = useRef<HTMLDialogElement>(null);
  const tableSection = useRef<HTMLElement>(null);
  function toggleFullscreen() {
    if (!expanded && sheetScope) {
      const team = sheet.filters.team;
      const group = (Object.keys(groupLabels) as MemberGroup[]).find(key => groupLabels[key] === sheet.filters.groupLabel);
      if (group) sheetScope.onGroupChange?.(group);
      if (team) sheetScope.onTeamChange(team === '__empty' ? 'unknown' : team);
      sheet.setFilters(old => {const next = {...old}; delete next.team; delete next.groupLabel; return next;});
    }
    setExpanded(!expanded);
  }
  useEffect(() => {
    if (!expanded) return;
    const dialog = fullscreenDialog.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      tableSection.current?.querySelector<HTMLButtonElement>("[data-sheet-fullscreen]")?.focus({ preventScroll: true });
    };
  }, [expanded]);
  const content = (
    <section
      ref={tableSection}
      className={`sheet sheet-${sheet.prefs.density}`}
      aria-label="Bảng dữ liệu huynh đệ"
    >
      {expanded && <header className="sheet-workspace-heading">
        <span className="sheet-workspace-icon"><Table2 size={21} aria-hidden="true" /></span>
        <div><h2>{label ?? "Hồ sơ huynh đệ"}</h2><p>Bảng dữ liệu</p></div>
        <span className="sheet-workspace-hint"><kbd>Esc</kbd> để thu nhỏ</span>
      </header>}
      <MemberSheetToolbar sheet={sheet} expanded={expanded} sheetScope={sheetScope} onToggleFullscreen={toggleFullscreen} />
      <div className="sheet-scroll" tabIndex={0} aria-label="Cuộn bảng dữ liệu">
        <table
          className="sheet-table"
          style={{
            width:
              192 +
              sheet.visible.reduce((total, f) => total + sheet.width(f.key), 0),
          }}
        >
          <caption className="sr-only">
            Bảng dữ liệu{" "}
            {label ??
              (schema.group === "children"
                ? "Chúng thiếu nhi"
                : schema.group === "youth"
                  ? "Chúng thanh niên"
                  : "Đạo tràng")}
          </caption>
          <colgroup>
            <col style={{ width: 42 }} />
            <col style={{ width: 54 }} />
            {sheet.visible.map((f) => (
              <col key={f.key} style={{ width: sheet.width(f.key) }} />
            ))}
            <col style={{ width: 96 }} />
          </colgroup>
          <thead>
            {expanded && <tr className="sheet-column-letters" aria-hidden="true">
              <th className="sheet-check" /><th className="sheet-number">#</th>
              {sheet.visible.map((field, index) => <th key={field.key} className={field.key === 'name' ? 'sheet-name' : ''}>{columnLetter(index)}</th>)}
              <th className="sheet-actions" />
            </tr>}
            <tr>
              <th className="sheet-check" scope="col">
                <input
                  ref={sheet.allCheckbox}
                  type="checkbox"
                  aria-label="Chọn tất cả dòng trên trang"
                  checked={
                    sheet.rows.length > 0 && sheet.checked === sheet.rows.length
                  }
                  disabled={!sheet.rows.length}
                  onChange={sheet.togglePage}
                />
              </th>
              <th className="sheet-number" scope="col">
                STT
              </th>
              {sheet.visible.map((f) => (
                <th
                  scope="col"
                  key={f.key}
                  className={f.key === "name" ? "sheet-name" : ""}
                  aria-sort={
                    sheet.sort.key === f.key
                      ? sheet.sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    className="sheet-sort"
                    onClick={() => {
                      sheet.setPage(1);
                      sheet.setSort({
                        key: f.key,
                        direction:
                          sheet.sort.key === f.key &&
                          sheet.sort.direction === "asc"
                            ? "desc"
                            : "asc",
                      });
                    }}
                    title={f.key === "name" ? "Sắp xếp theo tên gọi, rồi đến họ và tên đệm" : `Sắp xếp theo ${f.label}`}
                  >
                    <span>{f.label}</span>
                    {sheet.sort.key === f.key ? (
                      sheet.sort.direction === "asc" ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )
                    ) : (
                      <ChevronsUpDown size={13} />
                    )}
                  </button>
                  <span
                    className="column-resizer"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Độ rộng cột ${f.label}`}
                    aria-valuenow={sheet.width(f.key)}
                    aria-valuemin={120}
                    aria-valuemax={600}
                    tabIndex={0}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      sheet.resize(f.key, e.clientX);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.preventDefault();
                        sheet.setPrefs((old) => ({
                          ...old,
                          widths: {
                            ...old.widths,
                            [f.key]: Math.max(
                              120,
                              Math.min(
                                600,
                                sheet.width(f.key) +
                                  (e.key === "ArrowRight" ? 20 : -20),
                              ),
                            ),
                          },
                        }));
                      }
                    }}
                  />
                </th>
              ))}
              <th scope="col" className="sheet-actions">
                Hồ sơ
              </th>
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((m, index) => (
              <tr
                key={m.id}
                className={sheet.selected.has(m.id) ? "is-selected" : ""}
              >
                <td className="sheet-check">
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${m.name}`}
                    checked={sheet.selected.has(m.id)}
                    onChange={() => sheet.toggle(m.id)}
                  />
                </td>
                <td className="sheet-number">
                  {(sheet.page - 1) * sheet.size + index + 1}
                </td>
                {sheet.visible.map((f) => {
                  const value = sheetValue(m, f.key);
                  return (
                    <td
                      key={f.key}
                      className={
                        f.key === "name"
                          ? "sheet-name"
                          : value === undefined || value === ""
                            ? "sheet-missing"
                            : ""
                      }
                      title={f.key === "status" ? undefined : displayValue(value, f)}
                    >
                      {f.key === "name" ? (
                        <button
                          className="table-person"
                          onClick={() => onOpen(m, false)}
                        >
                          {m.avatar && (
                            <img
                              src={m.avatar}
                              width={24}
                              height={32}
                              loading="lazy"
                              alt=""
                            />
                          )}
                          <span>{String(value ?? m.name)}</span>
                        </button>
                      ) : f.key === "status" ? (
                        <ActivityStatus value={m.profileData?.status} compact name={m.name} />
                      ) : value === undefined || value === "" ? (
                        "—"
                      ) : (
                        displayValue(value, f)
                      )}
                    </td>
                  );
                })}
                <td className="sheet-actions">
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
        {!sheet.rows.length && (
          <EmptyState
            title="Không có hồ sơ phù hợp"
            description="Thử điều chỉnh tìm kiếm hoặc bộ lọc."
          />
        )}
      </div>
      <Pagination
        page={sheet.page}
        pages={sheet.pages}
        total={sheet.filtered.length}
        size={sheet.size}
        onPage={sheet.setPage}
        onSize={(size) => {
          sheet.setSize(size);
          sheet.setPage(1);
        }}
      />
    </section>
  );
  return expanded ? (
    <dialog
      ref={fullscreenDialog}
      className="sheet-fullscreen"
      aria-label={`Bảng dữ liệu toàn màn hình${label ? ` · ${label}` : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        setExpanded(false);
      }}
    >
      {content}
    </dialog>
  ) : content;
}

"use client";
import { ArrowDown, ArrowUp, ChevronsUpDown, Eye, Pencil } from "lucide-react";
import type { Member } from "../lib/types";
import type { RegistrationSchema } from "../lib/registration";
import { displayValue } from "../lib/registration";
import { sheetValue } from "../lib/sheet";
import { useMemberSheet } from "../hooks/useMemberSheet";
import MemberSheetToolbar from "../features/members/MemberSheetToolbar";
import Pagination from "./ui/Pagination";
import ActivityStatus from "./ActivityStatus";
import { EmptyState, IconButton } from "./ui/primitives";
export default function MemberDataTable({
  members,
  schema,
  canEdit,
  onOpen,
  preferenceScope,
  label,
}: {
  members: Member[];
  schema: RegistrationSchema;
  canEdit: boolean;
  preferenceScope?: string;
  label?: string;
  onOpen: (member: Member, edit: boolean) => void;
}) {
  const sheet = useMemberSheet(members, schema, preferenceScope);
  return (
    <section
      className={`sheet sheet-${sheet.prefs.density}`}
      aria-label="Bảng dữ liệu huynh đệ"
    >
      <MemberSheetToolbar sheet={sheet} />
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
                #
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
                    onClick={() =>
                      sheet.setSort({
                        key: f.key,
                        direction:
                          sheet.sort.key === f.key &&
                          sheet.sort.direction === "asc"
                            ? "desc"
                            : "asc",
                      })
                    }
                    title={f.label}
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
                      title={displayValue(value, f)}
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
                      ) : value === undefined || value === "" ? (
                        "—"
                      ) : f.key === "status" ? (
                        <ActivityStatus value={value} />
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
}

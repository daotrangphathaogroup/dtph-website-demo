import { useId, useRef } from "react";
import { Download, Filter, Maximize2, Minimize2, SlidersHorizontal, X } from "lucide-react";
import type { ReturnTypeOfSheet, SheetScopeFilter } from "./sheet-types";
import { displayValue } from "../../lib/registration";
import {groupLabels} from '../../lib/types';
import {teamsForGroup, teamOptionLabel} from '../../lib/areas';
import {
  Button,
  Feedback,
  IconButton,
  SearchField,
} from "../../components/ui/primitives";
export default function MemberSheetToolbar({
  sheet,
  expanded,
  onToggleFullscreen,
  sheetScope,
}: {
  sheet: ReturnTypeOfSheet;
  expanded: boolean;
  onToggleFullscreen: () => void;
  sheetScope?: SheetScopeFilter;
}) {
  const optionsRef = useRef<HTMLDetailsElement>(null),
    filterId = useId();
  const closeOptions = () => {
    if (optionsRef.current) {
      optionsRef.current.open = false;
      optionsRef.current.querySelector("summary")?.focus();
    }
  };
  const count = Object.values(sheet.filters).filter(Boolean).length;
  const directScope = expanded && sheetScope;
  return (
    <>
      <div className="sheet-toolbar">
        <SearchField
          label="Tìm trong bảng dữ liệu"
          placeholder="Tìm trong tất cả thông tin…"
          value={sheet.query}
          onChange={(v) => {
            sheet.setQuery(v);
            sheet.setPage(1);
          }}
        />
        <div className="sheet-tools">
          <Button
            variant="secondary"
            className={sheet.showFilters ? "selected" : ""}
            aria-expanded={sheet.showFilters}
            aria-controls={filterId}
            onClick={() => sheet.setShowFilters(!sheet.showFilters)}
          >
            <Filter size={16} />
            Bộ lọc{count > 0 && <span className="filter-count">{count}</span>}
          </Button>
          <details
            ref={optionsRef}
            className="sheet-options"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                closeOptions();
              }
            }}
          >
            <summary className="button secondary">
              <SlidersHorizontal size={16} />
              Tùy chỉnh bảng
            </summary>
            <div className="sheet-popover">
              <header className="popover-heading">
                <b>Tùy chỉnh bảng</b>
                <IconButton label="Đóng tùy chỉnh bảng" onClick={closeOptions}>
                  <X size={16} />
                </IconButton>
              </header>
              <label className="field">
                Mật độ hàng
                <select
                  aria-label="Mật độ hàng"
                  value={sheet.prefs.density}
                  onChange={(e) =>
                    sheet.setPrefs({ ...sheet.prefs, density: e.target.value })
                  }
                >
                  <option value="compact">Gọn</option>
                  <option value="standard">Tiêu chuẩn</option>
                  <option value="comfortable">Thoáng</option>
                </select>
              </label>
              <p className="eyebrow">CỘT HIỂN THỊ</p>
              {sheet.fields.map((f) => (
                <label className="column-option" key={f.key}>
                  <input
                    type="checkbox"
                    disabled={f.key === "name"}
                    checked={!sheet.prefs.hidden.includes(f.key)}
                    onChange={() =>
                      sheet.setPrefs((old) => ({
                        ...old,
                        hidden: old.hidden.includes(f.key)
                          ? old.hidden.filter((k) => k !== f.key)
                          : [...old.hidden, f.key],
                      }))
                    }
                  />
                  {f.label}
                </label>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  sheet.setPrefs({
                    hidden: [],
                    widths: {},
                    density: "standard",
                  })
                }
              >
                Khôi phục hiển thị
              </Button>
            </div>
          </details>
          <Button
            variant="secondary"
            disabled={!sheet.filtered.length && !sheet.selected.size}
            onClick={sheet.exportRows}
            busy={sheet.exporting}
          >
            <Download size={16} />
            {sheet.selected.size ? "Xuất Excel dòng đã chọn" : "Xuất Excel"}
          </Button>
          <Button
            variant="secondary"
            data-sheet-fullscreen
            aria-pressed={expanded}
            title={expanded ? "Thu nhỏ bảng (Esc)" : "Phóng to bảng toàn màn hình"}
            onClick={onToggleFullscreen}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {expanded ? "Thu nhỏ" : "Phóng to"}
          </Button>
        </div>
      </div>
      {directScope && <div className="sheet-scope-bar" aria-label="Phạm vi bảng dữ liệu">
        {sheetScope.onGroupChange && <div className="sheet-scope-control">
          <span>Chúng</span>
          <div role="group" aria-label="Lọc chúng trong bảng" className="sheet-scope-buttons sheet-group-buttons">
            {(['all', 'children', 'youth', 'congregation'] as const).map(group => <button
              key={group} type="button" data-group={group} aria-pressed={sheetScope.group === group}
              onClick={() => {
                sheet.setPage(1);
                sheetScope.onGroupChange?.(group);
              }}
            >{group === 'all' ? 'Cả ba chúng' : groupLabels[group]}</button>)}
          </div>
        </div>}
        <div className="sheet-scope-control">
          <span>Tổ</span>
          <div role="group" aria-label="Lọc tổ trong bảng" className="sheet-scope-buttons">
            {['all', ...teamsForGroup(sheetScope.group).map(String), 'unknown'].map(team => <button
              key={team} type="button" title={team === 'all' ? 'Tất cả tổ' : team === 'unknown' ? 'Chưa phân tổ' : teamOptionLabel(team)}
              aria-pressed={sheetScope.team === team}
              onClick={() => {
                sheet.setFilters(old => {const next = {...old}; delete next.team; return next;});
                sheet.setPage(1);
                sheetScope.onTeamChange(team);
              }}
            >{team === 'all' ? 'Tất cả' : team === 'unknown' ? 'Chưa phân tổ' : `Tổ ${team}`}</button>)}
          </div>
        </div>
      </div>}
      <div className="sheet-filters" id={filterId} hidden={!sheet.showFilters}>
        {sheet.filterFields.filter(f => !directScope || !['team', 'groupLabel'].includes(f.key)).map((f) => (
          <label className="field" key={f.key}>
            <span>{f.label}</span>
            <select
              aria-label={`Lọc ${f.label}`}
              value={sheet.filters[f.key] ?? ""}
              onChange={(e) => {
                sheet.setFilters({ ...sheet.filters, [f.key]: e.target.value });
                sheet.setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {sheet.filterOptions[f.key]?.map((v) => (
                <option key={v} value={v}>
                  {f.type==='tags'?String(v):displayValue(v, f)}
                </option>
              ))}
              <option value="__empty">{f.type === "tags" ? "Chưa gắn thẻ" : "Chưa có thông tin"}</option>
            </select>
          </label>
        ))}
        {count > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              sheet.setFilters({});
              sheet.setPage(1);
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
      {sheet.exportError && <Feedback>{sheet.exportError}</Feedback>}
      <div className="sheet-context">
        <span className="sheet-record-count">
          <strong>{sheet.filtered.length.toLocaleString("vi-VN")}</strong>{' '}
          <span>hồ sơ{sheet.query || count ? " phù hợp" : " trong danh sách"}</span>
        </span>
        {sheet.selected.size > 0 && (
          <span className="selection-status">
            <b>{sheet.selected.size} đã chọn</b>
            <button
              className="text-button"
              onClick={() => sheet.setSelected(new Set())}
            >
              Bỏ chọn
            </button>
          </span>
        )}
      </div>
    </>
  );
}

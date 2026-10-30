import { useId, useRef } from "react";
import { Download, Filter, SlidersHorizontal, X } from "lucide-react";
import type { ReturnTypeOfSheet } from "./sheet-types";
import { displayValue } from "../../lib/registration";
import {
  Button,
  IconButton,
  SearchField,
} from "../../components/ui/primitives";
export default function MemberSheetToolbar({
  sheet,
}: {
  sheet: ReturnTypeOfSheet;
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
            Lọc cột{count > 0 && <span className="filter-count">{count}</span>}
          </Button>
          <details
            ref={optionsRef}
            className="sheet-options"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeOptions();
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
          >
            <Download size={16} />
            {sheet.selected.size ? "Xuất dòng đã chọn" : "Xuất CSV"}
          </Button>
        </div>
      </div>
      <div className="sheet-filters" id={filterId} hidden={!sheet.showFilters}>
        {sheet.filterFields.map((f) => (
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
                  {displayValue(v, f)}
                </option>
              ))}
              <option value="__empty">Chưa cập nhật</option>
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
      <div className="sheet-context">
        <span>
          {sheet.filtered.length.toLocaleString("vi-VN")} hồ sơ
          {sheet.query || count ? " phù hợp" : " trong danh sách"}
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

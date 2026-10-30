"use client";
import { memo, useEffect, useId, useRef, useState } from "react";
import { Filter, RefreshCw, X, Check } from "lucide-react";
import { Button, IconButton } from "../../components/ui/primitives";
import { groupLabels } from "../../lib/types";
import type { MemberGroup } from "../../lib/types";
import { ageBands } from "../../lib/dashboard";
import type { DashboardFilters as Filters } from "../../lib/dashboard";
type Props = {
  filters: Filters;
  scope?: MemberGroup;
  wardOptions: string[];
  years: string[];
  period: string;
  refreshing: boolean;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  onRefresh: () => void;
};
function DashboardFilters({
  filters,
  scope,
  wardOptions,
  years,
  refreshing,
  onChange,
  onReset,
  onRefresh,
}: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    id = useId();
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLSelectElement>("select")?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const chips: { key: keyof Filters; label: string; clear: () => void }[] = [];
  if (!scope && filters.group !== "all")
    chips.push({
      key: "group",
      label: groupLabels[filters.group],
      clear: () => onChange("group", "all"),
    });
  if (filters.ward !== "all")
    chips.push({
      key: "ward",
      label: filters.ward === "unknown" ? "Chưa có phường" : filters.ward,
      clear: () => onChange("ward", "all"),
    });
  if (filters.team !== "all")
    chips.push({
      key: "team",
      label: filters.team === "unknown" ? "Chưa phân tổ" : `Tổ ${filters.team}`,
      clear: () => onChange("team", "all"),
    });
  if (filters.age !== "all")
    chips.push({
      key: "age",
      label: ageBands.find((b) => b.key === filters.age)?.label ?? filters.age,
      clear: () => onChange("age", "all"),
    });
  if (filters.month !== null)
    chips.push({
      key: "month",
      label: `Tháng ${filters.month}`,
      clear: () => onChange("month", null),
    });
  if (filters.year !== "all")
    chips.push({
      key: "year",
      label: `Năm ${filters.year}`,
      clear: () => onChange("year", "all"),
    });
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <section className="dashboard-filter-panel" aria-label="Bộ lọc hồ sơ">
      <div
        className="filter-popover-anchor"
        ref={root}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setOpen(false);
        }}
      >
        <Button
          ref={trigger}
          variant="secondary"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          <Filter size={15} />
          Bộ lọc
          {chips.length > 0 && (
            <span className="filter-count">{chips.length}</span>
          )}
        </Button>
        {open && (
          <div className="management-filter-popover" id={id}>
            <header>
              <strong>Lọc hồ sơ</strong>
              <IconButton label="Đóng bộ lọc" onClick={close}>
                <X size={16} />
              </IconButton>
            </header>
            <div className="dashboard-filters">
              {!scope && (
                <label>
                  Nhóm
                  <select
                    aria-label="Lọc nhóm"
                    value={filters.group}
                    onChange={(e) =>
                      onChange("group", e.target.value as Filters["group"])
                    }
                  >
                    <option value="all">Tất cả</option>
                    {(["congregation", "youth", "children"] as const).map(
                      (g) => (
                        <option key={g} value={g}>
                          {groupLabels[g]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}
              <label>
                Phường
                <select
                  aria-label="Lọc phường"
                  value={filters.ward}
                  onChange={(e) => onChange("ward", e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  {wardOptions.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                  <option value="unknown">Chưa có phường</option>
                </select>
              </label>
              <label>
                Tổ
                <select
                  aria-label="Lọc tổ"
                  value={filters.team}
                  onChange={(e) => onChange("team", e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  {[1, 2, 3].map((t) => (
                    <option key={t} value={t}>
                      Tổ {t}
                    </option>
                  ))}
                  <option value="unknown">Chưa phân tổ</option>
                </select>
              </label>
              <label>
                Độ tuổi
                <select
                  aria-label="Lọc độ tuổi"
                  value={filters.age}
                  onChange={(e) =>
                    onChange("age", e.target.value as Filters["age"])
                  }
                >
                  <option value="all">Tất cả</option>
                  {ageBands.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tháng đăng ký
                <select
                  aria-label="Lọc tháng đăng ký"
                  value={filters.month ?? "all"}
                  onChange={(e) =>
                    onChange(
                      "month",
                      e.target.value === "all" ? null : Number(e.target.value),
                    )
                  }
                >
                  <option value="all">Tất cả</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Năm đăng ký
                <select
                  aria-label="Lọc năm đăng ký"
                  value={filters.year}
                  onChange={(e) => onChange("year", e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
            <footer>
              <Button variant="ghost" onClick={onReset}>
                Xóa bộ lọc
              </Button>
              <Button variant="secondary" onClick={close}>
                <Check size={14} />
                Xong
              </Button>
            </footer>
          </div>
        )}
      </div>
      <div className="active-filter-chips" aria-label="Điều kiện đang áp dụng">
        {chips.length ? (
          chips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              aria-label={`Bỏ lọc ${chip.label}`}
            >
              {chip.label}
              <X size={12} />
            </button>
          ))
        ) : (
          <span>Tất cả hồ sơ</span>
        )}
      </div>
      <IconButton
        label="Làm mới số liệu"
        busy={refreshing}
        className="dashboard-refresh"
        onClick={onRefresh}
      >
        <RefreshCw size={16} />
      </IconButton>
    </section>
  );
}
export default memo(DashboardFilters);

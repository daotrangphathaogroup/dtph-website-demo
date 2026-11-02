import { FilterX, RefreshCw } from "lucide-react";
import { Button, IconButton } from "../../components/ui/primitives";
import { groupLabels } from "../../lib/types";
import { ageBands } from "../../lib/dashboard";
import type { DashboardFilters as Filters } from "../../lib/dashboard";
type Props = {
  filters: Filters;
  wardOptions: string[];
  years: string[];
  period: string;
  refreshing: boolean;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  onRefresh: () => void;
};
export default function OverviewFilters({
  filters,
  wardOptions,
  years,
  period,
  refreshing,
  onChange,
  onReset,
  onRefresh,
}: Props) {
  return (
    <section className="overview-filters" aria-label="Bộ lọc tổng quan">
      <header className="overview-filter-heading">
        <div>
          <h2>Bộ lọc dữ liệu</h2>
          <p>{period}</p>
        </div>
        <div className="overview-filter-actions">
          <Button variant="ghost" onClick={onReset}>
            <FilterX size={15} />
            Xóa bộ lọc
          </Button>
          <IconButton
            label="Làm mới số liệu"
            busy={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw size={16} />
          </IconButton>
        </div>
      </header>
      <div className="overview-filter-fields">
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
            {(["congregation", "youth", "children"] as const).map((g) => (
              <option key={g} value={g}>
                {groupLabels[g]}
              </option>
            ))}
          </select>
        </label>
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
            onChange={(e) => onChange("age", e.target.value as Filters["age"])}
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
          Năm đăng ký
          <select
            aria-label="Lọc năm đăng ký"
            value={filters.year}
            onChange={(e) => onChange("year", e.target.value)}
          >
            <option value="all">Tất cả</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
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
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index + 1}>
                Tháng {index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

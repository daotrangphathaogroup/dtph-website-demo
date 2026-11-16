import { memo, useId, useRef, useState } from "react";
import { ChartNoAxesCombined, ChartColumn, ChartLine } from "lucide-react";
import MonthlyAreaChart from "./MonthlyAreaChart";
import { EmptyState, SegmentedControl } from "../../components/ui/primitives";
import type { Distribution } from "../../lib/dashboard";
const palette = [
  "var(--chart-amber)",
  "var(--chart-sage)",
  "var(--chart-stroke)",
  "var(--chart-muted)",
];
export type Dimension = "ward" | "age" | "gender";
export function Donut({ items, total, colors = palette }: { items: Distribution[]; total: number; colors?: readonly string[] }) {
  const id = useId().replaceAll(':', '');
  const root = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{index: number | null; x: number; y: number} | null>(null);
  function show(index: number | null, x: number, y: number) {
    const bounds = root.current?.getBoundingClientRect();
    if (bounds) setHover({index, x: Math.max(88, Math.min(bounds.width - 88, x - bounds.left)), y: y - bounds.top});
  }
  const hovered = hover?.index != null ? items[hover.index] : null;
  let angle = 0;
  const segments = items.map((item, i) => {
    const start = angle;
    const share = total ? (item.count / total) * 100 : 0;
    angle += share;
    return {start, share, color: colors[i % colors.length], label: item.label, count: item.count};
  });
  return (
    <div className="dashboard-composition" ref={root} onPointerLeave={() => setHover(null)}>
      <div
        className={`dashboard-donut ${!total ? "is-empty" : ""}`}
        role="img"
        tabIndex={0}
        aria-describedby={hover ? `${id}-tooltip` : undefined}
        onPointerMove={e => {
          const segment = e.target instanceof Element ? e.target.closest<SVGCircleElement>('.donut-segment') : null;
          show(segment ? Number(segment.dataset.index) : null, e.clientX, e.clientY);
        }}
        onFocus={e => {const box = e.currentTarget.getBoundingClientRect(); show(null, box.x + box.width / 2, box.y + box.height / 2);}}
        onBlur={() => setHover(null)}
        aria-label={
          total
            ? items.map((i) => `${i.label}: ${i.count}`).join(", ")
            : "Chưa có dữ liệu"
        }
      >
        <svg className="donut-ring" viewBox="0 0 200 200" aria-hidden="true">
          <defs>{segments.map((segment, index) => <linearGradient key={segment.label} id={`${id}-ring-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`color-mix(in srgb, ${segment.color} 78%, white)`} />
            <stop offset="100%" stopColor={segment.color} />
          </linearGradient>)}</defs>
          <circle className="donut-track" cx="100" cy="100" r="84" />
          {segments.map((segment, index) => {
            if (!segment.share) return null;
            const gap = Math.min(1.3, segment.share * 0.15);
            return <circle key={segment.label} className="donut-segment" data-index={index} cx="100" cy="100" r="84" pathLength="100"
              stroke={`url(#${id}-ring-${index})`} strokeDasharray={`${segment.share - gap} ${100 - segment.share + gap}`}
              strokeDashoffset={-segment.start - gap / 2}>
            </circle>;
          })}
        </svg>
        <div>
          <strong>{total.toLocaleString("vi-VN")}</strong>
          <span>huynh đệ</span>
        </div>
      </div>
      <ul className="dashboard-legend">
        {items.map((item, i) => (
          <li key={item.label} style={{borderInlineStartColor: colors[i % colors.length]}} tabIndex={0}
            aria-describedby={hover?.index === i ? `${id}-tooltip` : undefined}
            onPointerMove={e => show(i, e.clientX, e.clientY)}
            onFocus={e => {const box = e.currentTarget.getBoundingClientRect(); show(i, box.x + box.width / 2, box.y);}}
            onBlur={() => setHover(null)}>
            <span
              className="chart-dot"
              style={{ background: colors[i % colors.length] }}
            />
            <span>{item.label}</span>
            <b>{item.count.toLocaleString("vi-VN")}</b>
            <small>
              {total
                ? ((item.count / total) * 100).toLocaleString("vi-VN", {
                    maximumFractionDigits: 1,
                  })
                : "0"}
              %
            </small>
          </li>
        ))}
      </ul>
      {hover && <output id={`${id}-tooltip`} role="tooltip" className="donut-tooltip" data-placement={hover.y < 100 ? 'below' : 'above'}
        style={{left: hover.x, top: hover.y + (hover.y < 100 ? 16 : -16)}}>
        <span>{hovered?.label ?? 'Tổng số huynh đệ'}</span>
        <strong>{(hovered?.count ?? total).toLocaleString('vi-VN')} <small>hồ sơ</small></strong>
        {hovered && <small>{(total ? hovered.count / total * 100 : 0).toLocaleString('vi-VN', {maximumFractionDigits: 1})}% tổng số</small>}
      </output>}
    </div>
  );
}
function Bars({ items }: { items: Distribution[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.some((i) => i.count))
    return (
      <EmptyState
        title="Chưa có dữ liệu phù hợp"
        description="Thử điều chỉnh bộ lọc thống kê."
        icon={<ChartNoAxesCombined size={24} />}
      />
    );
  return (
    <div
      className="dashboard-bars"
      role="img"
      aria-label={items.map((i) => `${i.label}: ${i.count}`).join(", ")}
    >
      {items.map((item) => (
        <div className="dashboard-bar-row" key={item.label}>
          <span title={item.label}>{item.label}</span>
          <div className="dashboard-bar-track">
            <i style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <b>{item.count}</b>
        </div>
      ))}
    </div>
  );
}
export function RegistrationMonthChart({months, pendingMonths, month, period, total, defaultView = 'area'}: {
  months: number[]; pendingMonths: number[]; month: number | null; period: string; total: number; defaultView?: 'area' | 'bars';
}) {
  const maxMonth = Math.max(1, ...months);
  const [chartView, setChartView] = useState<'area' | 'bars'>(defaultView);
  return (
        <section className="dashboard-card dashboard-month-chart">
          <header className="dashboard-card-heading">
            <div className="chart-title">
              <div>
                <h2>Đăng ký theo tháng</h2>
                <p>{period}</p>
              </div>
            </div>
            <SegmentedControl
              label="Kiểu biểu đồ đăng ký"
              value={chartView}
              onChange={setChartView}
              items={[
                {
                  value: "area",
                  label: (
                    <>
                      <ChartLine size={14} />
                      Đường
                    </>
                  ),
                },
                {
                  value: "bars",
                  label: (
                    <>
                      <ChartColumn size={14} />
                      Cột
                    </>
                  ),
                },
              ]}
            />
          </header>
          {chartView === "area" ? (
            <MonthlyAreaChart months={months} pendingMonths={pendingMonths} />
          ) : (
            <div
              className="monthly-bars"
              role="img"
              aria-label={months
                .map((n, i) => `Tháng ${i + 1}: ${n}`)
                .join(", ")}
            >
              {months.map((n, i) => (
                <div
                  className={`monthly-column ${month === i + 1 ? "active" : ""}`}
                  key={i}
                >
                  <span className="monthly-value">{n}</span>
                  <div className="monthly-track">
                    <i
                      style={{ height: n ? `${(n / maxMonth) * 100}%` : "0%" }}
                    />
                  </div>
                  <span>T{i + 1}</span>
                </div>
              ))}
            </div>
          )}
          {!total && (
            <p className="dashboard-zero-note">
              Chưa có hồ sơ đã duyệt phù hợp với bộ lọc.
            </p>
          )}
        </section>
  );
}
function DashboardCharts({
  scope,
  total,
  composition,
  bars,
  months,
  pendingMonths,
  month,
  period,
  dimension,
  onDimension,
}: {
  scope?: string;
  total: number;
  composition: Distribution[];
  bars: Distribution[];
  months: number[];
  pendingMonths: number[];
  month: number | null;
  period: string;
  dimension: Dimension;
  onDimension: (d: Dimension) => void;
}) {
  return (
    <>
      <div
        className={`dashboard-analysis ${!scope ? "overview-analysis" : ""}`}
      >
        <RegistrationMonthChart months={months} pendingMonths={pendingMonths} month={month} period={period} total={months.reduce((sum, count) => sum + count, 0)} defaultView={scope ? 'bars' : 'area'} />

        {scope && (
          <section className="dashboard-card dashboard-structure">
            <header className="chart-heading">
              <div className="chart-title">
                <div>
                  <h2>{scope ? "Phân bố theo Tổ" : "Cơ cấu nhóm"}</h2>
                  <p>
                    {scope
                      ? "Huynh đệ theo từng tổ sinh hoạt"
                      : "Thành phần các nhóm sinh hoạt"}
                  </p>
                </div>
              </div>
              <span className="chart-unit">Người</span>
            </header>
            <Donut items={composition} total={total} colors={scope
              ? ['var(--group-accent)', 'color-mix(in srgb, var(--group-accent) 70%, white)', 'color-mix(in srgb, var(--group-accent) 42%, white)', ...(scope === 'congregation' ? ['var(--cyan)', 'var(--chart-amber)'] : []), '#939da9']
              : undefined} />
          </section>
        )}
        <section className="dashboard-card dashboard-distribution">
          <header className="dashboard-card-heading">
            <div className="chart-title">
              <div>
                <h2>Phân bố huynh đệ</h2>
                <p>Thông tin theo bộ lọc đang chọn</p>
              </div>
            </div>
            <SegmentedControl
              label="Phân bố theo"
              value={dimension}
              onChange={onDimension}
              items={[
                { value: "ward", label: "Phường" },
                { value: "age", label: "Độ tuổi" },
                { value: "gender", label: "Giới tính" },
              ]}
            />
          </header>
          <Bars items={bars} />
        </section>
      </div>
    </>
  );
}
export default memo(DashboardCharts);

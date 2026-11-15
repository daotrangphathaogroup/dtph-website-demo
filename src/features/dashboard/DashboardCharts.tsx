import { memo, useState } from "react";
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
  let angle = 0;
  const segments = items.map((item, i) => {
    const start = angle;
    const share = total ? (item.count / total) * 100 : 0;
    angle += share;
    return {start, share, color: colors[i % colors.length], label: item.label, count: item.count};
  });
  return (
    <div className="dashboard-composition">
      <div
        className={`dashboard-donut ${!total ? "is-empty" : ""}`}
        role="img"
        aria-label={
          total
            ? items.map((i) => `${i.label}: ${i.count}`).join(", ")
            : "Chưa có dữ liệu"
        }
      >
        <svg className="donut-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="donut-track" cx="100" cy="100" r="84" />
          {segments.filter(segment => segment.share > 0).map(segment => {
            const gap = Math.min(1.3, segment.share * 0.15);
            return <circle key={segment.label} className="donut-segment" cx="100" cy="100" r="84" pathLength="100"
              stroke={segment.color} strokeDasharray={`${segment.share - gap} ${100 - segment.share + gap}`}
              strokeDashoffset={-segment.start - gap / 2}>
              <title>{segment.label}: {segment.count.toLocaleString('vi-VN')} huynh đệ</title>
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
          <li key={item.label} style={{borderInlineStartColor: colors[i % colors.length]}}>
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
              ? ['var(--group-accent)', 'color-mix(in srgb, var(--group-accent) 70%, white)', 'color-mix(in srgb, var(--group-accent) 42%, white)', '#939da9']
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

import { memo, useState } from "react";
import { ChartNoAxesCombined, ChartColumn, ChartLine } from "lucide-react";
import MonthlyAreaChart from "./MonthlyAreaChart";
import { EmptyState, SegmentedControl } from "../../components/ui/primitives";
import type { Distribution } from "../../lib/dashboard";
const palette = ["#3695b4", "#8ca4b5", "#d4b775", "#596b7a"];
export type Dimension = "ward" | "age" | "gender";
function Donut({ items, total }: { items: Distribution[]; total: number }) {
  let angle = 0;
  const segments = items.map((item, i) => {
    const from = angle;
    angle += total ? (item.count / total) * 100 : 0;
    return `${palette[i % palette.length]} ${from}% ${angle}%`;
  });
  return (
    <div className="dashboard-composition">
      <div
        className={`dashboard-donut ${!total ? "is-empty" : ""}`}
        style={{
          background: total
            ? `conic-gradient(${segments.join(",")})`
            : undefined,
        }}
        role="img"
        aria-label={
          total
            ? items.map((i) => `${i.label}: ${i.count}`).join(", ")
            : "Chưa có dữ liệu"
        }
      >
        <div>
          <strong>{total.toLocaleString("vi-VN")}</strong>
          <span>huynh đệ</span>
        </div>
      </div>
      <ul className="dashboard-legend">
        {items.map((item, i) => (
          <li key={item.label}>
            <span
              className="chart-dot"
              style={{ background: palette[i % palette.length] }}
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
function DashboardCharts({
  scope,
  total,
  composition,
  bars,
  months,
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
  month: number | null;
  period: string;
  dimension: Dimension;
  onDimension: (d: Dimension) => void;
}) {
  const maxMonth = Math.max(1, ...months);
  const [chartView, setChartView] = useState<"area" | "bars">(
    scope ? "bars" : "area",
  );
  return (
    <>
      <div className="dashboard-charts">
        <section className="dashboard-card">
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
          <Donut items={composition} total={total} />
        </section>
        <section className="dashboard-card">
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
          <MonthlyAreaChart months={months} />
        ) : (
          <div
            className="monthly-bars"
            role="img"
            aria-label={months.map((n, i) => `Tháng ${i + 1}: ${n}`).join(", ")}
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
    </>
  );
}
export default memo(DashboardCharts);

"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { monthlyChartGeometry } from "./chart-geometry";
export default function MonthlyAreaChart({
  months,
  pendingMonths = [],
}: {
  months: number[];
  pendingMonths?: number[];
}) {
  const root = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(960);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(240, Math.round(entries[0].contentRect.width))),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const chart = useMemo(
    () => monthlyChartGeometry(months, width, pendingMonths),
    [months, width, pendingMonths],
  );
  const comparison = useMemo(
    () => monthlyChartGeometry(pendingMonths, width, months),
    [months, width, pendingMonths],
  );
  const [active, setActive] = useState<number | null>(null);
  const id = useId().replaceAll(":", ""),
    selected = active === null ? undefined : chart.points[active];
  const labels = chart.points
    .map(
      (p) =>
        `Tháng ${p.month}: ${p.count} đã duyệt, ${pendingMonths[p.month - 1] ?? 0} chờ duyệt`,
    )
    .join(", ");
  return (
    <figure
      ref={root}
      className="area-chart"
      onPointerLeave={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        role="img"
        tabIndex={0}
        aria-labelledby={`${id}-title ${id}-description`}
        onFocus={() => setActive(0)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setActive(null);
            return;
          }
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          setActive((index) =>
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? chart.points.length - 1
                : Math.max(
                    0,
                    Math.min(
                      chart.points.length - 1,
                      (index ?? 0) + (event.key === "ArrowRight" ? 1 : -1),
                    ),
                  ),
          );
        }}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const x =
            ((event.clientX - bounds.left) / bounds.width) * chart.width;
          const ratio =
            (x - chart.left) / (chart.width - chart.left - chart.right);
          setActive(
            Math.max(
              0,
              Math.min(
                chart.points.length - 1,
                Math.round(ratio * (chart.points.length - 1)),
              ),
            ),
          );
        }}
      >
        <title id={`${id}-title`}>Đăng ký theo tháng</title>
        <desc id={`${id}-description`}>
          {labels}. Dùng phím trái hoặc phải để xem từng tháng.
        </desc>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--chart-fill)"
              stopOpacity="0.35"
            />
            <stop offset="100%" stopColor="var(--surface)" stopOpacity="0.08" />
          </linearGradient>
          <pattern
            id={`${id}-dots`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="1"
              cy="1"
              r="0.6"
              fill="var(--chart-stroke)"
              opacity="0.12"
            />
          </pattern>
        </defs>
        <g className="area-chart-grid" aria-hidden="true">
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={chart.left}
                x2={chart.width - chart.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text x={chart.left - 12} y={tick.y + 4} textAnchor="end">
                {tick.value}
              </text>
            </g>
          ))}
          {chart.points.map((point) => (
            <g key={point.month}>
              <line
                className="chart-vertical"
                x1={point.x}
                x2={point.x}
                y1={20}
                y2={chart.baseline}
              />
              {(width >= 480 ||
                (point.month - 1) % 2 === 0 ||
                point.month === 12) && (
                <text x={point.x} y={chart.height - 8} textAnchor="middle">
                  T{point.month}
                </text>
              )}
            </g>
          ))}
        </g>
        <g className="chart-series-reveal">
          <path d={chart.area} fill={`url(#${id}-fill)`} />
          <path d={chart.area} fill={`url(#${id}-dots)`} />
          {pendingMonths.length > 0 && (
            <path
              d={comparison.line}
              className="area-chart-line comparison"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <path
            d={chart.line}
            className="area-chart-line"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </g>
        {selected && (
          <g aria-hidden="true">
            <line
              className="area-chart-marker"
              x1={selected.x}
              x2={selected.x}
              y1={20}
              y2={chart.baseline}
            />
            <circle
              cx={selected.x}
              cy={selected.y}
              r={5}
              className="area-chart-dot"
            />
            {comparison.points[active!] && (
              <circle
                cx={selected.x}
                cy={comparison.points[active!].y}
                r={4}
                className="area-chart-dot comparison"
              />
            )}
          </g>
        )}
      </svg>
      {selected && (
        <output
          className="area-chart-tooltip"
          aria-live="polite"
          style={{
            left: `clamp(76px, ${(selected.x / chart.width) * 100}%, calc(100% - 76px))`,
          }}
        >
          <span>Tháng {selected.month}</span>
          <strong>{selected.count.toLocaleString("vi-VN")} đã duyệt</strong>
          {pendingMonths.length > 0 && (
            <span>{pendingMonths[selected.month - 1] ?? 0} chờ duyệt</span>
          )}
        </output>
      )}
      <figcaption className="chart-series-key">
        <span>
          <i />
          Đã duyệt
        </span>
        {pendingMonths.length > 0 && (
          <span>
            <i className="comparison" />
            Chờ duyệt
          </span>
        )}
      </figcaption>
    </figure>
  );
}

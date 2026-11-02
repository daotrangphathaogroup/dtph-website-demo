/** Real-count chart geometry; bounded Bézier segments pass through each observation without overshoot. */
export function monthlyChartGeometry(
  values: number[],
  width = 960,
  comparisonValues: number[] = [],
) {
  const height = 228,
    left = 48,
    right = 20,
    top = 20,
    bottom = 32;
  const baseline = height - bottom,
    plotWidth = width - left - right,
    plotHeight = baseline - top;
  const counts = values.map((value) =>
    Number.isFinite(value) ? Math.max(0, value) : 0,
  );
  const max = Math.max(
      1,
      ...counts,
      ...comparisonValues.filter(Number.isFinite).map((n) => Math.max(0, n)),
    ),
    rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(
    1,
    [1, 2, 5, 10].find((n) => n * power >= rough)! * power,
  );
  const ceiling = Math.ceil(max / step) * step;
  const points = counts.map((count, index) => ({
    x: left + (index * plotWidth) / Math.max(1, counts.length - 1),
    y: baseline - (count / ceiling) * plotHeight,
    count,
    month: index + 1,
  }));
  const line = points
    .map((p, index) => {
      if (!index) return `M${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      const previous = points[index - 1],
        dx = (p.x - previous.x) / 3;
      return `C${(previous.x + dx).toFixed(2)},${previous.y.toFixed(2)} ${(p.x - dx).toFixed(2)},${p.y.toFixed(2)} ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ");
  const area = points.length
    ? `${line} L${points.at(-1)!.x.toFixed(2)},${baseline} L${points[0].x},${baseline} Z`
    : "";
  const ticks = Array.from(
    { length: Math.round(ceiling / step) + 1 },
    (_, index) => ({
      value: index * step,
      y: baseline - ((index * step) / ceiling) * plotHeight,
    }),
  );
  return { width, height, left, right, baseline, points, line, area, ticks };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { monthlyChartGeometry } from "../src/features/dashboard/chart-geometry.ts";

test("Monthly area chart preserves all twelve actual counts and their order", () => {
  const values = [0, 12, 35, 4, 0, 68, 2, 19, 26, 3, 9, 40];
  const chart = monthlyChartGeometry(values);
  assert.deepEqual(
    chart.points.map((p) => p.count),
    values,
  );
  assert.deepEqual(
    chart.points.map((p) => p.month),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  assert.ok(
    chart.points.every(
      (p) =>
        p.x >= chart.left &&
        p.x <= chart.width - chart.right &&
        p.y >= 20 &&
        p.y <= chart.baseline,
    ),
  );
  assert.ok(chart.ticks.at(-1).value >= Math.max(...values));
  assert.ok(!/NaN|Infinity/.test(chart.line + chart.area));
});
test("Empty and zero charts remain finite and do not fabricate registrations", () => {
  for (const values of [[], Array(12).fill(0)]) {
    const chart = monthlyChartGeometry(values);
    assert.ok(
      chart.points.every((p) => p.count === 0 && p.y === chart.baseline),
    );
    assert.ok(!/NaN|Infinity/.test(chart.line + chart.area));
  }
});
test("Responsive width changes geometry without changing counts or month order", () => {
  const values = Array.from({ length: 12 }, (_, i) => i * 3);
  for (const width of [240, 320, 736, 1440]) {
    const chart = monthlyChartGeometry(values, width);
    assert.equal(chart.width, width);
    assert.deepEqual(
      chart.points.map((p) => p.count),
      values,
    );
    assert.equal(chart.points.at(-1).x, width - chart.right);
    assert.ok(
      chart.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    );
  }
});

test("Comparison series share an axis even when pending registrations dominate", () => {
  const approved = [0, 2, 4, 1],
    pending = [3, 20, 1, 0];
  const a = monthlyChartGeometry(approved, 480, pending);
  const b = monthlyChartGeometry(pending, 480, approved);
  assert.deepEqual(a.ticks, b.ticks);
  assert.deepEqual(
    a.points.map((p) => p.count),
    approved,
  );
  assert.deepEqual(
    b.points.map((p) => p.count),
    pending,
  );
  assert.ok(a.ticks.at(-1).value >= 20);
});

test("Curve control points stay inside adjacent observations without inventing extrema", () => {
  const chart = monthlyChartGeometry([0, 35, 0, 8, 100, 0]);
  const segments = [
    ...chart.line.matchAll(
      /C([\d.]+),([\d.]+) ([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/g,
    ),
  ];
  assert.equal(segments.length, chart.points.length - 1);
  for (const [index, match] of segments.entries()) {
    const previous = chart.points[index],
      next = chart.points[index + 1];
    for (const y of [Number(match[2]), Number(match[4]), Number(match[6])]) {
      assert.ok(
        y >= Math.min(previous.y, next.y) - 0.01 &&
          y <= Math.max(previous.y, next.y) + 0.01,
      );
    }
    assert.ok(Math.abs(Number(match[5]) - next.x) < 0.01);
    assert.ok(Math.abs(Number(match[6]) - next.y) < 0.01);
  }
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monthlyChartGeometry} from '../src/features/dashboard/chart-geometry.ts';

test('Monthly area chart preserves all twelve actual counts and their order', () => {
  const values = [0, 12, 35, 4, 0, 68, 2, 19, 26, 3, 9, 40];
  const chart = monthlyChartGeometry(values);
  assert.deepEqual(
    chart.points.map((p) => p.count),
    values,
  );
  assert.deepEqual(
    chart.points.map((p) => p.month),
    Array.from({length: 12}, (_, i) => i + 1),
  );
  assert.ok(
    chart.points.every(
      (p) =>
        p.x >= chart.left && p.x <= chart.width - chart.right && p.y >= 20 && p.y <= chart.baseline,
    ),
  );
  assert.ok(chart.ticks.at(-1).value >= Math.max(...values));
  assert.ok(!/NaN|Infinity/.test(chart.line + chart.area));
});
test('Empty and zero charts remain finite and do not fabricate registrations', () => {
  for (const values of [[], Array(12).fill(0)]) {
    const chart = monthlyChartGeometry(values);
    assert.ok(chart.points.every((p) => p.count === 0 && p.y === chart.baseline));
    assert.ok(!/NaN|Infinity/.test(chart.line + chart.area));
  }
});
test('Responsive width changes geometry without changing counts or month order', () => {
  const values = Array.from({length: 12}, (_, i) => i * 3);
  for (const width of [240, 320, 736, 1440]) {
    const chart = monthlyChartGeometry(values, width);
    assert.equal(chart.width, width);
    assert.deepEqual(
      chart.points.map((p) => p.count),
      values,
    );
    assert.equal(chart.points.at(-1).x, width - chart.right);
    assert.ok(chart.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  indicators,
  scoreIndicator,
  composite,
  snapshot,
  history,
} from '../src/lib/macro/hypocenter.ts';
test('recovered Hypocenter weights total 100 and original thresholds interpolate correctly', () => {
  assert.equal(
    indicators.reduce((s, x) => s + x.weight, 0),
    100,
  );
  for (const def of indicators) {
    assert.equal(scoreIndicator(def, def.safe), 0);
    assert.equal(scoreIndicator(def, def.danger), def.weight);
    assert.ok(
      Math.abs(
        scoreIndicator(def, (def.safe + def.danger) / 2) - def.weight / 2,
      ) < 1e-9,
    );
  }
});
test('model clamps extreme observations and withholds incomplete totals', () => {
  assert.equal(scoreIndicator(indicators[0], -20), 20);
  assert.equal(scoreIndicator(indicators[1], -1), 0);
  assert.equal(composite([0, 0, 0, 0, 0, 0, null]), null);
  assert.equal(composite([1, 2]), null);
  assert.equal(composite([20, 20, 15, 15, 10, 10, 10]), 100);
});
test('snapshot excludes future data, refuses stale observations and aligns annual growth by date', () => {
  assert.equal(
    snapshot(
      indicators[0],
      [
        { date: '2026-01-01', value: 0 },
        { date: '2026-02-01', value: 1.5 },
      ],
      '2026-01-05',
    ).points,
    20,
  );
  assert.equal(
    snapshot(indicators[0], [{ date: '2025-01-01', value: 0 }], '2026-01-05')
      .points,
    null,
  );
  const output = snapshot(
    indicators[4],
    [
      { date: '2025-01-01', value: 100 },
      { date: '2026-01-01', value: 101 },
    ],
    '2026-01-31',
  );
  assert.ok(Math.abs(output.value - 1) < 1e-9);
  assert.ok(Math.abs(output.points - 5) < 1e-9);
});
test('no sources never produces a historical index', () =>
  assert.deepEqual(history(new Map(), new Date('2026-09-08')), []));
import { parseMarketHistory, rebase } from '../src/lib/macro/market.ts';
test('recovered market-data parser ignores missing prices and labels unadjusted fallback', () => {
  const data = parseMarketHistory({
    chart: {
      result: [
        {
          timestamp: [1704067200, 1706745600],
          indicators: { quote: [{ close: [100, null] }] },
        },
      ],
    },
  });
  assert.equal(data.basis, 'Unadjusted close');
  assert.equal(data.points.length, 1);
  assert.deepEqual(
    rebase([
      { date: '2024-01-01', value: 50 },
      { date: '2024-02-01', value: 75 },
    ]).map((p) => p.value),
    [100, 150],
  );
  assert.throws(() => parseMarketHistory({ chart: { result: [] } }));
});

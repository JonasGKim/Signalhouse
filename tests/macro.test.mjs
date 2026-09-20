import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseObservations,
  yearOverYear,
  sparkline,
} from '../src/lib/macro/series.ts';
test('source parser omits missing observations without converting them to zero', () => {
  assert.deepEqual(
    parseObservations(
      'observation_date,SERIES\n2024-01-01,100\n2024-02-01,.\n2024-03-01,\n2024-04-01,0\n2024-05-01,no',
    ),
    [
      { date: '2024-01-01', value: 100 },
      { date: '2024-04-01', value: 0 },
    ],
  );
});
test('inflation uses the same month a year earlier even when observations are missing', () => {
  assert.deepEqual(
    yearOverYear([
      { date: '2024-01-01', value: 100 },
      { date: '2025-01-01', value: 105 },
      { date: '2025-02-01', value: 110 },
    ]).map((p) => ({ ...p, value: Math.round(p.value) })),
    [{ date: '2025-01-01', value: 5 }],
  );
});
test('flat and single-point charts never generate invalid SVG coordinates', () => {
  for (const points of [
    [],
    [{ date: '2024-01-01', value: 0 }],
    [
      { date: '2024-01-01', value: 2 },
      { date: '2024-02-01', value: 2 },
    ],
  ])
    assert.ok(!/NaN|Infinity/.test(sparkline(points)));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  example,
  enterpriseValueAtGrowth,
  solveGrowth,
  validateInputs,
} from '../src/lib/valuation/model.ts';
test('constant zero-growth cash flows reproduce an ordinary perpetuity across horizons', () => {
  for (const forecastYears of [1, 5, 30]) {
    const p = { ...example, forecastYears, terminalGrowthRate: 0 };
    const expected =
      (p.revenue *
        p.operatingMargin *
        (1 - p.taxRate) *
        (1 - p.reinvestmentRate)) /
      p.discountRate;
    assert.ok(Math.abs(enterpriseValueAtGrowth(p, 0).value - expected) < 1e-8);
  }
});
test('reverse model recovers independently selected positive and negative growth', () => {
  for (const growth of [-0.25, 0, 0.08, 0.3]) {
    const enterpriseValue = enterpriseValueAtGrowth(example, growth).value;
    assert.ok(
      Math.abs(solveGrowth({ ...example, enterpriseValue }) - growth) < 1e-10,
    );
  }
});
test('solver is unit invariant and required growth rises with valuation', () => {
  assert.ok(
    Math.abs(
      solveGrowth(example) -
        solveGrowth({ ...example, revenue: 1, enterpriseValue: 2 }),
    ) < 1e-10,
  );
  assert.ok(
    solveGrowth({ ...example, enterpriseValue: 3000 }) > solveGrowth(example),
  );
});
test('invalid and singular assumptions fail explicitly', () => {
  for (const change of [
    { revenue: 0 },
    { enterpriseValue: Infinity },
    { forecastYears: 1.5 },
    { operatingMargin: 0 },
    { taxRate: 1 },
    { reinvestmentRate: 1 },
    { terminalGrowthRate: 0.1 },
    { terminalGrowthRate: -0.01 },
  ])
    assert.throws(() => validateInputs({ ...example, ...change }));
});
test('unbracketed valuations return no solution and terminal value reconciles', () => {
  assert.equal(
    solveGrowth({ ...example, forecastYears: 1, enterpriseValue: 1e12 }),
    null,
  );
  const output = enterpriseValueAtGrowth(example, 0.1);
  assert.ok(
    Math.abs(
      output.rows.reduce((sum, r) => sum + r.presentValue, 0) +
        output.discountedTerminal -
        output.value,
    ) < 1e-8,
  );
});

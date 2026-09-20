import test from 'node:test';
import assert from 'node:assert/strict';
import { holdings } from '../src/data/portfolio.ts';

test('public portfolio contains only approved display fields', () => {
  const approved = [
    'color',
    'entry',
    'name',
    'sector',
    'snapshot',
    'ticker',
    'weight',
  ];
  assert.equal(holdings.length, 8);
  for (const holding of holdings) {
    assert.deepEqual(Object.keys(holding).sort(), approved);
    assert.ok(Number.isInteger(holding.weight));
    assert.ok(holding.entry > 0 && holding.snapshot > 0);
  }
  assert.equal(
    holdings.reduce((sum, h) => sum + h.weight, 0),
    100,
  );
  assert.equal(new Set(holdings.map((h) => h.ticker)).size, holdings.length);
});

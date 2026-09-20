import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  safeUrl,
  researchStats,
  newestFirst,
  tickerSlug,
} from '../src/data/research.ts';
test('Notion links cannot inject script or data protocols', () => {
  for (const input of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'file:///etc/passwd',
    '/relative',
    'not a url',
  ])
    assert.equal(safeUrl(input), undefined);
  assert.equal(
    safeUrl('https://example.com/report?x=1'),
    'https://example.com/report?x=1',
  );
});
test('research history and statistics count repeated tickers without inventing categories', () => {
  const rows = [
    {
      id: 'a',
      ticker: 'CRDO',
      company: '',
      categories: [],
      publishedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'b',
      ticker: 'CRDO',
      company: '',
      categories: [],
      publishedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'c',
      ticker: 'NVDA',
      company: '',
      categories: [],
      publishedAt: '2026-08-15T00:00:00Z',
    },
  ];
  assert.deepEqual(
    newestFirst(rows).map((x) => x.id),
    ['b', 'c', 'a'],
  );
  assert.equal(rows[0].id, 'a');
  assert.deepEqual(researchStats(rows), {
    count: 3,
    companies: 2,
    categories: 0,
    first: rows[0].publishedAt,
    last: rows[1].publishedAt,
  });
  assert.equal(researchStats([]).first, undefined);
  assert.equal(tickerSlug(' BRK.B '), 'brk.b');
  assert.equal(tickerSlug('A/B'), 'a%2Fb');
});

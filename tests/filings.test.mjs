import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareDocuments,
  normalizeDocument,
} from '../src/lib/filings/compare.ts';
test('unchanged whitespace variations do not create disclosure changes', () => {
  assert.equal(normalizeDocument(' A  B\r\n\r\nC '), 'A B\nC\n');
  assert.ok(
    compareDocuments('A  B\r\n\r\nC', 'A B\nC').every(
      (c) => c.kind === 'unchanged',
    ),
  );
});
test('additions and removals preserve original content including unsafe-looking text', () => {
  const changes = compareDocuments(
    'Revenue grew.\nRisk fell.',
    'Revenue grew.\n<script>alert(1)</script>',
  );
  assert.ok(
    changes.some((c) => c.kind === 'removed' && c.text.includes('Risk fell.')),
  );
  assert.ok(
    changes.some((c) => c.kind === 'added' && c.text.includes('<script>')),
  );
});
test('comparison can reconstruct both normalized documents', () => {
  const a = 'A\nB\nC\nD',
    b = 'A\nE\nC\nF';
  const changes = compareDocuments(a, b);
  assert.equal(
    changes
      .filter((c) => c.kind !== 'added')
      .map((c) => c.text)
      .join(''),
    normalizeDocument(a),
  );
  assert.equal(
    changes
      .filter((c) => c.kind !== 'removed')
      .map((c) => c.text)
      .join(''),
    normalizeDocument(b),
  );
});
test('empty and oversized inputs are rejected', () => {
  assert.throws(() => compareDocuments(' ', 'text'));
  assert.throws(() => compareDocuments('a'.repeat(500001), 'text'));
});

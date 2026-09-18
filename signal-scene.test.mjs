import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, chapterAt } from '../src/lib/signal-scene.ts';
test('returning to earlier sections restores the matching chapter', () => {
  assert.equal(advanceProgress(0.8, 2000, 500, 0, 2500), 0.2);
  assert.equal(advanceProgress(0.8, 2000, 0, 0, 2500), 0);
});
test('overscroll is bounded and all five narrative panels are reachable', () => {
  assert.equal(advanceProgress(0, 0, 5000, 0, 2500), 1);
  assert.equal(advanceProgress(0.7, 0, -20, 0, 2500), 0);
  assert.deepEqual(
    [0, 0.21, 0.41, 0.61, 0.81, 1].map(chapterAt),
    [0, 1, 2, 3, 4, 4],
  );
});

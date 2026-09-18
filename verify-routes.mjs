import assert from 'node:assert/strict';
const origin = process.env.SIGNALHOUSE_URL || 'http://localhost:4321';
const paths = [
  '/',
  '/research/',
  '/research/crdo/',
  '/macro/',
  '/valuation/',
  '/valuation/expectations/',
  '/filings/',
  '/methodology/',
  '/about/',
];
let desk = '';
for (const path of paths) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes('Signalhouse'), path);
  assert.ok(!html.includes(')} )) }'), 'No malformed Astro remnants');
  if (path === '/research/') desk = html;
  console.log('OK', path);
}
assert.ok(desk.includes('CRDO'), 'Live Notion symbols rendered');
const notes = [
  ...new Set(
    [...desk.matchAll(/href="(\/research\/notes\/[^" ]+)"/g)].map((m) => m[1]),
  ),
];
assert.ok(notes.length > 0, 'Actual note links');
for (const path of notes) {
  const r = await fetch(origin + path);
  assert.equal(r.status, 200, path);
  const html = await r.text();
  assert.ok(!html.includes('The full entry couldn’t be loaded'), path);
  console.log('OK', path);
}
for (const path of ['/research/unknown-symbol/', '/research/notes/not-a-page/'])
  assert.equal((await fetch(origin + path)).status, 404, path);
console.log(
  `Verified ${paths.length + notes.length + 2} routes, live notebook, reading views and unknown-record responses.`,
);

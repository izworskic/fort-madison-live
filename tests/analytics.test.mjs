import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('root analytics inherits Chris Izworski network GA4 measurement',()=>{
  const source=fs.readFileSync('components/Analytics.tsx','utf8');
  assert.match(source,/G-Y5D2V2W7HN/);
  assert.match(source,/NEXT_PUBLIC_GA_ID\s*\|\|\s*NETWORK_GA_ID/);
});

test('root layout renders shared Analytics component',()=>{
  const source=fs.readFileSync('app/layout.tsx','utf8');
  assert.match(source,/import Analytics/);
  assert.match(source,/<Analytics\s*\/>/);
});

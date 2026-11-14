// Runs the phrase-keeper on HTML files in place, e.g. the design canvas's artboards:
//   node scripts/keep-together.mjs path/to/Main.dc.html …
// The site's own pages get it automatically through src/middleware.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { keepTogether } from '../src/lib/keep-together.mjs';

for (const file of process.argv.slice(2)) {
  const before = readFileSync(file, 'utf8');
  const after = keepTogether(before);
  if (after !== before) writeFileSync(file, after);
  console.log(`${file}: ${after === before ? 'no change' : 'updated'}`);
}

import { readFile } from 'fs/promises';
import { buildThemeFromSpec } from '../core/theme-builder.js';

const main = async () => {
  const raw = await readFile(new URL('../themeSpec.json', import.meta.url), 'utf8');
  const spec = JSON.parse(raw);
  const out = await buildThemeFromSpec(spec);
  console.log(out);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


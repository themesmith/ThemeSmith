const slugify = (str) => str
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

import { readFile } from 'fs/promises';

const raw = await readFile(new URL('../themeSpec.json', import.meta.url), 'utf8');
const spec = JSON.parse(raw);
console.log(slugify(spec.projectName || 'theme'));


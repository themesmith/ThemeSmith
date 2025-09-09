import path from 'path';
import fs from 'fs/promises';
import { buildThemeFromSpec } from '../../core/theme-builder.js';

const readSpecFromDisk = async () => {
  const p = path.resolve(process.cwd(), 'themeSpec.json');
  const json = await fs.readFile(p, 'utf8');
  return JSON.parse(json);
};

const buildTheme = async (req, res, next) => {
  try {
    const hasBody = req.body && Object.keys(req.body).length > 0;
    const spec = hasBody ? req.body : await readSpecFromDisk();
    const themePath = await buildThemeFromSpec(spec);
    res.locals.spec = spec;
    res.locals.themePath = themePath;
    return next();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

export default buildTheme;

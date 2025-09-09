import { exec } from 'child_process';
import path from 'path';

const validateTheme = async (req, res, next) => {
  const themePath = res.locals.themePath;
  if (!themePath) return res.status(500).json({ error: 'Missing themePath for validation' });

  const cmd = `npx --yes gscan "${themePath}"`;
  exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    res.locals.validatorSummary = err ? stderr || stdout : stdout;
    res.locals.validatorError = Boolean(err);
    res.locals.slug = path.basename(themePath);
    return next();
  });
};

export default validateTheme;


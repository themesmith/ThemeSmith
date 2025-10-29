import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import validateWordPressTheme from '../../platforms/wordpress/validators/theme-check.js';

const validateTheme = async (req, res, next) => {
  const { themePath, spec } = res.locals;
  if (!themePath) return res.status(500).json({ error: 'Missing themePath for validation' });

  // Route to appropriate validator based on platform
  if (spec?.platform === 'wordpress') {
    return validateWordPressTheme(req, res, next);
  }

  // Default to Ghost validation (existing code)
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const repoRoot = path.resolve(__dirname, '..', '..');
    const gscanCli = path.join(repoRoot, 'node_modules', 'gscan', 'bin', 'cli.js');
    const nodeBin = process.execPath; // current Node runtime
    const cmd = `"${nodeBin}" "${gscanCli}" "${themePath}"`;
    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      res.locals.validatorSummary = err ? stderr || stdout : stdout;
      res.locals.validatorError = Boolean(err);
      res.locals.slug = path.basename(themePath);
      return next();
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to run gscan', details: e.message });
  }
  return undefined;
};

export default validateTheme;

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const validateTheme = async (req, res, next) => {
  const themePath = res.locals.themePath;
  if (!themePath) return res.status(500).json({ error: 'Missing themePath for validation' });

  // Prefer executing the local gscan CLI via the current Node binary to avoid PATH issues
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
};

export default validateTheme;

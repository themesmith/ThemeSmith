import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const validateWordPressTheme = async (req, res, next) => {
  const { themePath } = res.locals;
  if (!themePath) return res.status(500).json({ error: 'Missing themePath for validation' });

  try {
    // Check if theme-check is available
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    
    // Try to run theme-check if available
    exec(`which theme-check`, (err, stdout) => {
      if (err || !stdout.trim()) {
        // theme-check not available, do basic validation
        performBasicWordPressValidation(themePath, res, next);
      } else {
        // Run theme-check
        exec(`theme-check ${themePath}`, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
          res.locals.validatorSummary = err ? stderr || stdout : stdout;
          res.locals.validatorError = Boolean(err);
          res.locals.slug = path.basename(themePath);
          return next();
        });
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to run WordPress theme validation', details: e.message });
  }
  return undefined;
};

const performBasicWordPressValidation = (themePath, res, next) => {
  const fs = require('fs');
  const validationResults = [];
  let hasErrors = false;

  // Check required files
  const requiredFiles = [
    'style.css',
    'index.php',
    'functions.php',
    'header.php',
    'footer.php'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(themePath, file);
    if (!fs.existsSync(filePath)) {
      validationResults.push(`ERROR: Missing required file: ${file}`);
      hasErrors = true;
    }
  });

  // Check style.css header
  const stylePath = path.join(themePath, 'style.css');
  if (fs.existsSync(stylePath)) {
    const styleContent = fs.readFileSync(stylePath, 'utf8');
    const requiredHeaders = ['Theme Name:', 'Description:', 'Author:', 'Version:'];
    
    requiredHeaders.forEach(header => {
      if (!styleContent.includes(header)) {
        validationResults.push(`WARNING: Missing style.css header: ${header}`);
      }
    });
  }

  // Check functions.php for security issues
  const functionsPath = path.join(themePath, 'functions.php');
  if (fs.existsSync(functionsPath)) {
    const functionsContent = fs.readFileSync(functionsPath, 'utf8');
    
    // Check for basic security practices
    if (functionsContent.includes('eval(')) {
      validationResults.push('ERROR: eval() function found - security risk');
      hasErrors = true;
    }
    
    if (!functionsContent.includes('ABSPATH')) {
      validationResults.push('WARNING: No ABSPATH check found in functions.php');
    }
  }

  // Check for theme.json (modern WordPress feature)
  const themeJsonPath = path.join(themePath, 'theme.json');
  if (fs.existsSync(themeJsonPath)) {
    validationResults.push('INFO: theme.json found - Gutenberg support detected');
  }

  const summary = validationResults.length > 0 
    ? validationResults.join('\n')
    : 'Basic validation passed - all required files present';

  res.locals.validatorSummary = summary;
  res.locals.validatorError = hasErrors;
  res.locals.slug = path.basename(themePath);
  return next();
};

export default validateWordPressTheme;

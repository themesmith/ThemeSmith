import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { buildThemeFromSpec } from '../core/theme-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/output', express.static(path.resolve('output')));

const readSpecFromDisk = async () => {
  const p = path.resolve(__dirname, '..', 'themeSpec.json');
  const json = await fs.readFile(p, 'utf8');
  return JSON.parse(json);
};

app.post('/generate-theme', async (req, res) => {
  try {
    const spec = Object.keys(req.body || {}).length ? req.body : await readSpecFromDisk();
    const themePath = await buildThemeFromSpec(spec);

    // Run Ghost validator via npx (installed on-demand)
    const validatorCmd = `npx --yes gscan "${themePath}"`;
    exec(validatorCmd, { maxBuffer: 1024 * 1024 }, async (err, stdout, stderr) => {
      const slug = path.basename(themePath);
      const outRoot = path.resolve('output');
      const zipPath = path.join(outRoot, `${slug}.zip`);
      const reportPath = path.join(outRoot, `${slug}-report.md`);

      // Create a zip of the theme
      const zipCmd = `cd "${outRoot}" && zip -qr "${slug}.zip" "${slug}"`;
      exec(zipCmd, async (zipErr) => {
        const summary = err ? stderr || stdout : stdout;
        const report = `# ThemeSmith Report\n\n- Theme: ${spec.projectName} (${slug})\n- Platform: ${spec.platform}\n- Output: ${themePath}\n- Zip: ${zipPath}\n\n## Validator Output (gscan)\n\n\n${summary}\n`;
        await fs.writeFile(reportPath, `${report}\n`, 'utf8');

        if (zipErr) {
          return res.status(500).json({
            error: 'Failed to zip theme',
            details: zipErr.message,
            validator: summary,
          });
        }

        if (err) {
          return res.status(200).json({
            message: 'Theme built with validator findings',
            download: `/output/${slug}.zip`,
            validator: summary,
            report: `/output/${slug}-report.md`,
            themePath,
          });
        }

        return res.status(200).json({
          message: 'Theme built successfully',
          download: `/output/${slug}.zip`,
          validator: summary,
          report: `/output/${slug}-report.md`,
          themePath,
        });
      });
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ThemeSmith API listening on http://localhost:${PORT}`);
});

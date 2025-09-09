import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import buildTheme from './routes/generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? undefined : allowedOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use('/output', express.static(path.resolve('output')));

// Build → validate → zip pipeline using middleware chain
app.post('/generate-theme', buildTheme, async (req, res) => {
  const spec = res.locals.spec;
  const themePath = res.locals.themePath;
  try {
    const validatorCmd = `npx --yes gscan "${themePath}"`;
    exec(validatorCmd, { maxBuffer: 1024 * 1024 }, async (err, stdout, stderr) => {
      const slug = path.basename(themePath);
      const outRoot = path.resolve('output');
      const zipPath = path.join(outRoot, `${slug}.zip`);
      const reportPath = path.join(outRoot, `${slug}-report.md`);

      const summary = err ? stderr || stdout : stdout;
      const report = `# ThemeSmith Report\n\n- Theme: ${spec.projectName} (${slug})\n- Platform: ${spec.platform}\n- Output: ${themePath}\n- Zip: ${zipPath}\n\n## Validator Output (gscan)\n\n\n${summary}\n`;
      await fs.writeFile(reportPath, `${report}\n`, 'utf8');

      try {
        await new Promise((resolve, reject) => {
          // eslint-disable-next-line global-require
          const nodefs = require('fs');
          const output = nodefs.createWriteStream(zipPath);
          const archive = archiver('zip', { zlib: { level: 9 } });
          output.on('close', resolve);
          archive.on('error', reject);
          archive.pipe(output);
          archive.directory(themePath, false);
          archive.finalize();
        });
      } catch (zipErr) {
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
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ThemeSmith API listening on http://localhost:${PORT}`);
});

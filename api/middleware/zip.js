import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

const zipTheme = async (req, res, next) => {
  try {
    const themePath = res.locals.themePath;
    if (!themePath) return res.status(500).json({ error: 'Missing themePath for zipping' });

    const outRoot = path.resolve('output');
    const slug = res.locals.slug || path.basename(themePath);
    const zipPath = path.join(outRoot, `${slug}.zip`);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(themePath, false);
      archive.finalize();
    });

    res.locals.zipPath = zipPath;
    return next();
  } catch (e) {
    return res.status(500).json({ error: 'Failed to zip theme', details: e.message });
  }
};

export default zipTheme;

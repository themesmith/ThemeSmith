import fs from 'fs/promises';
import path from 'path';

const respondTheme = async (req, res) => {
  try {
    const {
      spec,
      themePath,
      validatorSummary,
      validatorError,
      zipPath,
    } = res.locals;
    const slug = res.locals.slug || path.basename(themePath);
    const outRoot = path.resolve('output');
    const reportPath = path.join(outRoot, `${slug}-report.md`);
    const reportLines = [
      '# ThemeSmith Report',
      '',
      `- Theme: ${spec?.projectName} (${slug})`,
      `- Platform: ${spec?.platform}`,
      `- Output: ${themePath}`,
      `- Zip: ${zipPath}`,
      '',
      '## Validator Output (gscan)',
      '',
      validatorSummary || '',
      '',
    ];
    await fs.writeFile(reportPath, `${reportLines.join('\n')}\n`, 'utf8');

    const body = {
      download: `/output/${slug}.zip`,
      validator: validatorSummary,
      report: `/output/${slug}-report.md`,
      themePath,
    };
    if (validatorError) {
      return res.status(200).json({ message: 'Theme built with validator findings', ...body });
    }
    return res.status(200).json({ message: 'Theme built successfully', ...body });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export default respondTheme;

import fs from 'fs/promises';
import path from 'path';

const respondTheme = async (req, res) => {
  try {
    const { spec, themePath, validatorSummary, validatorError, zipPath } = res.locals;
    const slug = res.locals.slug || path.basename(themePath);
    const outRoot = path.resolve('output');
    const reportPath = path.join(outRoot, `${slug}-report.md`);

    const report = `# ThemeSmith Report\n\n- Theme: ${spec?.projectName} (${slug})\n- Platform: ${spec?.platform}\n- Output: ${themePath}\n- Zip: ${zipPath}\n\n## Validator Output (gscan)\n\n\n${validatorSummary || ''}\n`;
    await fs.writeFile(reportPath, `${report}\n`, 'utf8');

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


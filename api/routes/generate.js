import { Router } from 'express';
import { buildThemeFromSpec } from '../../core/theme-builder.js';

const router = Router();

router.post('/generate-theme', async (req, res, next) => {
  try {
    const spec = req.body || {};
    const path = await buildThemeFromSpec(spec);
    res.locals.themePath = path;
    return next();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;


import express from 'express';
import cors from 'cors';
import path from 'path';
import buildTheme from './routes/generate.js';
import validateTheme from './middleware/validate.js';
import zipTheme from './middleware/zip.js';
import respondTheme from './middleware/respond.js';

const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? undefined : allowedOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use('/output', express.static(path.resolve('output')));

// Build → validate → zip pipeline using middleware chain
app.post('/generate-theme', buildTheme, validateTheme, zipTheme, respondTheme);

app.get('/healthz', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ThemeSmith API listening on http://localhost:${PORT}`);
});

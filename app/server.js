import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const OS_ROOT = path.resolve(__dirname, '..');

app.get('/api/session-log', (req, res) => {
  const logPath = path.join(OS_ROOT, 'system', 'session_log.md');
  try {
    const data = fs.readFileSync(logPath, 'utf8');
    res.json({ success: true, content: data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Cannot read session log' });
  }
});

app.get('/api/projects', (req, res) => {
  const jobPath = path.join(OS_ROOT, 'projects', 'job');
  const personalBrands = path.join(OS_ROOT, 'projects', 'brands');

  let projects = {
    personal: [],
    job: []
  };

  try {
    if (fs.existsSync(personalBrands)) {
      const brands = fs.readdirSync(personalBrands).filter(f => fs.statSync(path.join(personalBrands, f)).isDirectory());
      projects.personal.push(...brands.map(b => ({ name: b, type: 'brand' })));
    }

    // Add known other projects
    projects.personal.push({ name: 'music', type: 'creative' });
    projects.personal.push({ name: 'ego_era', type: 'creative' });
    projects.personal.push({ name: 'trading', type: 'wealth' });

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Cannot read projects' });
  }
});

app.get('/api/file', (req, res) => {
  const reqPath = req.query.path;
  if (!reqPath) return res.status(400).json({ success: false, error: 'Path required' });

  // Basic security to keep it inside OS_ROOT
  const absolutePath = path.resolve(OS_ROOT, reqPath);
  if (!absolutePath.startsWith(OS_ROOT)) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  try {
    if (fs.existsSync(absolutePath)) {
      const data = fs.readFileSync(absolutePath, 'utf8');
      res.json({ success: true, content: data });
    } else {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Cannot read file' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Coprem Local API running on http://localhost:${PORT}`);
});

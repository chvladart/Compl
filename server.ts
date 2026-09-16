import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const httpServer = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory persistent state store for cloud sync between all connected devices
interface CloudStore {
  project: any;
  items: any[];
  lastModified: number;
}

let cloudState: CloudStore = {
  project: null,
  items: [],
  lastModified: Date.now(),
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Cloud Sync endpoints for multi-device live sync
app.get('/api/sync', (req, res) => {
  res.json({
    project: cloudState.project,
    items: cloudState.items,
    lastModified: cloudState.lastModified,
  });
});

app.post('/api/sync', (req, res) => {
  const { project, items } = req.body;
  if (project) cloudState.project = project;
  if (Array.isArray(items)) cloudState.items = items;
  cloudState.lastModified = Date.now();

  res.json({
    success: true,
    lastModified: cloudState.lastModified,
    itemsCount: cloudState.items.length,
  });
});

// Email dispatch endpoint
app.post('/api/email-report', (req, res) => {
  const { recipientEmail, subject, format, projectName, itemsCount, totalAmount } = req.body;

  console.log(`[Email Dispatch] Sending ${format} report for "${projectName}" to ${recipientEmail}...`);

  // Simulate cloud email delivery service
  setTimeout(() => {
    res.json({
      success: true,
      messageId: `msg-${Date.now()}`,
      sentTo: recipientEmail,
      timestamp: new Date().toISOString(),
      reportFormat: format,
    });
  }, 400);
});

// Vite middleware / static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`COMPLSPEC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

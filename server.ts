import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import authRoutes from './api-gateway/src/routes/auth.routes.ts';
import repoRoutes from './api-gateway/src/routes/repo.routes.ts';
import webhookRoutes from './api-gateway/src/routes/webhook.routes.ts';
import deployRoutes from './api-gateway/src/routes/deploy.routes.ts';
import mediaRoutes from './api-gateway/src/routes/media.routes.ts';
import vietsubRoutes from './api-gateway/src/routes/vietsub.routes.ts';
import systemRoutes from './api-gateway/src/routes/system.routes.ts';
import omniRoutes from './api-gateway/src/routes/omni.routes.ts';
import cloudflareRoutes from './api-gateway/src/routes/cloudflare.routes.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Gateway Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/repos', repoRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/deployments', deployRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/vietsub', vietsubRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/v1', omniRoutes);
  app.use('/api/cloudflare', cloudflareRoutes);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Hendy-Server Master Gateway',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString()
    });
  });

  // Vite Dev Server middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hendy-Server] Core Gateway & UI listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Hendy-Server] Fatal error booting server:', err);
  process.exit(1);
});

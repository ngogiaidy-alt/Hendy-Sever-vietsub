import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.ts';
import repoRoutes from './routes/repo.routes.ts';
import webhookRoutes from './routes/webhook.routes.ts';
import deployRoutes from './routes/deploy.routes.ts';
import mediaRoutes from './routes/media.routes.ts';
import vietsubRoutes from './routes/vietsub.routes.ts';
import systemRoutes from './routes/system.routes.ts';
import omniRoutes from './routes/omni.routes.ts';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Gateway Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/deployments', deployRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/vietsub', vietsubRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/v1', omniRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Hendy API Gateway', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test' && !process.env.AIS_EMBEDDED) {
  app.listen(PORT, () => {
    console.log(`[API-Gateway] Server running on port ${PORT}`);
  });
}

export { app };

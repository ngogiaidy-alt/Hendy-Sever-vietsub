import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { store } from '../services/store.ts';

const router = Router();

// GET /api/system/status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    name: 'Hendy-Server Ecosystem',
    version: '2.8.4-PRO',
    uptimeSeconds: Math.floor(process.uptime()),
    redis: store.redisQueue,
    postgres: {
      status: 'connected',
      activeConnections: 8,
      tables: ['users', 'repositories', 'deployments', 'build_logs', 'media_streams', 'transcription_jobs'],
      diskSizeMb: 128.4
    },
    pythonEngine: {
      status: 'operational',
      cudaAvailable: true,
      gpuModel: 'NVIDIA RTX 4090 / A100 Tensor Core',
      activeWhisperStreams: store.mediaStreams.filter(s => s.status !== 'idle').length,
      maxStreamTabs: 20
    },
    gateway: {
      routesMounted: 14,
      totalDeployments: store.deployments.length,
      totalWebhooks: store.webhooks.length
    }
  });
});

// GET /api/system/code/tree - returns file list
router.get('/code/tree', (req: Request, res: Response) => {
  const fileTree = [
    {
      group: 'Frontend (React 19 / Dashboard)',
      files: [
        'frontend/src/components/Sidebar.tsx',
        'frontend/src/components/Header.tsx',
        'frontend/src/pages/Overview.tsx',
        'frontend/src/pages/Repositories.tsx',
        'frontend/src/pages/Deployments.tsx',
        'frontend/src/pages/VietsubPro.tsx',
        'frontend/src/pages/WebhookInspector.tsx',
        'frontend/src/pages/InfraExplorer.tsx',
        'frontend/src/pages/Settings.tsx',
        'frontend/src/context/AuthContext.tsx',
        'frontend/src/api/client.ts',
        'frontend/package.json',
        'frontend/vite.config.ts'
      ]
    },
    {
      group: 'API Gateway (Node.js / Express / TypeScript)',
      files: [
        'api-gateway/src/routes/auth.routes.ts',
        'api-gateway/src/routes/repo.routes.ts',
        'api-gateway/src/routes/webhook.routes.ts',
        'api-gateway/src/routes/deploy.routes.ts',
        'api-gateway/src/routes/media.routes.ts',
        'api-gateway/src/services/githubClient.ts',
        'api-gateway/src/services/queueProducer.ts',
        'api-gateway/src/services/store.ts',
        'api-gateway/src/server.ts',
        'api-gateway/package.json',
        'api-gateway/tsconfig.json'
      ]
    },
    {
      group: 'VIETSUB PRO & Python Engine',
      files: [
        'python-engine/media_node/media_engine.py',
        'python-engine/media_node/asr_engine.py',
        'python-engine/media_node/translation_engine.py',
        'python-engine/media_node/subtitle_engine.py',
        'python-engine/media_node/multi_stream.py',
        'python-engine/media_node/whisper_asr.py',
        'python-engine/media_node/audio_ducking.py',
        'python-engine/github_worker/git_cloner.py',
        'python-engine/github_worker/builder.py',
        'python-engine/queue_consumer/redis_listener.py',
        'python-engine/requirements.txt',
        'python-engine/main.py'
      ]
    },
    {
      group: 'Infrastructure & DevOps',
      files: [
        'infra/postgres/init_schema.sql',
        'infra/redis/redis.conf',
        'infra/nginx/nginx.conf',
        'infra/docker-compose.yml',
        '.env.example',
        'README.md'
      ]
    }
  ];

  res.json(fileTree);
});

// GET /api/system/code/file?path=...
router.get('/code/file', (req: Request, res: Response) => {
  const relPath = req.query.path as string;
  if (!relPath) {
    return res.status(400).json({ error: 'path query parameter is required' });
  }

  // Prevent path traversal
  const normalized = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.resolve(process.cwd(), normalized);

  if (!fullPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return res.json({ path: normalized, content, size: content.length });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }

  res.status(404).json({ error: 'File not found on disk' });
});

export default router;

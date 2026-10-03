import { Router, Request, Response } from 'express';
import { store } from '../services/store.ts';
import { githubClient } from '../services/githubClient.ts';
import { queueProducer } from '../services/queueProducer.ts';

const router = Router();

// GET /api/repos - lists repositories
router.get('/', async (req: Request, res: Response) => {
  try {
    const repos = await githubClient.listRepositories();
    res.json(repos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repos/:owner/:repo - single repo info
router.get('/:owner/:repo', (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  const found = store.repos.find(r => r.full_name === fullName || r.name === repo);
  if (!found) {
    return res.status(404).json({ error: 'Repository not found' });
  }
  res.json(found);
});

// POST /api/repos/:owner/:repo/webhook - install / toggle webhook
router.post('/:owner/:repo/webhook', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const webhookUrl = req.body.webhookUrl || `${req.protocol}://${req.get('host')}/api/webhooks/github`;
  const secret = store.webhookSecret;

  const result = await githubClient.setupWebhook(owner, repo, webhookUrl, secret);
  res.json({
    success: true,
    message: `Webhook configured successfully for ${owner}/${repo}`,
    webhookUrl,
    result
  });
});

// POST /api/repos/:owner/:repo/build - trigger manual CI build
router.post('/:owner/:repo/build', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const { branch = 'main', commitMessage, environment = 'production' } = req.body;

  const deployment = await queueProducer.pushBuildTask({
    repo: `${owner}/${repo}`,
    branch,
    commitMessage,
    environment
  });

  res.json({
    success: true,
    message: 'Build task dispatched to Redis worker queue',
    deployment
  });
});

export default router;

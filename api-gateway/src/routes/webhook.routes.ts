import { Router, Request, Response } from 'express';
import { store, WebhookLog } from '../services/store.ts';
import { queueProducer } from '../services/queueProducer.ts';

const router = Router();

// POST /api/webhooks/github - Official GitHub webhook endpoint
router.post('/github', (req: Request, res: Response) => {
  const event = req.header('x-github-event') || 'unknown';
  const deliveryId = req.header('x-github-delivery') || `del-${Date.now()}`;
  const signature = req.header('x-hub-signature-256') || '';

  // Get raw body or JSON string
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const isValid = store.verifyGitHubSignature(rawBody, signature);

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const repoName = payload?.repository?.full_name || 'hendy-dev/vietsub-pro-live';
  const sender = payload?.sender?.login || 'github-actions';

  let summary = `Event: ${event}`;
  if (event === 'ping') {
    summary = `Ping from GitHub: ${payload?.zen || 'Service active'}`;
  } else if (event === 'push') {
    const headCommit = payload?.head_commit?.message || payload?.commits?.[0]?.message || 'Push event';
    const ref = payload?.ref || 'refs/heads/main';
    summary = `Push to ${ref} (${headCommit.substring(0, 50)})`;

    // Automatically enqueue automated build if signature is valid or simulation allowed
    if (isValid || req.query.simulate === 'true') {
      const branch = ref.replace('refs/heads/', '');
      queueProducer.pushBuildTask({
        repo: repoName,
        branch,
        commitHash: payload?.after?.substring(0, 7) || 'auto-wh',
        commitMessage: `[Webhook] ${headCommit}`,
        author: sender
      });
    }
  }

  const logEntry: WebhookLog = {
    id: `wh-${Math.floor(1000 + Math.random() * 9000)}`,
    event,
    deliveryId,
    timestamp: new Date().toISOString(),
    signature,
    verified: isValid,
    repo: repoName,
    sender,
    summary,
    payload
  };

  store.webhooks.unshift(logEntry);

  if (!isValid && req.query.bypass !== 'true') {
    return res.status(401).json({
      error: 'Invalid X-Hub-Signature-256 HMAC digest',
      verified: false,
      hint: 'Ensure GITHUB_WEBHOOK_SECRET matches signature hash'
    });
  }

  res.status(200).json({
    status: 'ok',
    verified: isValid,
    event,
    summary,
    deliveryId
  });
});

// GET /api/webhooks/logs - get recent webhooks
router.get('/logs', (req: Request, res: Response) => {
  res.json(store.webhooks);
});

// POST /api/webhooks/simulate - simulate incoming GitHub webhook
router.post('/simulate', (req: Request, res: Response) => {
  const { event = 'push', repo = 'hendy-dev/vietsub-pro-live', branch = 'main', message = 'feat: optimized whisper audio pipeline' } = req.body;

  const mockPayload = {
    ref: `refs/heads/${branch}`,
    before: '8a91b2c',
    after: '3d4e5f6',
    repository: {
      id: 101,
      name: repo.split('/')[1] || repo,
      full_name: repo,
      default_branch: 'main'
    },
    sender: {
      login: store.currentUser?.login || 'hendy-dev',
      avatar_url: store.currentUser?.avatar_url || ''
    },
    head_commit: {
      id: '3d4e5f6',
      message,
      timestamp: new Date().toISOString(),
      author: {
        name: store.currentUser?.name || 'Hendy Developer',
        email: 'developer@hendy-server.internal'
      }
    },
    commits: [
      {
        id: '3d4e5f6',
        message,
        timestamp: new Date().toISOString()
      }
    ]
  };

  const payloadString = JSON.stringify(mockPayload);
  const signature = store.computeSignature(payloadString);

  // Directly process through internal logic
  const logEntry: WebhookLog = {
    id: `wh-${Math.floor(1000 + Math.random() * 9000)}`,
    event,
    deliveryId: `del-sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    signature,
    verified: true,
    repo,
    sender: store.currentUser?.login || 'hendy-dev',
    summary: `Simulated ${event} to refs/heads/${branch} ("${message.substring(0, 40)}...")`,
    payload: mockPayload
  };

  store.webhooks.unshift(logEntry);

  // Trigger build
  queueProducer.pushBuildTask({
    repo,
    branch,
    commitHash: '3d4e5f6',
    commitMessage: `[Webhook Push] ${message}`,
    author: store.currentUser?.login || 'hendy-dev'
  });

  res.json({
    success: true,
    signature,
    deliveryId: logEntry.deliveryId,
    verified: true,
    log: logEntry
  });
});

export default router;

import { Router, Request, Response } from 'express';
import { store } from '../services/store.ts';
import { queueProducer } from '../services/queueProducer.ts';

const router = Router();

// GET /api/deployments - list all deployments
router.get('/', (req: Request, res: Response) => {
  res.json(store.deployments);
});

// GET /api/deployments/:id - single deployment with logs
router.get('/:id', (req: Request, res: Response) => {
  const dep = store.deployments.find(d => d.id === req.params.id);
  if (!dep) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(dep);
});

// POST /api/deployments/trigger - trigger manual deployment
router.post('/trigger', async (req: Request, res: Response) => {
  const { repo = 'hendy-dev/vietsub-pro-live', branch = 'main', environment = 'production', commitMessage } = req.body;

  const deployment = await queueProducer.pushBuildTask({
    repo,
    branch,
    environment,
    commitMessage: commitMessage || `Manual dashboard trigger on ${branch}`
  });

  res.json({
    success: true,
    message: 'Triggered deployment pipeline',
    deployment
  });
});

// POST /api/deployments/:id/rollback - rollback deployment
router.post('/:id/rollback', (req: Request, res: Response) => {
  const dep = store.deployments.find(d => d.id === req.params.id);
  if (!dep) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  const rolledBackDep = store.addDeployment({
    repo: dep.repo,
    branch: dep.branch,
    commitHash: dep.commitHash,
    commitMessage: `Rollback to commit ${dep.commitHash} (${dep.commitMessage})`,
    author: store.currentUser?.login || 'admin',
    status: 'healthy',
    environment: dep.environment,
    version: `${dep.version}-rollback`,
    previewUrl: dep.previewUrl
  });

  rolledBackDep.finishedAt = new Date().toISOString();
  rolledBackDep.logs.push(
    { timestamp: new Date().toLocaleTimeString(), level: 'warn', stage: 'deploy', message: `Emergency rollback initiated for ${dep.id}` },
    { timestamp: new Date().toLocaleTimeString(), level: 'cmd', stage: 'deploy', message: `docker service update --image hendy-registry.internal/${dep.repo}:${dep.commitHash}` },
    { timestamp: new Date().toLocaleTimeString(), level: 'success', stage: 'deploy', message: `Active container image reverted to verified build ${dep.commitHash}. Traffic nominal.` }
  );

  res.json({
    success: true,
    message: `Rolled back to ${dep.commitHash}`,
    deployment: rolledBackDep
  });
});

export default router;

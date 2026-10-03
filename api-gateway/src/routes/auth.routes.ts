import { Router, Request, Response } from 'express';
import { store } from '../services/store.ts';
import { githubClient } from '../services/githubClient.ts';

const router = Router();

// GET /api/auth/user - returns active logged-in user
router.get('/user', (req: Request, res: Response) => {
  res.json({
    authenticated: !!store.currentUser,
    user: store.currentUser
  });
});

// GET /api/auth/login - returns GitHub OAuth URL
router.get('/login', (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID || 'Iv1.hendy_simulated_client';
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/callback`;
  const scope = 'read:user repo admin:repo_hook';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}&state=hendy_${Date.now()}`;

  res.json({
    url: githubAuthUrl,
    clientId,
    scope
  });
});

// POST /api/auth/token - connect with Personal Access Token (PAT)
router.post('/token', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const user = await githubClient.getUser(token);
    if (user) {
      store.currentUser = user;
      return res.json({ success: true, user: store.currentUser });
    }
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Invalid token' });
  }

  // Fallback demo user if token is simulated
  store.currentUser = {
    id: 'gh-user-' + Math.floor(Math.random() * 10000),
    login: 'hendy-developer',
    name: 'Hendy Developer (PAT Active)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    html_url: 'https://github.com/hendy-dev',
    public_repos: 14,
    followers: 120,
    tokenType: 'pat',
    connectedAt: new Date().toISOString()
  };

  res.json({ success: true, user: store.currentUser });
});

// POST /api/auth/logout - disconnect
router.post('/logout', (req: Request, res: Response) => {
  store.currentUser = null;
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

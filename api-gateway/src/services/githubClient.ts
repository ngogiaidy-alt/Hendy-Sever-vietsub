/**
 * GitHub API Client (REST & GraphQL abstraction)
 * Communicates with GitHub API when token is provided, or queries the store.
 */
import { store, Repository } from './store.ts';

export class GitHubClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }

  async getUser(tokenOverride?: string) {
    const token = tokenOverride || this.token;
    if (token && token.startsWith('ghp_')) {
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Hendy-Server-Gateway/2.8.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          return {
            id: String(data.id),
            login: data.login,
            name: data.name || data.login,
            avatar_url: data.avatar_url,
            html_url: data.html_url,
            public_repos: data.public_repos,
            followers: data.followers,
            tokenType: 'pat' as const,
            connectedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.error('Failed to fetch from live GitHub API, falling back to local store', err);
      }
    }
    return store.currentUser;
  }

  async listRepositories(tokenOverride?: string): Promise<Repository[]> {
    const token = tokenOverride || this.token;
    if (token && token.startsWith('ghp_')) {
      try {
        const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Hendy-Server-Gateway/2.8.0'
          }
        });
        if (res.ok) {
          const list = await res.json();
          return list.map((r: any) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            owner: { login: r.owner.login, avatar_url: r.owner.avatar_url },
            description: r.description || 'No description provided.',
            default_branch: r.default_branch || 'main',
            language: r.language || 'Code',
            stars: r.stargazers_count,
            forks: r.forks_count,
            updated_at: r.updated_at,
            webhook_configured: store.repos.some(ex => ex.full_name === r.full_name && ex.webhook_configured),
            branches: [r.default_branch || 'main']
          }));
        }
      } catch (err) {
        console.error('Live repo fetch error, using store list', err);
      }
    }
    return store.repos;
  }

  async setupWebhook(owner: string, repo: string, webhookUrl: string, secret: string) {
    // If live token available, attempt creation on GitHub
    if (this.token && this.token.startsWith('ghp_')) {
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Hendy-Server-Gateway/2.8.0'
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push', 'pull_request', 'release', 'workflow_dispatch'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: secret,
              insecure_ssl: '0'
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, hookId: data.id, live: true };
        }
      } catch (e) {
        console.warn('Live webhook creation skipped, simulating registration', e);
      }
    }

    // Local / simulated registration
    const target = store.repos.find(r => r.full_name === `${owner}/${repo}` || r.name === repo);
    if (target) {
      target.webhook_configured = true;
      target.webhook_url = webhookUrl;
    }
    return { success: true, hookId: Math.floor(100000 + Math.random() * 900000), live: false };
  }
}

export const githubClient = new GitHubClient();

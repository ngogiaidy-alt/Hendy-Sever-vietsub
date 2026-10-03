/**
 * Hendy-Server API Client
 * Type-safe communication with API Gateway endpoints (/api/*)
 */

export interface GitHubUser {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  tokenType: 'oauth' | 'pat' | 'demo';
  connectedAt: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string;
  default_branch: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  webhook_configured: boolean;
  webhook_url?: string;
  branches: string[];
}

export interface BuildLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  stage: 'clone' | 'deps' | 'build' | 'test' | 'docker' | 'deploy';
  message: string;
}

export interface Deployment {
  id: string;
  repo: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  status: 'queued' | 'building' | 'deploying' | 'healthy' | 'failed' | 'rolled_back';
  environment: 'production' | 'staging' | 'worker-node';
  version: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  previewUrl?: string;
  logs: BuildLogEntry[];
  metrics?: {
    cpuPercent: number;
    memoryMb: number;
    latencyMs: number;
    rps: number;
  };
}

export interface WebhookLog {
  id: string;
  event: string;
  deliveryId: string;
  timestamp: string;
  signature: string;
  verified: boolean;
  repo: string;
  sender: string;
  summary: string;
  payload: any;
}

export interface MediaStreamTab {
  id: string;
  name: string;
  channelUrl: string;
  status: 'idle' | 'streaming' | 'transcribing' | 'ducking_active';
  viewers: number;
  fps: number;
  bitrateKbps: number;
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large-v3';
  sourceLanguage: string;
  targetLanguage: string;
  audioDucking: {
    enabled: boolean;
    attenuationDb: number;
    thresholdDb: number;
    duckRatio: number;
    releaseMs: number;
  };
  liveTranscripts: {
    id: string;
    timestamp: string;
    speaker: string;
    originalText: string;
    translatedText: string;
    confidence: number;
  }[];
}

export interface SystemStatus {
  name: string;
  version: string;
  uptimeSeconds: number;
  redis: {
    pendingTasks: number;
    processedTasks: number;
    failedTasks: number;
    activeWorkers: number;
    memoryUsedMb: number;
    connectedClients: number;
  };
  postgres: {
    status: string;
    activeConnections: number;
    tables: string[];
    diskSizeMb: number;
  };
  pythonEngine: {
    status: string;
    cudaAvailable: boolean;
    gpuModel: string;
    activeWhisperStreams: number;
    maxStreamTabs: number;
  };
  gateway: {
    routesMounted: number;
    totalDeployments: number;
    totalWebhooks: number;
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error || err.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  getUser: () => request<{ authenticated: boolean; user: GitHubUser | null }>('/api/auth/user'),
  getLoginUrl: () => request<{ url: string; clientId: string }>('/api/auth/login'),
  connectToken: (token: string) => request<{ success: boolean; user: GitHubUser }>('/api/auth/token', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Repos
  listRepos: () => request<Repository[]>('/api/repos'),
  getRepo: (owner: string, repo: string) => request<Repository>(`/api/repos/${owner}/${repo}`),
  setupWebhook: (owner: string, repo: string, webhookUrl?: string) =>
    request<{ success: boolean; webhookUrl: string }>(`/api/repos/${owner}/${repo}/webhook`, {
      method: 'POST',
      body: JSON.stringify({ webhookUrl })
    }),
  triggerRepoBuild: (owner: string, repo: string, branch = 'main', commitMessage?: string) =>
    request<{ success: boolean; deployment: Deployment }>(`/api/repos/${owner}/${repo}/build`, {
      method: 'POST',
      body: JSON.stringify({ branch, commitMessage })
    }),

  // Deployments
  listDeployments: () => request<Deployment[]>('/api/deployments'),
  getDeployment: (id: string) => request<Deployment>(`/api/deployments/${id}`),
  triggerDeploy: (data: { repo: string; branch: string; environment?: string; commitMessage?: string }) =>
    request<{ success: boolean; deployment: Deployment }>('/api/deployments/trigger', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  rollback: (id: string) =>
    request<{ success: boolean; deployment: Deployment }>(`/api/deployments/${id}/rollback`, {
      method: 'POST'
    }),

  // Webhooks
  getWebhookLogs: () => request<WebhookLog[]>('/api/webhooks/logs'),
  simulateWebhook: (data: { event: string; repo: string; branch: string; message: string }) =>
    request<{ success: boolean; signature: string; log: WebhookLog }>('/api/webhooks/simulate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Media (VIETSUB PRO)
  listStreams: () => request<MediaStreamTab[]>('/api/media/streams'),
  createStream: (data: { name: string; channelUrl: string; whisperModel?: string; sourceLanguage?: string; targetLanguage?: string }) =>
    request<{ success: boolean; stream: MediaStreamTab }>('/api/media/streams', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateDucking: (id: string, data: Partial<MediaStreamTab['audioDucking']>) =>
    request<{ success: boolean; audioDucking: MediaStreamTab['audioDucking'] }>(`/api/media/streams/${id}/ducking`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  addTranscript: (id: string, data: { speaker?: string; originalText: string; translatedText?: string }) =>
    request<{ success: boolean; transcript: any }>(`/api/media/streams/${id}/transcript`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // System & Code Explorer
  getStatus: () => request<SystemStatus>('/api/system/status'),
  getCodeTree: () => request<{ group: string; files: string[] }[]>('/api/system/code/tree'),
  getCodeFile: (path: string) => request<{ path: string; content: string; size: number }>(`/api/system/code/file?path=${encodeURIComponent(path)}`),

  // VIETSUB PRO 5-Tier Suite API
  vietsub: {
    probeMedia: (videoUrl?: string) => request<any>('/api/vietsub/media/probe', {
      method: 'POST',
      body: JSON.stringify({ videoUrl })
    }),
    getFFmpegBurninCommand: (videoFile?: string, subtitleFile?: string, outputFile?: string) =>
      request<{ command: string; videoFile: string; subtitleFile: string; outputFile: string }>('/api/vietsub/media/ffmpeg-burnin', {
        method: 'POST',
        body: JSON.stringify({ videoFile, subtitleFile, outputFile })
      }),
    transcribeASR: (params: { model?: string; vadThreshold?: number; diarization?: boolean }) =>
      request<{ model: string; vadThreshold: number; diarization: boolean; segments: any[] }>('/api/vietsub/asr/transcribe', {
        method: 'POST',
        body: JSON.stringify(params)
      }),
    getGlossary: () => request<{ glossary: { source: string; target: string; notes?: string }[]; contextMemory: string }>('/api/vietsub/translation/glossary'),
    updateGlossary: (glossary: { source: string; target: string; notes?: string }[], contextMemory?: string) =>
      request<{ success: boolean; glossary: any[]; contextMemory: string }>('/api/vietsub/translation/glossary', {
        method: 'POST',
        body: JSON.stringify({ glossary, contextMemory })
      }),
    translateCues: (subtitles: any[], targetLang = 'vi', customGlossary?: any[], contextOverride?: string) =>
      request<{ success: boolean; results: { id: string; original: string; translated: string }[] }>('/api/vietsub/translation/translate', {
        method: 'POST',
        body: JSON.stringify({ subtitles, targetLang, customGlossary, contextOverride })
      }),
    optimizeCPS: (cues: any[], maxCps = 20) =>
      request<{ evaluated: any[]; maxCps: number; flaggedCount: number }>('/api/vietsub/subtitle/optimize-cps', {
        method: 'POST',
        body: JSON.stringify({ cues, maxCps })
      }),
    correctTiming: (cues: any[], minDuration = 1.0, maxGapSnap = 0.25) =>
      request<{ success: boolean; correctedCues: any[] }>('/api/vietsub/subtitle/correct-timing', {
        method: 'POST',
        body: JSON.stringify({ cues, minDuration, maxGapSnap })
      }),
    exportSubtitles: (cues: any[], format: 'srt' | 'ass' | 'vtt' | 'json', title?: string) =>
      request<{ format: string; content: string; filename: string }>('/api/vietsub/subtitle/export', {
        method: 'POST',
        body: JSON.stringify({ cues, format, title })
      }),
    getDemoProject: () => request<{ videoTitle: string; videoUrl: string; duration: number; cues: any[] }>('/api/vietsub/demo')
  },

  // Omni-Frontends & Microservices Layer (v1)
  omni: {
    getProducts: () => request<{ products: any[]; cacheStatus: string; totalProducts: number }>('/api/v1/storefront/products'),
    getOrders: () => request<any[]>('/api/v1/storefront/orders'),
    createOrder: (orderData: any) => request<{ success: boolean; order: any; syncEvent: string }>('/api/v1/storefront/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
    getInventorySync: () => request<{ timestamp: string; stores: any[]; inventory: any[] }>('/api/v1/inventory/sync'),
    verifyTelegramInitData: (initData: string, botToken?: string) => request<any>('/api/v1/telegram/verify-initdata', {
      method: 'POST',
      body: JSON.stringify({ initData, botToken })
    }),
    getTelegramLogs: () => request<any[]>('/api/v1/telegram/logs'),
    analyzeAutomation: (data: { appIdea: string; targetPlatforms?: string[]; offlineRequirement?: boolean }) =>
      request<any>('/api/v1/automation/analyze', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getEdgeSignedUrl: (fileName: string, platform = 'windows') =>
      request<any>('/api/v1/edge/signed-url', {
        method: 'POST',
        body: JSON.stringify({ fileName, platform })
      })
  },

  // Cloudflare Deployment & GitHub Sync
  cloudflare: {
    getStatus: () => request<any>('/api/cloudflare/status'),
    testDeployHook: (hookUrl: string, projectName?: string) =>
      request<any>('/api/cloudflare/test-hook', {
        method: 'POST',
        body: JSON.stringify({ hookUrl, projectName })
      }),
    simulateGitPush: (data: { githubUsername: string; repoName: string; branch?: string; commitMessage?: string }) =>
      request<any>('/api/cloudflare/simulate-git-push', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};


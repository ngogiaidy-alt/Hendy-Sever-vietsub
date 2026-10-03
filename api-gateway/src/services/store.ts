import crypto from 'node:crypto';

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
    attenuationDb: number; // e.g. -14dB
    thresholdDb: number;   // e.g. -22dB
    duckRatio: number;      // 4:1
    releaseMs: number;     // 250ms
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

class SystemStore {
  public currentUser: GitHubUser | null = {
    id: 'hendy-developer',
    login: 'hendy-dev',
    name: 'Hendy Developer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    html_url: 'https://github.com/hendy-dev',
    public_repos: 14,
    followers: 86,
    tokenType: 'demo',
    connectedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  };

  public repos: Repository[] = [
    {
      id: 101,
      name: 'vietsub-pro-live',
      full_name: 'hendy-dev/vietsub-pro-live',
      owner: { login: 'hendy-dev', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      description: 'Real-time multi-tab livestream Whisper ASR, AI translation, and automatic sidechain audio ducking engine',
      default_branch: 'main',
      language: 'Python',
      stars: 428,
      forks: 67,
      updated_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      webhook_configured: true,
      webhook_url: 'https://gateway.hendy-server.internal/api/webhooks/github',
      branches: ['main', 'feature/whisper-large-v3', 'fix/audio-buffer-overflow']
    },
    {
      id: 102,
      name: 'hendy-api-gateway',
      full_name: 'hendy-dev/hendy-api-gateway',
      owner: { login: 'hendy-dev', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      description: 'High-throughput Node.js/Express gateway dispatching GitHub Webhooks into Redis task queues',
      default_branch: 'master',
      language: 'TypeScript',
      stars: 184,
      forks: 23,
      updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      webhook_configured: true,
      webhook_url: 'https://gateway.hendy-server.internal/api/webhooks/github',
      branches: ['master', 'release/v2.4.0', 'refactor/redis-cluster']
    },
    {
      id: 103,
      name: 'media-node-cluster',
      full_name: 'hendy-dev/media-node-cluster',
      owner: { login: 'hendy-dev', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      description: 'Distributed 20-stream concurrent ingestion worker with GPU CUDA Whisper acceleration',
      default_branch: 'main',
      language: 'Python',
      stars: 312,
      forks: 45,
      updated_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      webhook_configured: false,
      branches: ['main', 'develop']
    },
    {
      id: 104,
      name: 'frontend-dashboard',
      full_name: 'hendy-dev/frontend-dashboard',
      owner: { login: 'hendy-dev', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      description: 'Enterprise React 19 / Tailwind developer console for Hendy-Server ecosystem',
      default_branch: 'main',
      language: 'TypeScript',
      stars: 95,
      forks: 12,
      updated_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      webhook_configured: true,
      webhook_url: 'https://gateway.hendy-server.internal/api/webhooks/github',
      branches: ['main']
    }
  ];

  public deployments: Deployment[] = [
    {
      id: 'dep-9941',
      repo: 'hendy-dev/vietsub-pro-live',
      branch: 'main',
      commitHash: '8b7f20e',
      commitMessage: 'feat(whisper): add Vietnamese streaming tokenizer & sidechain ducking filter',
      author: 'hendy-dev',
      status: 'healthy',
      environment: 'production',
      version: 'v2.8.4',
      startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      durationMs: 184000,
      previewUrl: 'https://vietsub.hendy-server.app',
      metrics: {
        cpuPercent: 34.2,
        memoryMb: 1420,
        latencyMs: 18.4,
        rps: 412
      },
      logs: [
        { timestamp: '14:20:01', level: 'info', stage: 'clone', message: 'Initialized empty Git repository in /tmp/build/vietsub-pro-live' },
        { timestamp: '14:20:03', level: 'cmd', stage: 'clone', message: 'git fetch --depth=1 origin main' },
        { timestamp: '14:20:06', level: 'success', stage: 'clone', message: 'Fetched 8b7f20e (8.4 MB) in 2.94s' },
        { timestamp: '14:20:08', level: 'info', stage: 'deps', message: 'Resolving Python requirements.txt (PyTorch 2.3, openai-whisper, ffmpeg-python)' },
        { timestamp: '14:20:30', level: 'success', stage: 'deps', message: 'Cached packages verified, 0 vulnerabilities' },
        { timestamp: '14:20:32', level: 'cmd', stage: 'docker', message: 'docker build -t hendy/vietsub-engine:v2.8.4 -f Dockerfile .' },
        { timestamp: '14:21:40', level: 'info', stage: 'docker', message: 'Step 6/12: CUDA cuDNN 8.9 layer baked successfully' },
        { timestamp: '14:22:10', level: 'cmd', stage: 'test', message: 'pytest tests/test_audio_ducking.py -v' },
        { timestamp: '14:22:25', level: 'success', stage: 'test', message: '18 passed in 14.8s (100% pass rate)' },
        { timestamp: '14:22:30', level: 'info', stage: 'deploy', message: 'Rolling update applied to worker cluster (20 replica pods)' },
        { timestamp: '14:23:05', level: 'success', stage: 'deploy', message: 'Deployment healthy. All health checks responded HTTP 200 OK' }
      ]
    },
    {
      id: 'dep-9938',
      repo: 'hendy-dev/hendy-api-gateway',
      branch: 'master',
      commitHash: '3c19a41',
      commitMessage: 'perf(gateway): optimize webhook HMAC signature verification with timingSafeEqual',
      author: 'hendy-dev',
      status: 'healthy',
      environment: 'production',
      version: 'v2.4.0',
      startedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 178).toISOString(),
      durationMs: 98000,
      previewUrl: 'https://gateway.hendy-server.app',
      metrics: {
        cpuPercent: 12.8,
        memoryMb: 380,
        latencyMs: 4.2,
        rps: 1890
      },
      logs: [
        { timestamp: '12:05:10', level: 'info', stage: 'clone', message: 'Cloned branch master @ 3c19a41' },
        { timestamp: '12:05:30', level: 'info', stage: 'deps', message: 'npm ci --prefer-offline' },
        { timestamp: '12:06:12', level: 'cmd', stage: 'build', message: 'npm run build (esbuild bundle for Node.js runtime)' },
        { timestamp: '12:06:35', level: 'success', stage: 'deploy', message: 'Zero-downtime Nginx reload finished' }
      ]
    }
  ];

  public webhooks: WebhookLog[] = [
    {
      id: 'wh-8812',
      event: 'push',
      deliveryId: 'd-9f4c3b21-4819-482a-a92c-554109867011',
      timestamp: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
      signature: 'sha256=4f9812bc879a01e3895a974bfa293c089201948572019b8471049c8129841029',
      verified: true,
      repo: 'hendy-dev/vietsub-pro-live',
      sender: 'hendy-dev',
      summary: 'Push to refs/heads/main (1 commit) by hendy-dev',
      payload: {
        ref: 'refs/heads/main',
        before: 'a12bc90',
        after: '8b7f20e',
        commits: [
          {
            id: '8b7f20e',
            message: 'feat(whisper): add Vietnamese streaming tokenizer & sidechain ducking filter',
            author: { name: 'Hendy Developer', email: 'hendy@example.com' },
            added: ['python-engine/media_node/audio_ducking.py'],
            modified: ['python-engine/media_node/whisper_asr.py']
          }
        ]
      }
    },
    {
      id: 'wh-8810',
      event: 'ping',
      deliveryId: 'd-10294871-3321-4478-bc12-990184750192',
      timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      signature: 'sha256=102948192a83749bcf8291039847192837401928374019283740192837401928',
      verified: true,
      repo: 'hendy-dev/hendy-api-gateway',
      sender: 'hendy-dev',
      summary: 'GitHub Webhook Ping test successful (zen: Design for failure)',
      payload: {
        zen: 'Design for failure.',
        hook_id: 99482103
      }
    }
  ];

  public mediaStreams: MediaStreamTab[] = [
    {
      id: 'stream-tab-01',
      name: 'Tab 01: VTV1 Thời Sự & Báo Chí Live',
      channelUrl: 'rtmp://live.hendy-server.internal/live/vtv1_stream',
      status: 'ducking_active',
      viewers: 1420,
      fps: 60,
      bitrateKbps: 4500,
      whisperModel: 'large-v3',
      sourceLanguage: 'vi',
      targetLanguage: 'en',
      audioDucking: {
        enabled: true,
        attenuationDb: -16,
        thresholdDb: -24,
        duckRatio: 4,
        releaseMs: 300
      },
      liveTranscripts: [
        {
          id: 'tr-01',
          timestamp: '21:50:12',
          speaker: 'BTV Hữu Bằng',
          originalText: 'Hôm nay Thủ tướng Chính phủ đã chủ trì phiên họp chuyên đề về chuyển đổi số quốc gia.',
          translatedText: 'Today the Prime Minister chaired a specialized session on national digital transformation.',
          confidence: 0.98
        },
        {
          id: 'tr-02',
          timestamp: '21:50:28',
          speaker: 'BTV Hữu Bằng',
          originalText: 'Các giải pháp ứng dụng trí tuệ nhân tạo và xử lý dữ liệu lớn được đẩy mạnh.',
          translatedText: 'Artificial intelligence application solutions and big data processing are accelerated.',
          confidence: 0.96
        },
        {
          id: 'tr-03',
          timestamp: '21:51:04',
          speaker: 'BTV Thu Hà',
          originalText: 'Hệ thống hạ tầng mạng băng rộng thế hệ mới tiếp tục được triển khai tại các trung tâm kinh tế.',
          translatedText: 'Next-generation broadband network infrastructure continues to be deployed across economic hubs.',
          confidence: 0.97
        }
      ]
    },
    {
      id: 'stream-tab-02',
      name: 'Tab 02: Bloomberg Global Tech Live Stream',
      channelUrl: 'https://stream.bloomberg.internal/hls/live.m3u8',
      status: 'ducking_active',
      viewers: 3890,
      fps: 60,
      bitrateKbps: 5200,
      whisperModel: 'large-v3',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      audioDucking: {
        enabled: true,
        attenuationDb: -18,
        thresholdDb: -22,
        duckRatio: 5,
        releaseMs: 250
      },
      liveTranscripts: [
        {
          id: 'tr-04',
          timestamp: '21:50:40',
          speaker: 'Lead Anchor',
          originalText: 'Tech equities are rebounding sharply following record quarterly cloud infrastructure earnings.',
          translatedText: 'Cổ phiếu công nghệ đang phục hồi mạnh mẽ sau kết quả kinh doanh hạ tầng đám mây kỷ lục.',
          confidence: 0.99
        },
        {
          id: 'tr-05',
          timestamp: '21:51:15',
          speaker: 'Market Strategist',
          originalText: 'Enterprise adoption for autonomous media processing engines has surged by nearly forty percent year over year.',
          translatedText: 'Mức độ ứng dụng doanh nghiệp cho các công cụ xử lý truyền thông tự động đã tăng gần 40% so với cùng kỳ.',
          confidence: 0.95
        }
      ]
    },
    {
      id: 'stream-tab-03',
      name: 'Tab 03: Gaming Esports Finals Stage (20 Tabs Capacity)',
      channelUrl: 'rtmp://twitch.internal/live/finals_main',
      status: 'transcribing',
      viewers: 12400,
      fps: 60,
      bitrateKbps: 8000,
      whisperModel: 'medium',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      audioDucking: {
        enabled: true,
        attenuationDb: -12,
        thresholdDb: -18,
        duckRatio: 3.5,
        releaseMs: 200
      },
      liveTranscripts: [
        {
          id: 'tr-06',
          timestamp: '21:51:22',
          speaker: 'Caster Alpha',
          originalText: 'Unbelievable flanking maneuver on the top lane! That might seal game five!',
          translatedText: 'Pha bọc sườn không thể tin được ở đường trên! Pha xử lý đó có thể định đoạt ván 5!',
          confidence: 0.94
        }
      ]
    },
    {
      id: 'stream-tab-04',
      name: 'Tab 04: AI & Deep Learning Keynote Conference',
      channelUrl: 'rtmp://stream.conference.internal/stage_a',
      status: 'idle',
      viewers: 520,
      fps: 30,
      bitrateKbps: 3200,
      whisperModel: 'base',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      audioDucking: {
        enabled: false,
        attenuationDb: -14,
        thresholdDb: -20,
        duckRatio: 4,
        releaseMs: 300
      },
      liveTranscripts: []
    }
  ];

  public redisQueue = {
    pendingTasks: 3,
    processedTasks: 18420,
    failedTasks: 2,
    activeWorkers: 6,
    memoryUsedMb: 64.8,
    connectedClients: 14
  };

  public webhookSecret: string = 'hendy_secure_webhook_secret_2026';

  // Methods
  public addDeployment(dep: Omit<Deployment, 'id' | 'startedAt' | 'logs'>): Deployment {
    const newDep: Deployment = {
      ...dep,
      id: `dep-${Math.floor(1000 + Math.random() * 9000)}`,
      startedAt: new Date().toISOString(),
      logs: [
        { timestamp: new Date().toLocaleTimeString(), level: 'info', stage: 'clone', message: `Task pulled from Redis queue. Worker node assigned.` },
        { timestamp: new Date().toLocaleTimeString(), level: 'cmd', stage: 'clone', message: `python -m github_worker.git_cloner --repo ${dep.repo} --branch ${dep.branch}` }
      ]
    };
    this.deployments.unshift(newDep);
    return newDep;
  }

  public verifyGitHubSignature(payloadBuffer: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.webhookSecret) return false;
    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') return false;

    const signature = parts[1];
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadBuffer)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }

  public computeSignature(payloadString: string): string {
    return 'sha256=' + crypto.createHmac('sha256', this.webhookSecret).update(payloadString).digest('hex');
  }
}

export const store = new SystemStore();

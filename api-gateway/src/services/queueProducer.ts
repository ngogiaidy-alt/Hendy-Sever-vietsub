/**
 * Redis Queue Producer
 * Enqueues build tasks, pipeline triggers, and media processing jobs.
 */
import { store, Deployment, BuildLogEntry } from './store.ts';

export interface QueueJob {
  jobId: string;
  type: 'github_build' | 'media_stream_ingest' | 'whisper_asr' | 'audio_ducking';
  payload: any;
  priority: number;
  enqueuedAt: string;
}

export class QueueProducer {
  private activeTimers: Map<string, NodeJS.Timeout[]> = new Map();

  async pushBuildTask(taskData: {
    repo: string;
    branch: string;
    commitHash?: string;
    commitMessage?: string;
    author?: string;
    environment?: 'production' | 'staging' | 'worker-node';
  }): Promise<Deployment> {
    const deployment = store.addDeployment({
      repo: taskData.repo,
      branch: taskData.branch,
      commitHash: taskData.commitHash || Math.random().toString(16).substring(2, 9),
      commitMessage: taskData.commitMessage || `Manual CI trigger on branch ${taskData.branch}`,
      author: taskData.author || store.currentUser?.login || 'hendy-dev',
      status: 'building',
      environment: taskData.environment || 'production',
      version: `v${Math.floor(Math.random() * 3 + 2)}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 10)}`,
      previewUrl: `https://${taskData.repo.split('/')[1] || 'app'}.hendy-server.internal`
    });

    store.redisQueue.pendingTasks += 1;

    // Simulate Python Worker execution asynchronously with live log streaming
    this.simulatePythonWorkerBuild(deployment.id, taskData.repo, taskData.branch);

    return deployment;
  }

  private simulatePythonWorkerBuild(depId: string, repo: string, branch: string) {
    const logSteps: { delay: number; log: BuildLogEntry; status?: Deployment['status'] }[] = [
      {
        delay: 800,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'cmd',
          stage: 'clone',
          message: `[python-engine/github_worker/git_cloner.py] Executing: git clone --depth 50 --branch ${branch} https://github.com/${repo}.git /workspace/build/${depId}`
        }
      },
      {
        delay: 2000,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          stage: 'clone',
          message: `Cloned 184 files in 1.18s. Git SHA checkout verified.`
        }
      },
      {
        delay: 3500,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          stage: 'deps',
          message: `[python-engine/github_worker/builder.py] Detected stack: Python 3.11 + Docker multi-stage target.`
        }
      },
      {
        delay: 5000,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'cmd',
          stage: 'docker',
          message: `docker buildx build --platform linux/amd64 -t hendy-registry.internal/${repo}:${depId} --push .`
        }
      },
      {
        delay: 7500,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          stage: 'docker',
          message: `Building layers: [1/6] FROM python:3.11-slim -> [2/6] RUN apt-get install ffmpeg libsndfile1 -> [3/6] RUN pip install -r requirements.txt`
        }
      },
      {
        delay: 10000,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'cmd',
          stage: 'test',
          message: `pytest -v tests/ --maxfail=1 --cov=media_node`
        }
      },
      {
        delay: 12500,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          stage: 'test',
          message: `24 unit tests passed. Code coverage: 96.4%. Zero regressions.`
        }
      },
      {
        delay: 14500,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          stage: 'deploy',
          message: `Deploying container pod into Kubernetes / Docker Swarm cluster... Updating Nginx upstream socket.`
        },
        status: 'deploying'
      },
      {
        delay: 17000,
        log: {
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          stage: 'deploy',
          message: `Service live and accepting traffic. Ingress proxy health checks: 200 OK. Latency: 14ms.`
        },
        status: 'healthy'
      }
    ];

    const timeouts: NodeJS.Timeout[] = [];

    logSteps.forEach(step => {
      const t = setTimeout(() => {
        const dep = store.deployments.find(d => d.id === depId);
        if (dep) {
          dep.logs.push(step.log);
          if (step.status) {
            dep.status = step.status;
            if (step.status === 'healthy') {
              dep.finishedAt = new Date().toISOString();
              dep.durationMs = Date.now() - new Date(dep.startedAt).getTime();
              dep.metrics = {
                cpuPercent: Math.round(15 + Math.random() * 30),
                memoryMb: Math.round(600 + Math.random() * 800),
                latencyMs: Math.round(12 + Math.random() * 15),
                rps: Math.round(100 + Math.random() * 400)
              };
              store.redisQueue.pendingTasks = Math.max(0, store.redisQueue.pendingTasks - 1);
              store.redisQueue.processedTasks += 1;
            }
          }
        }
      }, step.delay);
      timeouts.push(t);
    });

    this.activeTimers.set(depId, timeouts);
  }
}

export const queueProducer = new QueueProducer();

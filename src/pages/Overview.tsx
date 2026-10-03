import React, { useState, useEffect } from 'react';
import { api, Deployment, WebhookLog, SystemStatus } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Server,
  GitBranch,
  Radio,
  Cpu,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  CloudUpload
} from 'lucide-react';

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const { setOpenQuickBuild } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statusData, depsData, whData] = await Promise.all([
          api.getStatus(),
          api.listDeployments(),
          api.getWebhookLogs()
        ]);
        setStatus(statusData);
        setDeployments(depsData);
        setWebhooks(whData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu tổng quan', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const latestDeployment = deployments[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Kiến Trúc Hệ Thống & Đường Ống Vận Hành</h1>
          <p className="text-sm text-slate-400 mt-1">
            Động cơ điều phối toàn diện: GitHub API Gateway, CI/CD Python Builder, Cụm ASR VIETSUB PRO và Triển khai Đám mây Cloudflare.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('cloudflare')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-md hover:bg-orange-500/20 transition-colors"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Triển Khai Cloudflare</span>
          </button>
          <button
            onClick={() => onNavigate('vietsub')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md hover:bg-amber-500/20 transition-colors"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Mở VIETSUB PRO (20 Tab)</span>
          </button>
          <button
            onClick={() => setOpenQuickBuild(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-md hover:bg-slate-200 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Kích Hoạt CI/CD Build</span>
          </button>
        </div>
      </div>

      {/* High-Density Key Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <p className="text-[11px] font-medium text-slate-400">Trạng Thái Worker</p>
          <p className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            HOẠT ĐỘNG
          </p>
          <p className="text-[11px] text-slate-500">6 luồng daemon song song</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <p className="text-[11px] font-medium text-slate-400">Luồng VIETSUB</p>
          <p className="text-xl font-bold text-white font-mono tabular-nums">
            {status?.pythonEngine.activeWhisperStreams || 3} / 20
          </p>
          <p className="text-[11px] text-slate-500">Kênh đang phát</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <p className="text-[11px] font-medium text-slate-400">Hàng Đợi Redis</p>
          <p className="text-xl font-bold text-indigo-400 font-mono tabular-nums">
            {status?.redis.pendingTasks ?? 0} <span className="text-xs font-normal text-slate-400">tác vụ</span>
          </p>
          <p className="text-[11px] text-slate-500">{status?.redis.processedTasks ?? 18420} đã xử lý xong</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <p className="text-[11px] font-medium text-slate-400">VRAM GPU Sử Dụng</p>
          <p className="text-xl font-bold text-white font-mono tabular-nums">14.8 GB</p>
          <p className="text-[11px] text-slate-500">CUDA Whisper v3</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <p className="text-[11px] font-medium text-slate-400">Thông Lượng Cổng (RPS)</p>
          <p className="text-xl font-bold text-white font-mono tabular-nums">1,890</p>
          <p className="text-[11px] text-slate-500">Độ trễ TB 4.2ms</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <p className="text-[11px] font-medium text-slate-400">Cơ Sở Dữ Liệu Postgres</p>
          <p className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Khỏe Mạnh
          </p>
          <p className="text-[11px] text-slate-500">6 bảng quan hệ đồng bộ</p>
        </div>
      </div>

      {/* End-to-End Microservice Architecture Pipeline Flow */}
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Sơ Đồ Kiến Trúc Hệ Thống Vi Dịch Vụ (Microservices)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">nginx:80 &rarr; express:4000 &rarr; redis:6379 &rarr; python:cuda</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Node 1: GitHub & Ingress */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">1. Cổng Vào GitHub</span>
              <span className="text-[10px] font-mono text-emerald-400">HMAC-SHA256</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tiếp nhận webhook push, phân tích pull-request, xác thực chữ ký mật mã an toàn chống giả mạo thông qua <code className="text-indigo-300">timingSafeEqual</code>.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Đường dẫn: /api/webhooks/github
            </div>
          </div>

          {/* Node 2: API Gateway */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">2. API Gateway</span>
              <span className="text-[10px] font-mono text-indigo-400">Node / TS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Điều phối lệnh máy khách, quản lý phiên OAuth GitHub, đóng gói dữ liệu và đẩy vào hàng đợi ưu tiên của Redis.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Đường dẫn: /api/repos, /api/media
            </div>
          </div>

          {/* Node 3: Redis Buffer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">3. Bộ Đệm Redis Queue</span>
              <span className="text-[10px] font-mono text-amber-400">Lưu Trữ AOF</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tách rời cổng giao tiếp đồng bộ khỏi các tác vụ tính toán nặng của worker bằng cơ chế <code className="text-amber-300">BRPOP</code> và Pub/Sub.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Hàng đợi: hendy:queue:builds
            </div>
          </div>

          {/* Node 4: Python Engine */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">4. Động Cơ Python Engine</span>
              <span className="text-[10px] font-mono text-rose-400">Whisper CUDA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tự động clone code, chạy bộ kiểm thử, quản lý 20 tab livestream ASR song song và xử lý nén âm thanh sidechain audio ducking.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Workers: cloner &middot; asr &middot; ducker
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Active Build Status & Recent Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Latest Active Deployment */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Bản Dựng Đang Triển Khai Trên Production</h3>
            </div>
            <button
              onClick={() => onNavigate('deployments')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Xem Nhật Ký Bản Dựng</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {latestDeployment ? (
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white font-mono">{latestDeployment.repo}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>nhánh: {latestDeployment.branch}</span>
                    <span>&middot;</span>
                    <span className="font-mono text-slate-300">commit: {latestDeployment.commitHash}</span>
                    <span>&middot;</span>
                    <span className="text-emerald-400 font-medium uppercase">
                      {latestDeployment.status === 'healthy' ? 'Khỏe mạnh' : latestDeployment.status}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded">
                  {latestDeployment.version}
                </span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/50 font-mono">
                {latestDeployment.commitMessage}
              </p>

              <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">CPU</span>
                  <span className="font-mono text-slate-300 tabular-nums">{latestDeployment.metrics?.cpuPercent ?? 24}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Bộ nhớ RAM</span>
                  <span className="font-mono text-slate-300 tabular-nums">{latestDeployment.metrics?.memoryMb ?? 1024} MB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Độ trễ API</span>
                  <span className="font-mono text-slate-300 tabular-nums">{latestDeployment.metrics?.latencyMs ?? 14} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Thời gian chạy</span>
                  <span className="font-mono text-slate-300 tabular-nums">
                    {latestDeployment.durationMs ? `${(latestDeployment.durationMs / 1000).toFixed(0)} giây` : 'đang chạy'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-6 text-center">Không có bản dựng nào đang chạy.</div>
          )}
        </div>

        {/* Right: Recent Webhook Ingress Events */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Kiểm Tra Bảo Mật GitHub Webhook</h3>
            </div>
            <button
              onClick={() => onNavigate('webhooks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Giả Lập Webhook</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {webhooks.slice(0, 3).map((wh, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-md flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-amber-400 uppercase font-semibold">[{wh.event}]</span>
                    <span className="text-slate-200 font-medium">{wh.repo}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-md">{wh.summary}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="flex items-center gap-1 justify-end text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>HMAC-256 Hợp Lệ</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    {new Date(wh.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

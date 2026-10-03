import React, { useState, useEffect } from 'react';
import { api, Deployment } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { TerminalLogs } from '../components/TerminalLogs.tsx';
import {
  Terminal,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  GitCommit,
  ExternalLink
} from 'lucide-react';

export const Deployments: React.FC = () => {
  const { showNotification, setOpenQuickBuild } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [rollingBack, setRollingBack] = useState<boolean>(false);

  const loadDeployments = async () => {
    try {
      const data = await api.listDeployments();
      setDeployments(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Không thể tải danh sách bản dựng', err);
    }
  };

  useEffect(() => {
    loadDeployments();
    const interval = setInterval(loadDeployments, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeDeployment = deployments.find(d => d.id === selectedId) || deployments[0];

  const handleRollback = async (id: string) => {
    setRollingBack(true);
    try {
      const res = await api.rollback(id);
      if (res.success) {
        showNotification(`Đã khôi phục thành công về commit ${res.deployment.commitHash}`, 'success');
        loadDeployments();
        setSelectedId(res.deployment.id);
      }
    } catch (err: any) {
      showNotification(err.message || 'Khôi phục bản dựng thất bại', 'error');
    } finally {
      setRollingBack(false);
    }
  };

  const getStatusIndicator = (status: Deployment['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Khỏe mạnh
          </span>
        );
      case 'building':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Đang đóng gói
          </span>
        );
      case 'deploying':
        return (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Đang triển khai
          </span>
        );
      case 'rolled_back':
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RotateCcw className="w-3 h-3 text-slate-400" />
            Đã hoàn tác
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Thất bại
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Đường Ống CI/CD & Lịch Sử Bản Dựng</h1>
          <p className="text-sm text-slate-400 mt-1">
            Tự động kéo mã nguồn từ Git, đóng gói Docker container, chạy bộ kiểm thử và triển khai không gián đoạn (zero-downtime).
          </p>
        </div>
        <button
          onClick={() => setOpenQuickBuild(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-md hover:bg-slate-200 transition-colors shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Tạo Bản Dựng Mới</span>
        </button>
      </div>

      {/* Main Two-Panel Layout: Deployment List vs Terminal Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deployment History List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-300">Lịch Sử Các Bản Dựng</span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">{deployments.length} lần chạy</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {deployments.map(dep => {
              const isSelected = dep.id === activeDeployment?.id;
              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedId(dep.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{dep.version}</span>
                        <span className="font-mono text-xs text-slate-400">{dep.repo.split('/')[1] || dep.repo}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">{dep.commitMessage}</p>
                    </div>
                    {getStatusIndicator(dep.status)}
                  </div>

                  {/* Metadata Row: Zero-Pill with · */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                    <span className="font-mono text-slate-400">{dep.commitHash}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{dep.branch}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="font-mono tabular-nums">
                      {dep.durationMs ? `${(dep.durationMs / 1000).toFixed(0)}s` : 'đang chạy'}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span>@{dep.author}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Deployment Detail & Terminal Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeDeployment ? (
            <>
              {/* Detailed Header Card */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">{activeDeployment.version}</h3>
                      <span className="text-xs font-mono text-slate-400">({activeDeployment.id})</span>
                      {getStatusIndicator(activeDeployment.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Môi trường đích: <span className="text-slate-200 capitalize">{activeDeployment.environment === 'production' ? 'Sản xuất' : 'Thử nghiệm'}</span>
                    </p>
                  </div>

                  {/* Action: Rollback */}
                  <div className="flex items-center gap-2">
                    {activeDeployment.previewUrl && (
                      <a
                        href={activeDeployment.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        <span>Xem Cổng Vào</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}
                    <button
                      disabled={rollingBack || activeDeployment.status !== 'healthy'}
                      onClick={() => handleRollback(activeDeployment.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded transition-colors disabled:opacity-40"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>{rollingBack ? 'Đang hoàn tác...' : 'Hoàn Tác Bản Dựng'}</span>
                    </button>
                  </div>
                </div>

                {/* Commit info block */}
                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono text-slate-300">{activeDeployment.commitHash}</span>
                    <span className="text-slate-500">&middot;</span>
                    <span>Commit bởi {activeDeployment.author}</span>
                  </div>
                  <p className="text-slate-200 font-mono text-xs">{activeDeployment.commitMessage}</p>
                </div>
              </div>

              {/* Terminal Logs Viewer */}
              <div className="h-[480px]">
                <TerminalLogs
                  logs={activeDeployment.logs}
                  title={`Nhật Ký Bảng Điều Khiển [${activeDeployment.id} &middot; ${activeDeployment.repo}]`}
                  isStreaming={activeDeployment.status === 'building' || activeDeployment.status === 'deploying'}
                />
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-lg">
              Chọn một bản dựng để xem chi tiết thông tin log.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

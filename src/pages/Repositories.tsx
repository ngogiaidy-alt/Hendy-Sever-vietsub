import React, { useState, useEffect } from 'react';
import { api, Repository } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  GitBranch,
  Star,
  GitFork,
  Webhook,
  Play,
  Search,
  ExternalLink,
  Check,
  Shield,
  Key,
  CloudUpload
} from 'lucide-react';

interface RepositoriesProps {
  onNavigate: (tab: string) => void;
}

export const Repositories: React.FC<RepositoriesProps> = ({ onNavigate }) => {
  const { showNotification } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRepoForBuild, setSelectedRepoForBuild] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('');
  const [building, setBuilding] = useState(false);

  const loadRepos = async () => {
    try {
      const data = await api.listRepos();
      setRepos(data);
    } catch (err) {
      console.error('Không thể tải danh sách kho lưu trữ', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const handleToggleWebhook = async (repo: Repository) => {
    try {
      const [owner, name] = repo.full_name.split('/');
      const res = await api.setupWebhook(owner, name);
      if (res.success) {
        showNotification(`Đã thiết lập Webhook cho ${repo.full_name} (Xác thực HMAC-SHA256 kích hoạt)`, 'success');
        loadRepos();
      }
    } catch (err: any) {
      showNotification(err.message || 'Cài đặt webhook thất bại', 'error');
    }
  };

  const handleTriggerBuild = async () => {
    if (!selectedRepoForBuild) return;
    setBuilding(true);
    try {
      const [owner, name] = selectedRepoForBuild.full_name.split('/');
      const res = await api.triggerRepoBuild(owner, name, selectedBranch, commitMessage || undefined);
      if (res.success) {
        showNotification(`Bản dựng ${res.deployment.id} đã được đưa vào hàng đợi Redis!`, 'success');
        setSelectedRepoForBuild(null);
        setCommitMessage('');
        onNavigate('deployments');
      }
    } catch (err: any) {
      showNotification(err.message || 'Kích hoạt bản dựng thất bại', 'error');
    } finally {
      setBuilding(false);
    }
  };

  const filteredRepos = repos.filter(
    r =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.language?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Kho Lưu Trữ GitHub Đã Kết Nối</h1>
          <p className="text-sm text-slate-400 mt-1">
            Đồng bộ mã nguồn từ GitHub với đường ống CI/CD của Hendy-Server và kết nối xuất bản tự động lên Cloudflare Pages.
          </p>
        </div>

        {/* Search Bar & Action */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm kho lưu trữ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => onNavigate('cloudflare')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-md hover:bg-orange-500/20 transition-colors shrink-0"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Đẩy Lên Cloudflare</span>
          </button>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepos.map(repo => (
          <div
            key={repo.id}
            className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://github.com/${repo.full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>{repo.full_name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                  {/* Zero-Pill Unboxed Metadata with · separator */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-mono text-slate-300">{repo.language || 'Python'}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                      <span className="font-mono tabular-nums">{repo.stars}</span>
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3 text-slate-500" />
                      <span className="font-mono tabular-nums">{repo.forks}</span>
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span>Mặc định: <code className="text-slate-300">{repo.default_branch}</code></span>
                  </div>
                </div>

                {/* Webhook Status */}
                <div className="shrink-0">
                  {repo.webhook_configured ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <Check className="w-3 h-3" />
                      Webhook Đang Bật
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleWebhook(repo)}
                      className="text-[11px] text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors"
                    >
                      Cài Webhook
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {repo.description}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedRepoForBuild(repo);
                    setSelectedBranch(repo.default_branch || 'main');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                >
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Chạy Đường Ống Build</span>
                </button>
                <button
                  onClick={() => handleToggleWebhook(repo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md transition-colors"
                >
                  <Webhook className="w-3 h-3 text-slate-400" />
                  <span>Cấu Hình Webhook</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Cập nhật {new Date(repo.updated_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Build Trigger Modal */}
      {selectedRepoForBuild && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Khởi Chạy Đường Ống CI/CD</h3>
              </div>
              <button
                onClick={() => setSelectedRepoForBuild(null)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Kho Lưu Trữ Mục Tiêu</label>
                <input
                  type="text"
                  disabled
                  value={selectedRepoForBuild.full_name}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nhánh (Branch)</label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                >
                  {selectedRepoForBuild.branches.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Thông Điệp Commit / Ghi Chú Kích Hoạt</label>
                <input
                  type="text"
                  placeholder="vd: feat: phát hành phiên bản v2.8"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedRepoForBuild(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                disabled={building}
                onClick={handleTriggerBuild}
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors disabled:opacity-50"
              >
                {building ? 'Đang gửi...' : 'Gửi Bản Dựng Tới Worker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

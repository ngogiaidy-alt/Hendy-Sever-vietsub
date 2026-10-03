import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api, Repository } from '../api/client.ts';
import { Play, X } from 'lucide-react';

interface QuickBuildModalProps {
  onSuccess: (depId: string) => void;
}

export const QuickBuildModal: React.FC<QuickBuildModalProps> = ({ onSuccess }) => {
  const { openQuickBuild, setOpenQuickBuild, showNotification } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('hendy-dev/vietsub-pro-live');
  const [branch, setBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [environment, setEnvironment] = useState<'production' | 'staging'>('production');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (openQuickBuild) {
      api.listRepos().then(setRepos).catch(console.error);
    }
  }, [openQuickBuild]);

  if (!openQuickBuild) return null;

  const currentRepoObj = repos.find(r => r.full_name === selectedRepo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.triggerDeploy({
        repo: selectedRepo,
        branch,
        environment,
        commitMessage: commitMessage || `Triggered manual build via Hendy Gateway`
      });

      if (res.success) {
        showNotification(`Đã điều phối bản dựng ${res.deployment.id} vào hàng đợi Redis!`, 'success');
        setOpenQuickBuild(false);
        setCommitMessage('');
        onSuccess(res.deployment.id);
      }
    } catch (err: any) {
      showNotification(err.message || 'Kích hoạt bản dựng thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Kích Hoạt CI/CD Build & Triển Khai</h3>
          </div>
          <button
            onClick={() => setOpenQuickBuild(false)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Kho Lưu Trữ Đích (Repository)</label>
            <select
              value={selectedRepo}
              onChange={e => {
                setSelectedRepo(e.target.value);
                const r = repos.find(repo => repo.full_name === e.target.value);
                if (r) setBranch(r.default_branch || 'main');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            >
              {repos.map(r => (
                <option key={r.id} value={r.full_name}>
                  {r.full_name} ({r.language})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Nhánh (Branch)</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                {currentRepoObj?.branches.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                )) || <option value="main">main</option>}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Môi trường</label>
              <select
                value={environment}
                onChange={e => setEnvironment(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="production">Sản xuất (Production)</option>
                <option value="staging">Thử nghiệm (Staging)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Thông điệp Commit / Ghi chú kích hoạt</label>
            <input
              type="text"
              placeholder="vd: feat(whisper): tối ưu bộ đệm âm thanh sidechain"
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenQuickBuild(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang gửi vào Redis...' : 'Bắt Đầu Build'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

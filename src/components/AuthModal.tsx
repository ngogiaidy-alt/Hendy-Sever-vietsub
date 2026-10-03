import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Github, Key, Check, LogOut, X, ExternalLink, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { user, openAuthModal, setOpenAuthModal, loginWithToken, logout } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  if (!openAuthModal) return null;

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    const ok = await loginWithToken(token.trim());
    setLoading(false);
    if (ok) {
      setOpenAuthModal(false);
      setToken('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-white" />
            <h3 className="text-sm font-semibold text-white">Quản Lý Phiên Làm Việc & GitHub OAuth</h3>
          </div>
          <button
            onClick={() => setOpenAuthModal(false)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Card */}
        {user ? (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                >
                  @{user.login}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80 font-mono text-slate-400">
              <div>
                <span>Kho lưu trữ: </span>
                <span className="text-slate-200 tabular-nums">{user.public_repos}</span>
              </div>
              <div>
                <span>Người theo dõi: </span>
                <span className="text-slate-200 tabular-nums">{user.followers}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mã Token Hoạt Động ({user.tokenType})
              </span>
              <button
                onClick={() => {
                  logout();
                  setOpenAuthModal(false);
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ngắt kết nối</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-2">
            <p>Chưa có tài khoản GitHub nào được kết nối. Đăng nhập bằng GitHub Personal Access Token (PAT) bên dưới.</p>
          </div>
        )}

        {/* Connect via Personal Access Token */}
        <form onSubmit={handleConnectToken} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Kết nối bằng GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Token cần quyền <code className="text-slate-400">repo</code> và <code className="text-slate-400">read:user</code> để đồng bộ kho lưu trữ và cài đặt Webhook.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => loginWithToken('ghp_demo_developer_token_hendy')}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              Dùng Hồ Sơ Mẫu
            </button>
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Kết Nối GitHub'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

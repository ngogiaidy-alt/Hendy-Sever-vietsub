import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Play, Github, Server, Radio, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, environment, setEnvironment, setOpenQuickBuild, setOpenAuthModal } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#overview"
          onClick={e => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="text-base font-semibold tracking-tight text-white flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hendy-Server</span>
          <span className="text-xs font-mono font-normal text-slate-500 hidden sm:inline">v2.8</span>
        </a>
      </div>

      {/* Zone 2: Clean navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('overview')}
          className={`transition-colors hover:text-white ${activeTab === 'overview' ? 'text-white font-semibold' : ''}`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('omni')}
          className={`transition-colors hover:text-white flex items-center gap-1.5 ${
            activeTab === 'omni' ? 'text-indigo-400 font-semibold' : ''
          }`}
        >
          Đa Nền Tảng (POS)
        </button>
        <button
          onClick={() => setActiveTab('vietsub')}
          className={`transition-colors hover:text-white flex items-center gap-1.5 ${
            activeTab === 'vietsub' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          VIETSUB PRO
        </button>
        <button
          onClick={() => setActiveTab('deployments')}
          className={`transition-colors hover:text-white ${activeTab === 'deployments' ? 'text-white' : ''}`}
        >
          CI/CD & Bản dựng
        </button>
        <button
          onClick={() => setActiveTab('cloudflare')}
          className={`transition-colors hover:text-white flex items-center gap-1 font-medium ${
            activeTab === 'cloudflare' ? 'text-orange-400 font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Cloudflare & GitHub</span>
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`transition-colors hover:text-white ${activeTab === 'code' ? 'text-white' : ''}`}
        >
          Mã nguồn Monorepo
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Environment Selector */}
        <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 text-xs">
          <button
            onClick={() => setEnvironment('production')}
            className={`px-2.5 py-1 rounded transition-colors ${
              environment === 'production' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sản xuất
          </button>
          <button
            onClick={() => setEnvironment('staging')}
            className={`px-2.5 py-1 rounded transition-colors ${
              environment === 'staging' ? 'bg-slate-800 text-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thử nghiệm
          </button>
        </div>

        {/* Primary Action 1: Trigger Build */}
        <button
          onClick={() => setOpenQuickBuild(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded-md hover:bg-slate-200 transition-colors shadow-sm"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Tạo Bản Dựng</span>
        </button>

        {/* Primary Action 2: GitHub User Connection */}
        <button
          onClick={() => setOpenAuthModal(true)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:border-slate-700 transition-colors"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.login}
              referrerPolicy="no-referrer"
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <Github className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="truncate max-w-[90px]">{user ? `@${user.login}` : 'Kết nối GitHub'}</span>
        </button>
      </div>
    </header>
  );
};

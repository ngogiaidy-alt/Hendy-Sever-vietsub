import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Terminal,
  Radio,
  Webhook,
  Database,
  Code2,
  Settings,
  Cpu,
  Layers,
  Smartphone,
  CloudUpload
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
    { id: 'omni', label: 'Đa Nền Tảng (POS)', icon: Smartphone, highlight: true },
    { id: 'vietsub', label: 'VIETSUB PRO Studio', icon: Radio, highlight: true },
    { id: 'cloudflare', label: 'Cloudflare & GitHub', icon: CloudUpload, highlight: true },
    { id: 'repositories', label: 'Kho lưu trữ GitHub', icon: GitBranch },
    { id: 'deployments', label: 'CI/CD & Bản dựng', icon: Terminal },
    { id: 'webhooks', label: 'Kiểm tra Webhook (HMAC)', icon: Webhook },
    { id: 'code', label: 'Duyệt mã Monorepo', icon: Code2 },
    { id: 'infra', label: 'Hạ tầng & Cơ sở dữ liệu', icon: Database },
    { id: 'settings', label: 'Cấu hình hệ thống', icon: Settings }
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6">
        {/* Navigation Group */}
        <div>
          <p className="text-[11px] font-medium tracking-wider text-slate-500 uppercase px-3 mb-2">Dịch Vụ Nền Tảng</p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (item.highlight ? 'text-amber-400' : 'text-indigo-400') : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Trực tiếp</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Architecture Node Overview */}
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Nút Động Cơ
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">Sẵn sàng</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Cổng API:</span>
              <span className="text-slate-300">Cổng 4000</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Whisper GPU:</span>
              <span className="text-emerald-400">CUDA Kích hoạt</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hàng đợi Redis:</span>
              <span className="text-slate-300">Cổng 6379</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Hendy-Server Lõi</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">v2.8.4</span>
      </div>
    </aside>
  );
};

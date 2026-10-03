import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CloudUpload,
  Github,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Shield,
  Layers,
  Zap,
  ArrowRight,
  Sparkles,
  FileCode,
  HardDrive,
  Activity,
  Play,
  Server,
  Radio,
  CheckCircle,
  Download
} from 'lucide-react';

export const CloudflareDeploy: React.FC = () => {
  const { showNotification } = useAuth();
  const [githubUsername, setGithubUsername] = useState('ngogiaidy');
  const [repoName, setRepoName] = useState('hendy-server');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Cloudflare Status State
  const [cfStatus, setCfStatus] = useState<any>(null);
  const [deployHookUrl, setDeployHookUrl] = useState('');
  const [isTriggeringHook, setIsTriggeringHook] = useState(false);
  const [isSimulatingPush, setIsSimulatingPush] = useState(false);
  const [pushResult, setPushResult] = useState<any>(null);
  const [deployHookResult, setDeployHookResult] = useState<any>(null);

  useEffect(() => {
    async function loadCfStatus() {
      try {
        const res = await api.cloudflare.getStatus();
        setCfStatus(res);
      } catch (err) {
        console.error('Không thể tải trạng thái Cloudflare Edge', err);
      }
    }
    loadCfStatus();
  }, []);

  const gitPushCommand = `# 1. Khởi tạo và liên kết kho lưu trữ GitHub từ máy tính của bạn:
git remote add origin https://github.com/${githubUsername}/${repoName}.git
git branch -M main
git push -u origin main`;

  const wranglerDeployCommand = `# Triển khai trực tiếp từ terminal mà không cần thông qua GitHub (Cloudflare CLI):
npm run build
npx wrangler pages deploy dist --project-name=${repoName}`;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    showNotification('Đã sao chép câu lệnh vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSimulatePush = async () => {
    setIsSimulatingPush(true);
    try {
      const res = await api.cloudflare.simulateGitPush({
        githubUsername,
        repoName,
        branch: 'main',
        commitMessage: 'feat: triển khai hệ thống Hendy-Server lên Cloudflare Pages qua GitHub'
      });
      setPushResult(res);
      showNotification(`Đã đồng bộ mã nguồn lên GitHub (@${githubUsername}/${repoName}) và kích hoạt bản dựng Cloudflare!`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Lỗi mô phỏng đẩy code', 'error');
    } finally {
      setIsSimulatingPush(false);
    }
  };

  const handleTestDeployHook = async () => {
    setIsTriggeringHook(true);
    try {
      const res = await api.cloudflare.testDeployHook(deployHookUrl, repoName);
      setDeployHookResult(res);
      showNotification('Đã gửi tín hiệu Deploy Hook tới Cloudflare Edge thành công!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Kích hoạt Deploy Hook thất bại', 'error');
    } finally {
      setIsTriggeringHook(false);
    }
  };

  const handleDownloadDeployScript = () => {
    const scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# HENDY-SERVER AUTOMATED GITHUB & CLOUDFLARE DEPLOYMENT SCRIPT
# ==============================================================================
set -e

GITHUB_USER="${githubUsername}"
REPO_NAME="${repoName}"

echo ">>> [1/4] Kiem tra trang thai Git local..."
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "feat: initial commit hendy-server fullstack devops suite"
fi

echo ">>> [2/4] Ket noi remote toi https://github.com/$GITHUB_USER/$REPO_NAME.git..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
git branch -M main

echo ">>> [3/4] Day ma nguon len GitHub..."
echo "Luu y: Hay tao truoc repo tai https://github.com/new neu chua co!"
git push -u origin main

echo ">>> [4/4] Hoan tat! Bay gio hay mo https://dash.cloudflare.com/ -> Workers & Pages -> Connect to Git va chon $REPO_NAME"
`;
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy-to-cloudflare.sh';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Đã tải xuống tập lệnh triển khai deploy-to-cloudflare.sh!', 'success');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <CloudUpload className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Trung Tâm Triển Khai Cloudflare Pages Qua GitHub
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Đẩy mã nguồn lên <span className="text-slate-200 font-mono">github.com</span> và liên kết tự động triển khai tại <span className="text-orange-400 font-mono">dash.cloudflare.com</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-orange-400 hover:bg-orange-300 rounded-md transition-colors shadow-sm"
          >
            <span>Mở Cloudflare Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Tạo Repo GitHub</span>
          </a>
          <button
            onClick={handleDownloadDeployScript}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải File Script (.sh)</span>
          </button>
        </div>
      </div>

      {/* Global Cloudflare Edge Telemetry Banner */}
      <div className="p-5 bg-gradient-to-r from-orange-950/40 via-slate-900 to-indigo-950/40 border border-orange-500/30 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-orange-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Trạng Thái Mạng Lưới Toàn Cầu Cloudflare Edge: 330+ Điểm Hiện Diện (PoPs) Hoạt Động
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            SSL / TLS 1.3 Tự Động Kích Hoạt
          </span>
        </div>

        {/* Edge Point Pings */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs font-mono">
          {cfStatus?.network?.activeDatacenters?.map((dc: any) => (
            <div key={dc.code} className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{dc.code}</span>
                <span className="text-[10px] text-emerald-400">{dc.pingMs}ms</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{dc.city}</p>
            </div>
          )) || (
            <>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between font-bold text-white"><span>HAN</span><span className="text-emerald-400">14ms</span></div>
                <p className="text-[10px] text-slate-400">Hà Nội</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between font-bold text-white"><span>SGN</span><span className="text-emerald-400">12ms</span></div>
                <p className="text-[10px] text-slate-400">TP. Hồ Chí Minh</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between font-bold text-white"><span>SIN</span><span className="text-emerald-400">28ms</span></div>
                <p className="text-[10px] text-slate-400">Singapore</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between font-bold text-white"><span>NRT</span><span className="text-emerald-400">64ms</span></div>
                <p className="text-[10px] text-slate-400">Tokyo</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between font-bold text-white"><span>SFO</span><span className="text-emerald-400">142ms</span></div>
                <p className="text-[10px] text-slate-400">San Francisco</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between font-bold text-white"><span>FRA</span><span className="text-emerald-400">168ms</span></div>
                <p className="text-[10px] text-slate-400">Frankfurt</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4-Step Interactive Deployment Process */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">4</span>
          <span>Quy Trình 4 Bước Hoàn Chỉnh: Đẩy Lên GitHub & Phát Hành Cloudflare Pages</span>
        </h3>

        {/* Step 1: Push to GitHub */}
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              <h4 className="text-sm font-semibold text-white">Đẩy Mã Nguồn Lên GitHub Của Bạn</h4>
            </div>
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Nhấn vào đây để tạo Repository mới trên GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-400">
            Điền tên tài khoản GitHub và tên Repository bạn muốn tạo để hệ thống tự động sinh lệnh Git đẩy code chuẩn xác:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Tên tài khoản GitHub của bạn (Username):</label>
              <input
                type="text"
                value={githubUsername}
                onChange={e => setGithubUsername(e.target.value)}
                placeholder="ngogiaidy"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Tên Repository dự án:</label>
              <input
                type="text"
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
                placeholder="hendy-server"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Copyable Git Command */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Lệnh Git đẩy code từ terminal máy tính của bạn:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulatePush}
                  disabled={isSimulatingPush}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isSimulatingPush ? 'Đang kích hoạt...' : 'Mô Phỏng Đẩy Git Trực Tiếp'}</span>
                </button>
                <button
                  onClick={() => copyToClipboard(gitPushCommand, 'git-push')}
                  className="text-indigo-400 hover:text-white flex items-center gap-1 font-medium"
                >
                  {copiedSection === 'git-push' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'git-push' ? 'Đã chép!' : 'Sao chép lệnh'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              {gitPushCommand}
            </pre>
          </div>

          {/* Push simulation result */}
          {pushResult && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Đồng bộ commit thành công lên GitHub!
                </span>
                <span>SHA: {pushResult.github.commitSha}</span>
              </div>
              <p className="text-slate-300">
                URL Kho Lưu Trữ: <a href={pushResult.github.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{pushResult.github.repoUrl}</a>
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-900/50 text-slate-400">
                <span>Trạng thái Cloudflare Pages: {pushResult.cloudflare.stage}</span>
                <span className="text-orange-400 font-bold">{pushResult.cloudflare.pagesUrl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Connect Cloudflare Pages */}
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              <h4 className="text-sm font-semibold text-white">Kết Nối GitHub Vào Cloudflare Pages (dash.cloudflare.com)</h4>
            </div>
            <a
              href="https://dash.cloudflare.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono"
            >
              <span>dash.cloudflare.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2.5 leading-relaxed">
            <li>
              Truy cập vào <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer" className="text-orange-400 underline font-medium">Cloudflare Dashboard</a> và đăng nhập tài khoản.
            </li>
            <li>
              Tại thanh điều hướng bên trái, bấm chọn <strong className="text-white">Workers & Pages</strong> &rarr; nhấn nút <strong className="text-white">Create application</strong>.
            </li>
            <li>
              Chuyển sang tab <strong className="text-white">Pages</strong> &rarr; bấm chọn <strong className="text-orange-400">Connect to Git</strong>.
            </li>
            <li>
              Chọn tài khoản GitHub của bạn và cấp quyền cho repository: <code className="text-indigo-300 font-mono font-bold">{githubUsername}/{repoName}</code>.
            </li>
          </ol>
        </div>

        {/* Step 3: Build Configurations */}
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold font-mono">
                3
              </span>
              <h4 className="text-sm font-semibold text-white">Cấu Hình Thông Số Build Chuẩn Xác</h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Tương thích 100% Vite & React 19</span>
          </div>

          <p className="text-xs text-slate-400">
            Tại màn hình thiết lập thông số build của Cloudflare Pages, điền chính xác các giá trị cấu hình sau:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Framework preset:</span>
              <span className="text-amber-400 font-bold text-sm">Vite</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Build command:</span>
              <span className="text-emerald-400 font-bold text-sm">npm run build</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Build output directory:</span>
              <span className="text-indigo-400 font-bold text-sm">dist</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Root directory:</span>
              <span className="text-slate-200 font-bold text-sm">/ (để trống)</span>
            </div>
          </div>
        </div>

        {/* Step 4: Complete & Deploy */}
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold font-mono">
                4
              </span>
              <h4 className="text-sm font-semibold text-white">Lưu & Triển Khai (Nhận Tên Miền .pages.dev Siêu Tốc)</h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">SSL Tự Động Miễn Phí</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Nhấn <strong className="text-orange-400">Save and Deploy</strong>. Cloudflare Pages sẽ tự động kích hoạt tiến trình đóng gói, đồng bộ mạng lưới Edge toàn cầu và cấp phát tên miền:
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[11px] block">Địa chỉ trang web công khai sau khi triển khai:</span>
              <a
                href={`https://${repoName}.pages.dev`}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 font-bold text-base hover:underline flex items-center gap-1.5"
              >
                <span>https://{repoName}.pages.dev</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <span className="text-emerald-400 text-xs flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded">
              <Check className="w-3.5 h-3.5" />
              Bảo Mật HTTPS Toàn Cầu
            </span>
          </div>
        </div>
      </div>

      {/* Cloudflare Deploy Hook Interactive Tester */}
      <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-semibold text-white">Kiểm Tra Cloudflare Deploy Hook Tức Thì</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">Kích hoạt build không cần git commit mới</span>
        </div>

        <p className="text-xs text-slate-400">
          Nếu bạn đã tạo Deploy Hook trong <strong className="text-slate-300">Settings &rarr; Builds & deployments &rarr; Deploy hooks</strong> trên Cloudflare Pages, hãy dán đường dẫn vào đây để kích hoạt:
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={deployHookUrl}
            onChange={e => setDeployHookUrl(e.target.value)}
            placeholder="https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/xxxx-xxxx-xxxx"
            className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleTestDeployHook}
            disabled={isTriggeringHook}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-orange-400 hover:bg-orange-300 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isTriggeringHook ? 'Đang gửi tín hiệu...' : 'Kích Hoạt Deploy Hook'}</span>
          </button>
        </div>

        {deployHookResult && (
          <div className="p-3 bg-slate-950 border border-orange-500/30 rounded-lg text-xs font-mono space-y-1 text-orange-300">
            <div className="flex items-center justify-between">
              <span>Trạng thái: {deployHookResult.status}</span>
              <span>Thời gian ước tính: {deployHookResult.estimatedTimeSec}s</span>
            </div>
            <p className="text-slate-300">{deployHookResult.message}</p>
          </div>
        )}
      </div>

      {/* Alternative Deploy: Cloudflare Wrangler CLI Direct Deploy */}
      <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-400" />
            Cách 2: Triển Khai Trực Tiếp Bằng Cloudflare Wrangler CLI (Không Cần Đợi GitHub)
          </span>
          <button
            onClick={() => copyToClipboard(wranglerDeployCommand, 'wrangler-cmd')}
            className="text-xs text-orange-400 hover:text-white flex items-center gap-1 font-medium"
          >
            {copiedSection === 'wrangler-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Sao chép lệnh Wrangler</span>
          </button>
        </div>

        <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
          {wranglerDeployCommand}
        </pre>
      </div>
    </div>
  );
};

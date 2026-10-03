import React, { useState, useEffect } from 'react';
import { api, WebhookLog } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Webhook,
  ShieldCheck,
  Play,
  Key,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export const WebhookInspector: React.FC = () => {
  const { showNotification } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [eventToSimulate, setEventToSimulate] = useState<'push' | 'ping' | 'pull_request'>('push');
  const [targetRepo, setTargetRepo] = useState('hendy-dev/vietsub-pro-live');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('feat: tối ưu hóa bộ đệm luồng âm thanh whisper');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadWebhookLogs = async () => {
    try {
      const data = await api.getWebhookLogs();
      setLogs(data);
      if (data.length > 0 && !selectedLog) {
        setSelectedLog(data[0]);
      }
    } catch (err) {
      console.error('Không thể tải nhật ký webhook', err);
    }
  };

  useEffect(() => {
    loadWebhookLogs();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await api.simulateWebhook({
        event: eventToSimulate,
        repo: targetRepo,
        branch,
        message: commitMessage
      });
      if (res.success) {
        showNotification(`Webhook [${eventToSimulate}] đã gửi và xác thực thành công qua HMAC-SHA256!`, 'success');
        loadWebhookLogs();
        setSelectedLog(res.log);
      }
    } catch (err: any) {
      showNotification(err.message || 'Giả lập webhook thất bại', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const copyPayload = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Kiểm Tra Chữ Ký Webhook HMAC-SHA256</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Xác thực tiêu đề chữ ký mật mã, phân tích gói tin JSON và thử nghiệm cơ chế tự động kích hoạt bản dựng.
          </p>
        </div>

        {/* Secret summary */}
        <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono">
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Khóa bí mật (Secret):</span>
          <span className="text-slate-200">hendy_secure_webhook_secret_2026</span>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Trình Giả Lập Gửi Webhook Tương Tác</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">POST /api/webhooks/github</span>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Sự kiện GitHub (Event)</label>
            <select
              value={eventToSimulate}
              onChange={e => setEventToSimulate(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="push">push (commit & mã nguồn mới)</option>
              <option value="ping">ping (bắt tay kết nối)</option>
              <option value="pull_request">pull_request</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Kho lưu trữ mục tiêu</label>
            <input
              type="text"
              value={targetRepo}
              onChange={e => setTargetRepo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Nhánh (Git Ref / Branch)</label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 px-4 py-1.5 font-semibold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isSimulating ? 'Đang phát...' : 'Gửi Webhook Kèm Chữ Ký'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Two Column Layout: Delivery History vs Payload Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Delivery Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-300">Lịch Sử Nhận Webhook</span>
            <span className="text-[11px] font-mono text-slate-500">{logs.length} gói tin</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {logs.map(log => {
              const isSelected = log.id === selectedLog?.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-xs font-bold text-amber-400 uppercase">[{log.event}]</span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      SHA256 Chuẩn
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-1 line-clamp-1">{log.summary}</p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2 font-mono">
                    <span className="text-slate-400">{log.repo.split('/')[1] || log.repo}</span>
                    <span>&middot;</span>
                    <span className="tabular-nums">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Payload Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedLog ? (
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[580px]">
              {/* Top Bar */}
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Kiểm Tra Gói Tin: {selectedLog.id}</span>
                </div>
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Sao Chép JSON</span>
                </button>
              </div>

              {/* Cryptographic Details Card */}
              <div className="p-3.5 bg-slate-900/40 border-b border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tiêu đề (Header):</span>
                  <span className="text-indigo-400">X-Hub-Signature-256</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-emerald-400 break-all">
                  {selectedLog.signature}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mã phân phối: {selectedLog.deliveryId}</span>
                  <span>Người gửi: @{selectedLog.sender}</span>
                </div>
              </div>

              {/* JSON Payload viewer */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-xs">
                <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-lg">
              Chọn một gói tin để kiểm tra chữ ký và nội dung payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

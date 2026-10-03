import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Settings as SettingsIcon,
  Key,
  Shield,
  Database,
  Radio,
  HardDrive,
  Save,
  Check,
  Cpu
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { showNotification } = useAuth();
  const [clientId, setClientId] = useState('Iv1.hendy_simulated_client');
  const [clientSecret, setClientSecret] = useState('••••••••••••••••••••••••••••••');
  const [webhookSecret, setWebhookSecret] = useState('hendy_secure_webhook_secret_2026');
  const [whisperModel, setWhisperModel] = useState('large-v3');
  const [enableCuda, setEnableCuda] = useState(true);
  const [redisUrl, setRedisUrl] = useState('redis://localhost:6379');
  const [dbUrl, setDbUrl] = useState('postgresql://hendy_admin:••••••••@localhost:5432/hendy_db');
  const [storageBucket, setStorageBucket] = useState('hendy-media-archive');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showNotification('Cấu hình hệ thống đã được cập nhật thành công', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Cấu Hình Hệ Thống & Tích Hợp</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập thông tin xác thực GitHub OAuth, mô hình Whisper ASR, PostgreSQL, Redis và kho lưu trữ Đám mây Cloudflare.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-200 rounded-md transition-colors shadow-sm"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Đã Lưu' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* GitHub OAuth & Webhook Section */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Thông Tin Xác Thực GitHub OAuth & Cổng Vào</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">GitHub Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">GitHub Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Khóa Bí Mật GitHub Webhook HMAC (X-Hub-Signature-256)</label>
              <input
                type="text"
                value={webhookSecret}
                onChange={e => setWebhookSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Được sử dụng bởi <code className="text-indigo-400">api-gateway/src/services/store.ts</code> để xác thực chữ ký số HMAC của gói tin webhook từ GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* VIETSUB PRO & Speech Model Settings */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Cấu Hình VIETSUB PRO & Mô Hình Whisper ASR</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Kích Thước Mô Hình OpenAI Whisper</label>
              <select
                value={whisperModel}
                onChange={e => setWhisperModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="tiny">whisper-tiny (~1 GB VRAM &middot; độ trễ thấp nhất)</option>
                <option value="base">whisper-base (~1.5 GB VRAM &middot; xử lý nhanh)</option>
                <option value="small">whisper-small (~3 GB VRAM &middot; cân bằng)</option>
                <option value="medium">whisper-medium (~6 GB VRAM &middot; độ chính xác cao)</option>
                <option value="large-v3">whisper-large-v3 (~10 GB VRAM &middot; chất lượng dịch tiếng Việt tối ưu nhất)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2 bg-slate-950 border border-slate-800 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCuda}
                  onChange={e => setEnableCuda(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <div>
                  <span className="text-slate-200 font-medium">Tăng Tốc Phần Cứng NVIDIA CUDA GPU</span>
                  <p className="text-[11px] text-slate-500">Kích hoạt suy luận cuDNN FP16 với độ trễ dưới 300ms</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Database & Message Queue Connection */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Cấu Hình Kết Nối Hạ Tầng</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Chuỗi Kết Nối PostgreSQL</label>
              <input
                type="text"
                value={dbUrl}
                onChange={e => setDbUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Địa Chỉ Hàng Đợi Redis</label>
              <input
                type="text"
                value={redisUrl}
                onChange={e => setRedisUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Bucket Lưu Trữ Cloudflare R2 / S3</label>
              <input
                type="text"
                value={storageBucket}
                onChange={e => setStorageBucket(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

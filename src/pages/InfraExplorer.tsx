import React, { useState } from 'react';
import {
  Database,
  Layers,
  Server,
  Activity,
  HardDrive,
  Cpu,
  CheckCircle2,
  Table,
  RefreshCw
} from 'lucide-react';

export const InfraExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'postgres' | 'redis' | 'nginx' | 'docker'>('postgres');
  const [selectedTable, setSelectedTable] = useState<string>('deployments');

  const postgresTables = [
    {
      name: 'users',
      rows: 14,
      size: '32 KB',
      description: 'Hồ sơ người dùng GitHub OAuth, khóa công khai và mã chứng thực'
    },
    {
      name: 'repositories',
      rows: 4,
      size: '24 KB',
      description: 'Các kho lưu trữ được theo dõi, nhánh mặc định và thông tin webhook'
    },
    {
      name: 'deployments',
      rows: 24,
      size: '180 KB',
      description: 'Lịch sử thực thi đường ống CI/CD, số liệu CPU/RAM và trạng thái sức khỏe'
    },
    {
      name: 'build_logs',
      rows: 482,
      size: '512 KB',
      description: 'Dòng nhật ký console theo từng giai đoạn đóng gói (clone, deps, docker, deploy)'
    },
    {
      name: 'media_streams',
      rows: 20,
      size: '48 KB',
      description: '20 kênh livestream đa luồng, cấu hình mô hình Whisper và thông số audio ducking'
    },
    {
      name: 'transcription_jobs',
      rows: 1420,
      size: '1.2 MB',
      description: 'Các đoạn bóc băng phụ đề thời gian thực, bản dịch và mốc thời gian căn chỉnh'
    }
  ];

  const dockerServices = [
    {
      name: 'hendy_postgres',
      image: 'postgres:16-alpine',
      port: '5432:5432',
      status: 'Đang chạy 18 giờ',
      health: 'Khỏe mạnh',
      cpu: '1.2%',
      mem: '78 MB'
    },
    {
      name: 'hendy_redis',
      image: 'redis:7-alpine',
      port: '6379:6379',
      status: 'Đang chạy 18 giờ',
      health: 'Khỏe mạnh',
      cpu: '0.8%',
      mem: '64 MB'
    },
    {
      name: 'hendy_api_gateway',
      image: 'hendy-gateway:2.8.4',
      port: '4000:4000',
      status: 'Đang chạy 18 giờ',
      health: 'Khỏe mạnh',
      cpu: '2.4%',
      mem: '142 MB'
    },
    {
      name: 'hendy_python_worker',
      image: 'hendy-media-worker:latest (CUDA)',
      port: 'Luồng ngầm nội bộ',
      status: 'Đang chạy 18 giờ',
      health: 'Khỏe mạnh',
      cpu: '18.4%',
      mem: '3.4 GB (GPU 14.8GB)'
    },
    {
      name: 'hendy_nginx',
      image: 'nginx:1.25-alpine',
      port: '80:80, 443:443',
      status: 'Đang chạy 18 giờ',
      health: 'Khỏe mạnh',
      cpu: '0.4%',
      mem: '22 MB'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Bảng Điều Khiển Hạ Tầng & Cơ Sở Dữ Liệu</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Mô hình quan hệ PostgreSQL, hàng đợi thông điệp Redis, Nginx Reverse Proxy và cụm dịch vụ Docker Compose.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-1 text-xs">
          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-1.5 rounded transition-colors font-medium ${
              activeTab === 'postgres' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PostgreSQL
          </button>
          <button
            onClick={() => setActiveTab('redis')}
            className={`px-3 py-1.5 rounded transition-colors font-medium ${
              activeTab === 'redis' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hàng Đợi Redis
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1.5 rounded transition-colors font-medium ${
              activeTab === 'docker' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Docker Compose
          </button>
          <button
            onClick={() => setActiveTab('nginx')}
            className={`px-3 py-1.5 rounded transition-colors font-medium ${
              activeTab === 'nginx' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nginx Ingress
          </button>
        </div>
      </div>

      {/* Tab: PostgreSQL */}
      {activeTab === 'postgres' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Động cơ cơ sở dữ liệu</span>
              <p className="text-base font-bold text-white font-mono mt-1">PostgreSQL 16.2</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Cổng 5432 &middot; connection pool: 8/20</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Tên cơ sở dữ liệu</span>
              <p className="text-base font-bold text-indigo-400 font-mono mt-1">hendy_db</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Mã hóa: UTF8 &middot; pgcrypto kích hoạt</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Dung lượng ổ đĩa sử dụng</span>
              <p className="text-base font-bold text-white font-mono mt-1">128.4 MB</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Chỉ mục (Indexes): 6 &middot; WAL lưu trữ đầy đủ</p>
            </div>
          </div>

          {/* Table List & Schema Explorer */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-white">Các Bảng Quan Hệ Trong hendy_db</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {postgresTables.map(tbl => (
                <div
                  key={tbl.name}
                  onClick={() => setSelectedTable(tbl.name)}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    selectedTable === tbl.name
                      ? 'bg-slate-950 border-indigo-500/80 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-indigo-400" />
                      {tbl.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">{tbl.rows} bản ghi</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tbl.description}</p>
                  <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
                    Kích thước: {tbl.size}
                  </div>
                </div>
              ))}
            </div>

            {/* SQL Query Preview for selected table */}
            <div className="mt-4 p-4 bg-slate-950 rounded-md border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Trình Xem Lệnh SQL</span>
                <span className="font-mono text-indigo-400">SELECT * FROM {selectedTable} LIMIT 5;</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 p-3 bg-slate-900/90 rounded overflow-x-auto leading-relaxed">
{`-- Định nghĩa lược đồ cấu trúc cho bảng "${selectedTable}"
CREATE TABLE IF NOT EXISTS ${selectedTable} (
    id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Truy vấn thực thi trong 1.4ms. Trạng thái: 0 lỗi.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Redis */}
      {activeTab === 'redis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Phiên bản Redis</span>
              <p className="text-base font-bold text-white font-mono mt-1">7.2-alpine</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Cổng 6379 &middot; TCP Keepalive 300s</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Độ sâu hàng đợi (Chờ xử lý)</span>
              <p className="text-base font-bold text-amber-400 font-mono mt-1 tabular-nums">3 tác vụ</p>
              <p className="text-[11px] text-slate-500 mt-0.5">hendy:queue:builds</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Tác vụ đã xử lý</span>
              <p className="text-base font-bold text-emerald-400 font-mono mt-1 tabular-nums">18,420</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Không có tác vụ thất thoát (dead-letter)</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">Bộ nhớ RAM sử dụng</span>
              <p className="text-base font-bold text-white font-mono mt-1 tabular-nums">64.8 MB</p>
              <p className="text-[11px] text-slate-500 mt-0.5">maxmemory 2gb (chính sách LRU)</p>
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-white">Kênh Hàng Đợi Danh Sách & Kênh Pub/Sub Đang Hoạt Động</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-indigo-400 font-bold">hendy:queue:builds</span>
                  <p className="text-slate-400 font-sans text-xs mt-0.5">LPUSH / BRPOP dành cho các tác vụ Git cloner & Docker builder</p>
                </div>
                <span className="text-emerald-400">3 tác vụ đang chờ</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">hendy:queue:media</span>
                  <p className="text-slate-400 font-sans text-xs mt-0.5">Điều phối các đoạn âm thanh Whisper ASR & tác vụ nén ducking</p>
                </div>
                <span className="text-slate-300">0 tác vụ đang chạy</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">hendy:events:status</span>
                  <p className="text-slate-400 font-sans text-xs mt-0.5">Kênh truyền phát Pub/Sub thời gian thực cho giao diện điều khiển máy khách</p>
                </div>
                <span className="text-slate-300">14 máy khách theo dõi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Docker Compose */}
      {activeTab === 'docker' && (
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Các Container Vi Dịch Vụ Được Điều Phối</h3>
            <span className="text-xs font-mono text-emerald-400">Tất cả 5 dịch vụ đều khỏe mạnh</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-medium">
                  <th className="py-2 px-3">Tên dịch vụ</th>
                  <th className="py-2 px-3">Tag ảnh (Image)</th>
                  <th className="py-2 px-3">Cổng mạng (Ports)</th>
                  <th className="py-2 px-3">Trạng thái</th>
                  <th className="py-2 px-3">CPU</th>
                  <th className="py-2 px-3">Bộ nhớ RAM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {dockerServices.map(svc => (
                  <tr key={svc.name} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {svc.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{svc.image}</td>
                    <td className="py-3 px-3 text-indigo-400">{svc.port}</td>
                    <td className="py-3 px-3 text-emerald-400">{svc.status}</td>
                    <td className="py-3 px-3 tabular-nums">{svc.cpu}</td>
                    <td className="py-3 px-3 tabular-nums">{svc.mem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Nginx Ingress */}
      {activeTab === 'nginx' && (
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Ma Trận Điều Hướng Nginx Reverse Proxy</h3>
            <span className="text-xs font-mono text-slate-400">worker_processes: auto &middot; epoll</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded space-y-1">
              <span className="font-mono text-indigo-400 font-bold">/api/*</span>
              <p className="text-slate-400">Chuyển tiếp đến api_gateway_upstream (Express chạy trên cổng 4000)</p>
              <div className="text-[10px] text-slate-500 font-mono">timeout: 300s &middot; keepalive 32</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded space-y-1">
              <span className="font-mono text-amber-400 font-bold">/ws/*</span>
              <p className="text-slate-400">Kết nối WebSocket truyền dòng phụ đề thời gian thực của Whisper</p>
              <div className="text-[10px] text-slate-500 font-mono">timeout: 3600s &middot; upgrade kích hoạt</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded space-y-1">
              <span className="font-mono text-emerald-400 font-bold">/live/*</span>
              <p className="text-slate-400">Bộ đệm đoạn video HLS phục vụ phát sóng đa luồng của media node</p>
              <div className="text-[10px] text-slate-500 font-mono">Hỗ trợ CORS &middot; header no-cache</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

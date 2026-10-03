# Hendy-Server | Hệ Thống Tự Động Hóa CI/CD & Media Processing Engine (VIETSUB PRO)

Hệ thống kiến trúc phân tán microservices hiệu năng cao kết hợp:
1. **Frontend / Dashboard UI**: Bảng điều khiển quản trị thời gian thực (React 19, Tailwind CSS, Lucide Icons).
2. **API Gateway & GitHub Service**: Cổng giao tiếp Node.js/Express, xác thực chữ ký Webhook HMAC-SHA256, điều phối hàng đợi Redis Queue.
3. **Python Engine & Media Node**: Xử lý đa luồng (20 tabs livestream đồng thời), bóc băng Whisper ASR thời gian thực, lồng tiếng AI và hạ âm nền tự động (Sidechain Audio Ducking).
4. **DevOps & Infrastructure**: Docker Compose, PostgreSQL 16, Redis 7 AOF, Nginx Reverse Proxy với WebSocket & HLS stream.

---

## 📂 Cấu Trúc Thư Mục (Directory Structure)

```
Hendy-Server-/
│
├── frontend/                               # 1. FRONTEND / DASHBOARD UI (React 19 / Vite)
│   ├── public/                             # Tài nguyên tĩnh, favicon, assets
│   ├── src/
│   │   ├── components/                     # Header, Sidebar, Terminal, AudioVisualizer, Pipeline
│   │   ├── pages/                          # Overview, Repositories, Deployments, VietsubPro, Webhooks, Infra, Settings
│   │   ├── context/                        # AuthContext (GitHub OAuth & Session State)
│   │   ├── api/                            # Axios/Fetch API client kết nối Gateway
│   │   └── App.tsx                         # Entry point giao diện chính
│   ├── package.json
│   └── vite.config.ts
│
├── api-gateway/                            # 2. API GATEWAY & GITHUB SERVICE (Node.js / Express / TS)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts              # Xử lý GitHub OAuth Login & Token Exchange
│   │   │   ├── repo.routes.ts              # Gọi GitHub API lấy danh sách repos & cài đặt Webhook
│   │   │   ├── webhook.routes.ts           # Tiếp nhận và xác thực chữ ký (X-Hub-Signature-256) từ GitHub
│   │   │   ├── deploy.routes.ts            # Điều phối tiến trình build & rollback
│   │   │   ├── media.routes.ts             # Quản lý 20 tabs stream & bóc băng phụ đề
│   │   │   └── system.routes.ts            # Giám sát trạng thái hệ thống & mã nguồn monorepo
│   │   ├── services/
│   │   │   ├── githubClient.ts             # Giao tiếp với GitHub API (GraphQL/REST)
│   │   │   ├── queueProducer.ts            # Đẩy task build/xử lý vào Redis Queue
│   │   │   └── store.ts                    # Lưu trữ trạng thái bộ nhớ và đồng bộ DB
│   │   └── server.ts                       # Khởi chạy Express Server
│   ├── package.json
│   └── tsconfig.json
│
├── python-engine/                          # 3. WORKER & BUILD / MEDIA PROCESSING ENGINE (Python)
│   ├── github_worker/
│   │   ├── git_cloner.py                   # Tự động clone source code từ GitHub repository
│   │   └── builder.py                      # Thực thi tiến trình build ứng dụng hoặc chạy pipeline
│   ├── media_node/                         # Xử lý Media, ASR & Tự động hóa (VIETSUB PRO core)
│   │   ├── multi_stream.py                 # Quản lý đa luồng (20 tabs live stream đồng thời)
│   │   ├── whisper_asr.py                  # Bóc băng thời gian thực (Whisper large-v3)
│   │   └── audio_ducking.py                # Xử lý âm thanh, lồng tiếng AI & sidechain ducking
│   ├── queue_consumer/
│   │   └── redis_listener.py               # Lắng nghe task từ Redis Queue và điều phối worker
│   ├── requirements.txt
│   └── main.py                             # Entry point chạy background workers
│
├── infra/                                  # 4. INFRASTRUCTURE & DEVOPS
│   ├── postgres/
│   │   └── init_schema.sql                 # Khởi tạo bảng lưu thông tin User, Repos, Deployments, Logs
│   ├── redis/
│   │   └── redis.conf                      # Cấu hình Message Queue / Buffer AOF
│   ├── nginx/
│   │   └── nginx.conf                      # Reverse proxy, cấu hình SSL và WebSocket
│   └── docker-compose.yml                  # Khởi chạy toàn bộ hệ thống cục bộ (App, DB, Redis, Workers)
│
├── .env.example                            # Biến môi trường mẫu (GitHub Client ID, Secret, R2, DB URL)
└── README.md                               # Hướng dẫn cài đặt và vận hành hệ thống
```

---

## 🚀 Hướng Dẫn Cài Đặt & Vận Hành (Getting Started)

### Cách 1: Chạy toàn bộ với Docker Compose (Khuyên dùng cho Production)
```bash
# 1. Clone source code
git clone https://github.com/hendy-dev/hendy-server.git
cd hendy-server

# 2. Cấu hình biến môi trường
cp .env.example .env
nano .env # Điền thông tin GITHUB_CLIENT_ID, SECRET, v.v.

# 3. Khởi chạy cụm dịch vụ với Docker Compose
docker compose -f infra/docker-compose.yml up --build -d

# 4. Kiểm tra trạng thái containers
docker compose -f infra/docker-compose.yml ps
```

### Cách 2: Chạy độc lập từng thành phần (Development)

#### 1. Khởi động API Gateway (Node.js)
```bash
cd api-gateway
npm install
npm run dev
# Gateway chạy tại http://localhost:4000
```

#### 2. Khởi động Python Engine & VIETSUB PRO Worker
```bash
cd python-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

#### 3. Khởi động Frontend Dashboard (React 19)
```bash
npm run dev
# Dashboard mở tại http://localhost:3000
```

---

## ⚡ Các Tính Năng Nổi Bật

### 1. API Gateway & GitHub Integration
- **GitHub OAuth & PAT Authentication**: Đăng nhập nhanh bằng tài khoản GitHub hoặc kết nối trực tiếp với Personal Access Token.
- **HMAC-SHA256 Webhook Verification**: Xác thực chuẩn mực header `X-Hub-Signature-256` với `crypto.timingSafeEqual`, ngăn chặn tấn công timing attack và giả mạo payload.
- **Automated Webhook Registration**: Tự động cài đặt webhook lắng nghe các sự kiện `push`, `pull_request`, `release`, `workflow_dispatch`.

### 2. Python Worker & CI/CD Pipeline
- **Git Cloner thông minh**: Shallow clone (--depth 50), tối ưu hoá tốc độ kéo mã nguồn, caching thông minh.
- **Stack Analyzer & Container Builder**: Tự động nhận diện stack (Python, Node.js, Dockerfile, Go), kích hoạt unit test suite và đóng gói container image.
- **Live Terminal Log Streaming**: Luồng log thời gian thực theo từng giai đoạn (Clone -> Dependencies -> Build -> Test -> Docker -> Deploy).

### 3. VIETSUB PRO (Media Node & Whisper ASR)
- **Quản lý đa luồng 20 Tabs Livestream**: Khả năng tiếp nhận và xử lý song song 20 luồng RTMP/HLS đồng thời.
- **Whisper ASR Real-time**: Mô hình Whisper large-v3 bóc băng giọng nói với độ trễ <300ms, tự động dịch thuật sang tiếng Việt.
- **Sidechain Audio Ducking**: Tự động nén và hạ âm lượng nhạc nền/stream gốc (-14dB) khi giọng nói thuyết minh/AI phát lên, khôi phục âm lượng mượt mà (smooth attack/release) khi ngừng nói.
- **Xuất phụ đề SRT/VTT**: Trích xuất phụ đề song ngữ trực tiếp cho phát sóng.

---

## 🛡️ Giấy phép & Tác giả
Phát triển bởi đội ngũ **Hendy-Server Team**. Giấy phép MIT.

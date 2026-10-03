import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Smartphone,
  Monitor,
  Send,
  Shield,
  Layers,
  ShoppingBag,
  CreditCard,
  QrCode,
  Check,
  Zap,
  RefreshCw,
  Search,
  Download,
  Terminal,
  Database,
  Server,
  Key,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Radio,
  FileCode,
  HardDrive
} from 'lucide-react';

export const OmniChannel: React.FC = () => {
  const { showNotification } = useAuth();

  // Active View Mode: 'devices' (Interactive Multi-Device Experience) | 'architecture' (Topology & Traffic Flow) | 'automation' (Swagger & Framework Generator) | 'edge' (Cloudflare WAF & R2 Installers)
  const [activeTab, setActiveTab] = useState<'devices' | 'architecture' | 'automation' | 'edge'>('devices');

  // Interactive Device Simulation Mode
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'pos_desktop' | 'telegram' | 'web'>('telegram');

  // Store & Catalog Data
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [telegramLogs, setTelegramLogs] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [id: string]: number }>({ 'prod-03': 1 });
  const [selectedStore, setSelectedStore] = useState<'hanoi' | 'hcm' | 'warehouse'>('hanoi');
  const [voucherCode, setVoucherCode] = useState('HENDY2026');

  // Telegram Dual Auth State
  const [initDataString, setInitDataString] = useState(
    'query_id=AAHendy_9481&user=%7B%22id%22%3A94810294%2C%22first_name%22%3A%22Nguy%E1%BB%85n%22%2C%22last_name%22%3A%22An%22%2C%22username%22%3A%22nguyen_an%22%2C%22is_premium%22%3Atrue%7D&auth_date=1727918400&hash=8f4a1c92019b8471049c8129841029abce910248571029487192837401928374'
  );
  const [telegramAuthResult, setTelegramAuthResult] = useState<any>(null);

  // Automation Engine State
  const [appIdeaInput, setAppIdeaInput] = useState('Hệ thống bán hàng chuỗi siêu thị kiêm Telegram Mini App tích hợp tích điểm Web3');
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(['mobile', 'telegram_mini_app', 'desktop_pc']);
  const [automationResult, setAutomationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edge & R2 State
  const [signedDownload, setSignedDownload] = useState<any>(null);

  const loadData = async () => {
    try {
      const [prodRes, ordRes, invRes, tgRes] = await Promise.all([
        api.omni.getProducts(),
        api.omni.getOrders(),
        api.omni.getInventorySync(),
        api.omni.getTelegramLogs()
      ]);
      setProducts(prodRes.products);
      setOrders(ordRes);
      setInventory(invRes);
      setTelegramLogs(tgRes);
    } catch (err) {
      console.error('Failed to load omni-channel data', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyTelegramAuth = async () => {
    try {
      const res = await api.omni.verifyTelegramInitData(initDataString);
      setTelegramAuthResult(res);
      showNotification('Đã xác thực Telegram initData thành công! Đăng nhập tự động không cần mật khẩu.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Xác thực Telegram thất bại', 'error');
    }
  };

  const handleAddToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    showNotification('Đã thêm sản phẩm vào giỏ hàng', 'info');
  };

  const handleCheckout = async (channel: 'mobile_app' | 'handheld_pos' | 'desktop_pos' | 'web_portal' | 'telegram_mini_app') => {
    const items = Object.entries(cart).map(([productId, quantity]) => {
      const prod = products.find(p => p.id === productId);
      return {
        productId,
        name: prod?.name || 'Sản phẩm',
        price: prod?.salePrice || 1000000,
        quantity
      };
    });

    if (items.length === 0) {
      showNotification('Giỏ hàng đang trống', 'error');
      return;
    }

    try {
      const res = await api.omni.createOrder({
        channel,
        customerName: channel === 'telegram_mini_app' ? 'Nguyễn Văn An (Telegram)' : 'Khách Hàng Trực Tiếp',
        customerPhone: '0988776655',
        items,
        storeLocation: selectedStore,
        voucherCode
      });

      if (res.success) {
        showNotification(`Đơn hàng #${res.order.id} đã đặt thành công qua kênh ${channel.toUpperCase()}! Đã gửi thông báo Telegram.`, 'success');
        setCart({});
        loadData();
      }
    } catch (err: any) {
      showNotification(err.message || 'Thanh toán thất bại', 'error');
    }
  };

  const handleRunAutomationAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.omni.analyzeAutomation({
        appIdea: appIdeaInput,
        targetPlatforms,
        offlineRequirement: targetPlatforms.includes('desktop_pc')
      });
      setAutomationResult(res);
      showNotification('Động cơ tự động hóa đã sinh kiến trúc & tài liệu Swagger API!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Phân tích tự động hóa thất bại', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestInstallerUrl = async (fileName: string, platform: string) => {
    try {
      const res = await api.omni.getEdgeSignedUrl(fileName, platform);
      setSignedDownload(res);
      showNotification(`Đã tạo liên kết tải xuống có chữ ký an toàn từ Cloudflare R2!`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Lỗi tạo liên kết có chữ ký', 'error');
    }
  };

  const cartTotal = Object.entries(cart).reduce((acc, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return acc + (p?.salePrice || 0) * qty;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Omni-Frontends & Microservices Hub</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Unified multi-platform layer: Mobile & Handheld POS, Desktop PC, Web & Telegram Mini App with Cloudflare WAF, Dual Auth, and Redis sync.
          </p>
        </div>

        {/* Top 4 Navigation Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'devices' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Omni-Frontends Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Architecture & Traffic Flow</span>
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'automation' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Automation Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('edge')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'edge' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Cloudflare Edge & R2</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OMNI-FRONTENDS LIVE EXPERIENCE */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          {/* Device Sub-Selector & Store Location switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Select Front-end Platform:</span>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
                <button
                  onClick={() => setDeviceMode('telegram')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
                    deviceMode === 'telegram' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>3. Telegram Mini App (Hợp Nhất)</span>
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
                    deviceMode === 'mobile' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>1. Mobile & POS Cầm Tay</span>
                </button>
                <button
                  onClick={() => setDeviceMode('pos_desktop')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
                    deviceMode === 'pos_desktop' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>2. Desktop PC POS Thu Ngân</span>
                </button>
                <button
                  onClick={() => setDeviceMode('web')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
                    deviceMode === 'web' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Web Portal (Chrome/Safari)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Store Branch:</span>
              <select
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="hanoi">Chi nhánh Hà Nội (Flagship)</option>
                <option value="hcm">Chi nhánh TP.HCM (Quận 1)</option>
                <option value="warehouse">Tổng kho Bình Dương</option>
              </select>
            </div>
          </div>

          {/* Interactive Simulation Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Device Display Container */}
            <div className="lg:col-span-7 flex justify-center">
              {/* 1. TELEGRAM MINI APP PREVIEW */}
              {deviceMode === 'telegram' && (
                <div className="w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[640px]">
                  {/* Telegram Header */}
                  <div className="px-4 py-3 bg-sky-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        <Send className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs leading-none">Hendy Store Official Bot</h4>
                        <span className="text-[10px] text-sky-100">Telegram Mini App &middot; bot</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-sky-700/60 px-2 py-0.5 rounded">
                      initData Verified
                    </span>
                  </div>

                  {/* Telegram App Body */}
                  <div className="flex-1 p-4 bg-slate-950 overflow-y-auto space-y-4">
                    {/* Welcome Banner */}
                    <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-sky-300 font-semibold">
                        <span>👋 Xin chào @nguyen_an</span>
                        <span className="text-[10px] font-mono text-emerald-400">Zero-Password Auth</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Bạn đang mua sắm trực tiếp bên trong Telegram. Đơn hàng sẽ tự động gửi biên lai qua tin nhắn bot.
                      </p>
                    </div>

                    {/* Products Grid */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300">Sản Phẩm Nổi Bật (Redis Cache &lt;1ms)</span>
                      <div className="space-y-2">
                        {products.slice(0, 3).map(p => (
                          <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <h5 className="font-semibold text-white">{p.name}</h5>
                              <p className="text-amber-400 font-mono font-bold">
                                {p.salePrice.toLocaleString('vi-VN')}đ
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Tồn kho {selectedStore.toUpperCase()}: {(p.stock as any)[selectedStore]} cái
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p.id)}
                              className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-xs transition-colors"
                            >
                              + Thêm
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Telegram Bottom Bar & Instant Pay */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Tổng thanh toán:</span>
                      <span className="text-sm font-bold font-mono text-amber-400">
                        {cartTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <button
                      onClick={() => handleCheckout('telegram_mini_app')}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Đặt Hàng Trong Bot</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. MOBILE & HANDHELD POS PREVIEW (Flutter / React Native) */}
              {deviceMode === 'mobile' && (
                <div className="w-full max-w-sm bg-slate-900 border-4 border-slate-800 rounded-[36px] overflow-hidden shadow-2xl flex flex-col h-[640px] relative">
                  {/* Dynamic Island / Notch */}
                  <div className="h-6 bg-slate-950 flex items-center justify-center">
                    <div className="w-24 h-4 bg-slate-900 rounded-full" />
                  </div>

                  {/* Mobile Header */}
                  <div className="px-4 py-2.5 bg-indigo-900/60 border-b border-indigo-800/40 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold font-mono">Hendy POS Mobile (Flutter)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">5G Online</span>
                  </div>

                  {/* Mobile App Body */}
                  <div className="flex-1 p-4 bg-slate-950 overflow-y-auto space-y-3">
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-indigo-300">POS Cầm Tay Nhân Viên Bán Hàng</span>
                      <p className="text-[11px] text-slate-400">Quét mã vạch barcode, tạo đơn và in hóa đơn di động qua Bluetooth.</p>
                    </div>

                    <div className="space-y-2">
                      {products.map(p => (
                        <div key={p.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-md flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-200">{p.name}</span>
                            <div className="text-[11px] font-mono text-amber-400 font-bold">
                              {p.salePrice.toLocaleString('vi-VN')}đ
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Barcode: {p.barcode}</span>
                          </div>
                          <button
                            onClick={() => handleAddToCart(p.id)}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs"
                          >
                            + Quét
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Bottom POS Checkout */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">Giỏ hàng:</span>
                      <p className="text-xs font-bold font-mono text-white">{cartTotal.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <button
                      onClick={() => handleCheckout('handheld_pos')}
                      className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-md text-xs transition-colors"
                    >
                      Xuất Hóa Đơn POS
                    </button>
                  </div>
                </div>
              )}

              {/* 3. DESKTOP PC POS (Electron / Tauri) */}
              {deviceMode === 'pos_desktop' && (
                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[640px]">
                  {/* Desktop Title Bar */}
                  <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="font-mono text-slate-300 font-semibold ml-2">
                        Hendy Desktop POS v2.8 (Electron / Tauri Client)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">Offline SQLite & Sync Ready</span>
                  </div>

                  {/* Desktop Body */}
                  <div className="flex-1 p-4 bg-slate-950 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {products.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddToCart(p.id)}
                          className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/80 rounded-md cursor-pointer transition-all space-y-1"
                        >
                          <span className="text-xs font-semibold text-white line-clamp-1">{p.name}</span>
                          <span className="text-xs font-mono font-bold text-amber-400 block">
                            {p.salePrice.toLocaleString('vi-VN')}đ
                          </span>
                          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                            <span>SKU: {p.sku}</span>
                            <span className="text-emerald-400">Kho: {(p.stock as any)[selectedStore]}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Active Order Summary */}
                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">Hóa Đơn Thu Ngân Tại Quầy</span>
                        <span className="font-mono text-amber-400 font-bold">{cartTotal.toLocaleString('vi-VN')}đ</span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setCart({})}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded"
                        >
                          Xóa Trắng
                        </button>
                        <button
                          onClick={() => handleCheckout('desktop_pos')}
                          className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                        >
                          In Hóa Đơn & Chốt Ca Thu Ngân
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. WEB PORTAL PREVIEW */}
              {deviceMode === 'web' && (
                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[640px]">
                  {/* Browser URL Bar */}
                  <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-mono text-xs">https://store.hendy-server.app</span>
                    <span className="text-slate-500 text-[11px]">| Next.js 14 SSG/ISR & Cloudflare WAF</span>
                  </div>

                  <div className="flex-1 p-5 bg-slate-950 overflow-y-auto space-y-4">
                    <div className="p-4 bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-800/40 rounded-lg space-y-1">
                      <h4 className="text-sm font-bold text-white">Next.js 14 Universal Storefront</h4>
                      <p className="text-xs text-slate-400">
                        Cùng chung một URL, tự động nhận diện trình duyệt ngoài (JWT Token Auth) hoặc Telegram (initData Auth).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {products.map(p => (
                        <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                          <span className="font-semibold text-xs text-white block">{p.name}</span>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {p.salePrice.toLocaleString('vi-VN')}đ
                          </span>
                          <button
                            onClick={() => handleAddToCart(p.id)}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                          >
                            Thêm Vào Giỏ Web
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 cols: Dual Auth Inspector & Telegram Live Bot Alerts */}
            <div className="lg:col-span-5 space-y-4">
              {/* Dual Auth Filter Inspector */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Bộ Lọc Xác Thực Kép (Dual Auth Filter)
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">Middleware Active</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 space-y-1">
                    <span className="text-indigo-400 font-bold">Luồng 1 (Trình duyệt ngoài):</span>
                    <p className="text-slate-400 font-sans">Check JWT Token / Cookie &rarr; Phân quyền Role (Khách / Admin) qua Redis ACL (&lt;1ms).</p>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 space-y-1">
                    <span className="text-sky-400 font-bold">Luồng 2 (Telegram Bot Mini App):</span>
                    <p className="text-slate-400 font-sans">Giải mã mã hóa <code className="text-amber-300">initData</code> bằng HMAC-SHA256 &rarr; Tự động đăng nhập không cần mật khẩu.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={handleVerifyTelegramAuth}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded transition-colors text-xs"
                  >
                    Test Giải Mã initData Telegram
                  </button>
                  {telegramAuthResult && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Telegram Bot Live Dispatch Queue */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    Telegram Bot Notification Worker
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{telegramLogs.length} tin nhắn gửi</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {telegramLogs.map(log => (
                    <div key={log.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-md text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-mono text-sky-400">{log.recipient}</span>
                        <span className="font-mono tabular-nums">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE & TRAFFIC FLOW */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Sơ Đồ Luồng Dữ Liệu & Phân Tầng Hệ Thống (Traffic Topology)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Từ Internet Inbound Traffic qua Cloudflare WAF, Nginx Ingress, Backend Microservices, Redis Cluster, tới PostgreSQL Master.
              </p>
            </div>

            {/* Pipeline Flow Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-400">1. Edge & WAF</span>
                  <span className="text-[10px] font-mono text-emerald-400">Anti-DDoS</span>
                </div>
                <p className="text-slate-400">Cloudflare Edge WAF ngăn chặn tấn công hỏa lực, rate limit 20 req/s, cache static assets.</p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">R2 Bucket: /installers/*.exe</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-400">2. Reverse Proxy</span>
                  <span className="text-[10px] font-mono text-indigo-400">Nginx / Kong</span>
                </div>
                <p className="text-slate-400">Định tuyến /api/v1/storefront, /api/v1/pos, bộ lọc xác thực kép (JWT / Telegram initData).</p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">Zero-downtime upstream swap</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400">3. Microservices</span>
                  <span className="text-[10px] font-mono text-amber-400">Node / TS</span>
                </div>
                <p className="text-slate-400">StoreFront Service, POS Service, Multi-store Inventory, Telegram Notification Worker.</p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">Socket.io real-time broadcast</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-400">4. Storage & Search</span>
                  <span className="text-[10px] font-mono text-sky-400">&lt;1ms Cache</span>
                </div>
                <p className="text-slate-400">Redis Cluster 7.2 (Role & Catalog Cache), PostgreSQL 16 (Master Ledger), Elasticsearch 8.x.</p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">ACID transactions guaranteed</div>
              </div>
            </div>

            {/* Zero Downtime Deployment Details */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs">
              <span className="font-semibold text-slate-200">Quy Trình DevOps CI/CD Triển Khai Đồng Bộ Không Gián Đoạn (Zero-Downtime):</span>
              <p className="text-slate-400 leading-relaxed font-mono">
                [Dev Push Code] &rarr; [GitHub Actions CI/CD] &rarr; [Docker Build with Cache-Busting Hash] &rarr; [SSH Server Deploy Container] &rarr; [Nginx Upstream Reload].
                Cả Web ngoài và Telegram Mini App được nâng cấp lên phiên bản mới ngay lập tức tại cùng một thời điểm mà người dùng không bị văng phiên đăng nhập.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATION ENGINE (Phân Tích & Sinh Swagger) */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Bộ Máy Tự Động Đề Xuất & Sinh API (Automation Engine)</h3>
              </div>
              <button
                onClick={handleRunAutomationAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isAnalyzing ? 'Đang Phân Tích...' : 'Phân Tích & Sinh API'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mô tả ý tưởng ứng dụng / nghiệp vụ mới:</label>
                <input
                  type="text"
                  value={appIdeaInput}
                  onChange={e => setAppIdeaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chọn nền tảng mục tiêu:</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'mobile', label: 'Mobile (Android/iOS)' },
                    { id: 'handheld_pos', label: 'POS Cầm Tay' },
                    { id: 'desktop_pc', label: 'Desktop PC (Windows/Mac)' },
                    { id: 'telegram_mini_app', label: 'Telegram Mini App' },
                    { id: 'web_portal', label: 'Web Portal' }
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetPlatforms.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) setTargetPlatforms(prev => [...prev, p.id]);
                          else setTargetPlatforms(prev => prev.filter(x => x !== p.id));
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Results */}
            {automationResult && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[10px]">Framework Khuyên Dùng:</span>
                    <span className="text-amber-400 font-bold">{automationResult.decision.recommendedFramework}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[10px]">Hạ Tầng Microservices:</span>
                    <span className="text-indigo-400 font-bold">{automationResult.decision.architectureTier}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[10px]">Tầng Cache & WAF:</span>
                    <span className="text-emerald-400 font-bold">{automationResult.decision.cache}</span>
                  </div>
                </div>

                {/* Swagger JSON Spec */}
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-300">Tài Liệu Cấu Trúc API Tự Động Sinh (OpenAPI / Swagger JSON):</span>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-300 overflow-x-auto max-h-64">
                    {JSON.stringify(automationResult.swaggerSpec, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CLOUDFLARE EDGE & R2 INSTALLERS */}
      {activeTab === 'edge' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Cloudflare Edge WAF & R2 Storage Gate</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">Rate Limiting: 20 req/s Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="font-bold text-white font-mono">HendyPOS_Windows_x64.exe</span>
                <p className="text-slate-400">Bản cài đặt Desktop POS thu ngân cho máy tính Windows 10/11.</p>
                <button
                  onClick={() => handleRequestInstallerUrl('HendyPOS_Windows_x64.exe', 'windows')}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium mt-2"
                >
                  Sinh Signed URL (15 phút)
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="font-bold text-white font-mono">HendyPOS_macOS_AppleSilicon.dmg</span>
                <p className="text-slate-400">Bản cài đặt Desktop POS cho macOS M1/M2/M3 kiến trúc ARM64.</p>
                <button
                  onClick={() => handleRequestInstallerUrl('HendyPOS_macOS_AppleSilicon.dmg', 'macos')}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium mt-2"
                >
                  Sinh Signed URL (15 phút)
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="font-bold text-white font-mono">HendyHandheld_Android_POS.apk</span>
                <p className="text-slate-400">Bản đóng gói APK POS di động cho thiết bị cầm tay Sunmi / iMin.</p>
                <button
                  onClick={() => handleRequestInstallerUrl('HendyHandheld_Android_POS.apk', 'android')}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium mt-2"
                >
                  Sinh Signed URL (15 phút)
                </button>
              </div>
            </div>

            {/* Signed Download URL Result */}
            {signedDownload && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Cloudflare R2 Signed Download Gate:</span>
                  <span className="text-emerald-400">{signedDownload.antivirusStatus}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-emerald-400 break-all">
                  {signedDownload.signedUrl}
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>SHA-256: {signedDownload.sha256Hash}</span>
                  <span>{signedDownload.rateLimiting}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

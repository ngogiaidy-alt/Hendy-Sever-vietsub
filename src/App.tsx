import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Overview } from './pages/Overview.tsx';
import { Repositories } from './pages/Repositories.tsx';
import { Deployments } from './pages/Deployments.tsx';
import { VietsubPro } from './pages/VietsubPro.tsx';
import { OmniChannel } from './pages/OmniChannel.tsx';
import { CloudflareDeploy } from './pages/CloudflareDeploy.tsx';
import { WebhookInspector } from './pages/WebhookInspector.tsx';
import { InfraExplorer } from './pages/InfraExplorer.tsx';
import { SourceExplorer } from './pages/SourceExplorer.tsx';
import { Settings } from './pages/Settings.tsx';
import { QuickBuildModal } from './components/QuickBuildModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { notification } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar Contract (3 zones) */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace: Sidebar + Dynamic Content Canvas */}
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === 'overview' && <Overview onNavigate={setActiveTab} />}
          {activeTab === 'omni' && <OmniChannel />}
          {activeTab === 'vietsub' && <VietsubPro />}
          {activeTab === 'cloudflare' && <CloudflareDeploy />}
          {activeTab === 'repositories' && <Repositories onNavigate={setActiveTab} />}
          {activeTab === 'deployments' && <Deployments />}
          {activeTab === 'webhooks' && <WebhookInspector />}
          {activeTab === 'code' && <SourceExplorer />}
          {activeTab === 'infra' && <InfraExplorer />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Quick Build Modal */}
      <QuickBuildModal
        onSuccess={depId => {
          setActiveTab('deployments');
        }}
      />

      {/* GitHub Authentication Modal */}
      <AuthModal />

      {/* Floating System Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-xs font-medium backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardLayout />
    </AuthProvider>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { BuildLogEntry } from '../api/client.ts';
import { Copy, Check, Terminal as TermIcon, ChevronDown, RotateCcw } from 'lucide-react';

interface TerminalLogsProps {
  logs: BuildLogEntry[];
  title?: string;
  isStreaming?: boolean;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs, title = 'Nhật Ký Thực Thi Worker', isStreaming = false }) => {
  const [filterStage, setFilterStage] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = filterStage === 'all' ? logs : logs.filter(l => l.stage === filterStage);

  const copyToClipboard = () => {
    const raw = logs.map(l => `[${l.timestamp}] [${l.stage.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: BuildLogEntry['level']) => {
    switch (level) {
      case 'cmd':
        return 'text-sky-400 font-medium';
      case 'success':
        return 'text-emerald-400 font-medium';
      case 'warn':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400 font-semibold';
      default:
        return 'text-slate-300';
    }
  };

  const getStageTag = (stage: BuildLogEntry['stage']) => {
    switch (stage) {
      case 'clone':
        return 'git';
      case 'deps':
        return 'deps';
      case 'docker':
        return 'docker';
      case 'test':
        return 'test';
      case 'deploy':
        return 'deploy';
      default:
        return stage;
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs flex flex-col h-full shadow-lg">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-300 font-sans text-xs font-medium ml-2">{title}</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Đang truyền dòng (Streaming)
            </span>
          )}
        </div>

        {/* Filter & Actions */}
        <div className="flex items-center gap-2">
          {/* Stage Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px]">
            <span className="text-slate-500 mr-1.5">Giai đoạn:</span>
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả ({logs.length})</option>
              <option value="clone">Clone Git</option>
              <option value="deps">Cài đặt gói</option>
              <option value="docker">Docker build</option>
              <option value="test">Kiểm thử</option>
              <option value="deploy">Triển khai</option>
            </select>
          </div>

          <button
            onClick={copyToClipboard}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Sao chép nhật ký"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div ref={scrollRef} className="p-4 overflow-y-auto space-y-1.5 max-h-[460px] min-h-[280px]">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center font-sans">Không có nhật ký cho giai đoạn này.</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-3 leading-relaxed hover:bg-slate-900/40 px-1 py-0.5 rounded">
              <span className="text-slate-600 select-none tabular-nums text-[11px] shrink-0">{log.timestamp}</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-900 border border-slate-800 text-slate-400 rounded shrink-0">
                {getStageTag(log.stage)}
              </span>
              <span className={`break-all ${getLevelColor(log.level)}`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

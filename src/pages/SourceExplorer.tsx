import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Code2,
  FileCode,
  FolderTree,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-react';

export const SourceExplorer: React.FC = () => {
  const { showNotification } = useAuth();
  const [tree, setTree] = useState<{ group: string; files: string[] }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('python-engine/media_node/whisper_asr.py');
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadTree() {
      try {
        const treeData = await api.getCodeTree();
        setTree(treeData);
      } catch (err) {
        console.error('Không thể tải cây thư mục mã nguồn', err);
      }
    }
    loadTree();
  }, []);

  useEffect(() => {
    async function loadContent() {
      if (!selectedFile) return;
      setLoading(true);
      try {
        const data = await api.getCodeFile(selectedFile);
        setFileContent(data.content);
      } catch (err: any) {
        setFileContent(`// Lỗi khi đọc tệp tin: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    showNotification('Đã sao chép mã nguồn vào bộ nhớ tạm', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = fileContent.split('\n');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Trình Duyệt Mã Nguồn Monorepo</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Duyệt và kiểm tra cấu trúc toàn bộ tệp tin trong <code className="text-indigo-300">frontend/</code>, <code className="text-indigo-300">api-gateway/</code>, <code className="text-indigo-300">python-engine/</code>, và <code className="text-indigo-300">infra/</code>.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Sao Chép Tệp Tin</span>
        </button>
      </div>

      {/* Main Explorer: File List (4 cols) vs Code Display (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monorepo Tree (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-4 max-h-[680px] overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            <span>Cây Thư Mục Hendy-Server</span>
          </div>

          <div className="space-y-4">
            {tree.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                  {grp.group}
                </div>
                <div className="space-y-0.5">
                  {grp.files.map(filePath => {
                    const isSelected = selectedFile === filePath;
                    const fileName = filePath.split('/').pop() || filePath;
                    return (
                      <button
                        key={filePath}
                        onClick={() => setSelectedFile(filePath)}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-medium'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="truncate">{fileName}</span>
                        <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[680px]">
          {/* File Tab Bar */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-slate-200 font-semibold">{selectedFile}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              {lines.length} dòng &middot; {fileContent.length.toLocaleString('vi-VN')} byte
            </div>
          </div>

          {/* Code Viewer Area with Line Numbers */}
          <div className="flex-1 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 p-4">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-sans">Đang đọc nội dung tệp...</div>
            ) : (
              <div className="table w-full">
                {lines.map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-slate-900/50">
                    <span className="table-cell pr-4 select-none text-slate-600 text-right tabular-nums w-10 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="table-cell pl-2 whitespace-pre text-slate-200 break-words">
                      {line || ' '}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

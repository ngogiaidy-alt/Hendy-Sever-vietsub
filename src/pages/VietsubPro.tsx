import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AudioDuckingVisualizer } from '../components/AudioDuckingVisualizer.tsx';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Search,
  Replace,
  Download,
  Upload,
  Wand2,
  Sliders,
  Scissors,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Radio,
  Tv,
  Sparkles,
  FileCode,
  Settings2,
  Maximize2,
  Copy,
  Layers,
  Cpu,
  BookOpen
} from 'lucide-react';

interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  speaker: string;
  originalText: string;
  translatedText: string;
  cps?: number;
  cpsWarning?: boolean;
}

interface GlossaryItem {
  source: string;
  target: string;
  notes?: string;
}

export const VietsubPro: React.FC = () => {
  const { showNotification } = useAuth();

  // Active Main Pillar Navigation: 'editor' | 'media' | 'asr' | 'translation' | 'subtitle' | 'export'
  const [activePillar, setActivePillar] = useState<'editor' | 'media' | 'asr' | 'translation' | 'subtitle' | 'export'>('editor');

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(32);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

  // Subtitle State
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);

  // Search & Replace State
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'translated' | 'original'>('translated');

  // Translation Engine State
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [contextMemory, setContextMemory] = useState('');
  const [newGlossarySource, setNewGlossarySource] = useState('');
  const [newGlossaryTarget, setNewGlossaryTarget] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // ASR Engine State
  const [whisperModel, setWhisperModel] = useState('large-v3');
  const [vadThreshold, setVadThreshold] = useState(0.5);
  const [enableDiarization, setEnableDiarization] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Subtitle Styling (ASS Engine)
  const [assFont, setAssFont] = useState('Plus Jakarta Sans');
  const [assFontSize, setAssFontSize] = useState(48);
  const [assPrimaryColor, setAssPrimaryColor] = useState('#FFFFFF');
  const [assOutlineColor, setAssOutlineColor] = useState('#000000');
  const [assOutlineWidth, setAssOutlineWidth] = useState(2.0);
  const [assShadowDepth, setAssShadowDepth] = useState(1.0);

  // Media Engine State
  const [videoProbe, setVideoProbe] = useState<any>(null);
  const [burninCommand, setBurninCommand] = useState('');
  const [duckingParams, setDuckingParams] = useState({
    enabled: true,
    attenuationDb: -14,
    thresholdDb: -22
  });

  // Load Seed / Demo Data on Mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const demo = await api.vietsub.getDemoProject();
        setCues(demo.cues);
        if (demo.cues.length > 0) setSelectedCueId(demo.cues[0].id);

        const g = await api.vietsub.getGlossary();
        setGlossary(g.glossary);
        setContextMemory(g.contextMemory);

        const probe = await api.vietsub.probeMedia(demo.videoUrl);
        setVideoProbe(probe);

        const burn = await api.vietsub.getFFmpegBurninCommand('input.mp4', 'subs.ass', 'output_vietsub.mp4');
        setBurninCommand(burn.command);
      } catch (err) {
        console.error('Failed to load initial Vietsub demo data', err);
      }
    }
    loadInitial();
  }, []);

  // Update current subtitle cue based on video playback
  useEffect(() => {
    const active = cues.find(c => currentTime >= c.start && currentTime <= c.end);
    if (active && active.id !== selectedCueId) {
      setSelectedCueId(active.id);
    }
  }, [currentTime, cues]);

  // Video Time Update Listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 32);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, seconds));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Currently Active Cue for Display
  const currentActiveCue = cues.find(c => currentTime >= c.start && currentTime <= c.end);

  // 1. SUBTITLE EDITOR OPERATIONS
  const handleUpdateCue = (id: string, field: keyof SubtitleCue, value: any) => {
    setCues(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          // recalculate CPS
          const dur = Math.max(0.1, updated.end - updated.start);
          const chars = (updated.translatedText || updated.originalText || '').length;
          updated.cps = Number((chars / dur).toFixed(1));
          updated.cpsWarning = updated.cps > 20;
          return updated;
        }
        return c;
      })
    );
  };

  const handleAddCue = () => {
    const last = cues[cues.length - 1];
    const newStart = last ? Number((last.end + 0.2).toFixed(2)) : Number(currentTime.toFixed(2));
    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      start: newStart,
      end: Number((newStart + 3.0).toFixed(2)),
      speaker: 'Speaker',
      originalText: 'New dialogue sentence.',
      translatedText: 'Câu thoại phụ đề mới.',
      cps: 8.0,
      cpsWarning: false
    };
    setCues(prev => [...prev, newCue]);
    setSelectedCueId(newCue.id);
    showNotification('Đã thêm một khối phụ đề mới', 'info');
  };

  const handleDeleteCue = (id: string) => {
    setCues(prev => prev.filter(c => c.id !== id));
    showNotification('Đã xóa khối phụ đề', 'info');
  };

  const handleSplitCue = (cue: SubtitleCue) => {
    const mid = Number(((cue.start + cue.end) / 2).toFixed(2));
    const first: SubtitleCue = {
      ...cue,
      end: mid,
      translatedText: cue.translatedText.slice(0, Math.floor(cue.translatedText.length / 2)).trim()
    };
    const second: SubtitleCue = {
      ...cue,
      id: `cue-${Date.now()}`,
      start: mid,
      translatedText: cue.translatedText.slice(Math.floor(cue.translatedText.length / 2)).trim()
    };
    setCues(prev => prev.flatMap(c => (c.id === cue.id ? [first, second] : [c])));
    showNotification('Đã chia phụ đề thành 2 phân đoạn cân đối', 'info');
  };

  // 2. SEARCH & REPLACE
  const handleSearchReplace = (replaceAll = false) => {
    if (!searchQuery) return;
    let count = 0;
    setCues(prev =>
      prev.map(c => {
        const text = searchTarget === 'translated' ? c.translatedText : c.originalText;
        const flags = matchCase ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
        const reg = new RegExp(searchQuery, flags);
        if (reg.test(text)) {
          count++;
          const newText = text.replace(reg, replaceQuery);
          return {
            ...c,
            [searchTarget === 'translated' ? 'translatedText' : 'originalText']: newText
          };
        }
        return c;
      })
    );
    showNotification(`Đã thay thế ${count} vị trí phù hợp`, 'success');
  };

  // 3. AI TRANSLATION
  const handleRunAiTranslation = async () => {
    setIsTranslating(true);
    try {
      const payload = cues.map(c => ({ id: c.id, text: c.originalText, speaker: c.speaker }));
      const res = await api.vietsub.translateCues(payload, 'vi', glossary, contextMemory);
      if (res.success && res.results) {
        setCues(prev =>
          prev.map(c => {
            const found = res.results.find(r => r.id === c.id);
            if (found) {
              const dur = Math.max(0.1, c.end - c.start);
              const cps = Number((found.translated.length / dur).toFixed(1));
              return {
                ...c,
                translatedText: found.translated,
                cps,
                cpsWarning: cps > 20
              };
            }
            return c;
          })
        );
        showNotification('Gemini AI đã hoàn thành dịch thuật ngữ cảnh cho toàn bộ phụ đề!', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Dịch thuật thất bại', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // 4. ASR TRANSCRIPTION
  const handleRunASR = async () => {
    setIsTranscribing(true);
    try {
      const res = await api.vietsub.transcribeASR({
        model: whisperModel,
        vadThreshold,
        diarization: enableDiarization
      });
      if (res.segments) {
        const newCues: SubtitleCue[] = res.segments.map(s => ({
          id: s.id,
          start: s.start,
          end: s.end,
          speaker: s.speaker,
          originalText: s.originalText,
          translatedText: s.translatedText,
          cps: Number((s.translatedText.length / (s.end - s.start)).toFixed(1)),
          cpsWarning: false
        }));
        setCues(newCues);
        showNotification(`Mô hình Whisper ${whisperModel} đã bóc băng tiếng nói chuẩn xác với VAD!`, 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Bóc băng ASR thất bại', 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 5. TIMING AUTO-CORRECTION & CPS OPTIMIZATION
  const handleAutoCorrectTiming = async () => {
    try {
      const res = await api.vietsub.correctTiming(cues, 1.0, 0.25);
      if (res.success) {
        setCues(res.correctedCues);
        showNotification('Đã căn chỉnh mốc thời gian: ghép khoảng hở < 250ms & đảm bảo tối thiểu 1.0s', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Căn chỉnh thời gian thất bại', 'error');
    }
  };

  const handleOptimizeCPS = async () => {
    try {
      const res = await api.vietsub.optimizeCPS(cues, 20);
      setCues(res.evaluated);
      showNotification(`Đã đánh giá CPS: phát hiện ${res.flaggedCount} câu vượt quá 20 ký tự/giây.`, 'info');
    } catch (err: any) {
      showNotification(err.message || 'Tối ưu CPS thất bại', 'error');
    }
  };

  // 6. EXPORT
  const handleExport = async (format: 'srt' | 'ass' | 'vtt' | 'json') => {
    try {
      const res = await api.vietsub.exportSubtitles(cues, format, 'VIETSUB_PRO_STUDIO');
      const blob = new Blob([res.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      showNotification(`Đã xuất tệp phụ đề ${res.filename} thành công!`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Xuất tệp thất bại', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Pillar Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">VIETSUB PRO Studio & Động Cơ Media</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Bộ công cụ biên tập và xử lý video chuyên nghiệp: Động cơ Media, Whisper ASR, Dịch thuật AI ngữ cảnh, Phụ đề ASS/SRT và Trình biên tập Studio.
          </p>
        </div>

        {/* 5-Pillar Segmented Navigation Bar */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActivePillar('editor')}
            className={`px-3 py-1.5 rounded-md transition-colors font-semibold flex items-center gap-1.5 ${
              activePillar === 'editor' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Trình Biên Tập</span>
          </button>
          <button
            onClick={() => setActivePillar('media')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
              activePillar === 'media' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>1. Media Engine</span>
          </button>
          <button
            onClick={() => setActivePillar('asr')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
              activePillar === 'asr' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>2. Bóc Băng ASR</span>
          </button>
          <button
            onClick={() => setActivePillar('translation')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
              activePillar === 'translation' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Dịch Thuật AI</span>
          </button>
          <button
            onClick={() => setActivePillar('subtitle')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
              activePillar === 'subtitle' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>4. Phụ Đề ASS</span>
          </button>
          <button
            onClick={() => setActivePillar('export')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
              activePillar === 'export' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>5. Xuất Tệp</span>
          </button>
        </div>
      </div>

      {/* PILLAR 5: STUDIO EDITOR (Video Preview + Waveform Timeline + Subtitle Grid + Search/Replace) */}
      {activePillar === 'editor' && (
        <div className="space-y-6">
          {/* Top Video Preview & Quick Tools (Two Column: 7 cols Video, 5 cols Search/Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Video Canvas & Synced ASS Subtitle Overlay */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between shadow-xl">
              {/* Video Header Bar */}
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white font-mono">1080p Preview &middot; 60 FPS</span>
                </div>
                <div className="font-mono text-slate-400 tabular-nums">
                  {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                </div>
              </div>

              {/* Video Player Box with Subtitle Overlay */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="w-full h-full object-contain"
                  playsInline
                />

                {/* Real-time Subtitle Overlay (Styled with ASS parameters) */}
                {currentActiveCue && (
                  <div
                    className="absolute bottom-6 left-0 right-0 px-8 text-center pointer-events-none select-none z-20"
                    style={{
                      fontFamily: assFont,
                      fontSize: `${assFontSize * 0.45}px`,
                      color: assPrimaryColor,
                      textShadow: `${assOutlineWidth}px ${assOutlineWidth}px 0px ${assOutlineColor}, -${assOutlineWidth}px -${assOutlineWidth}px 0px ${assOutlineColor}, ${assOutlineWidth}px -${assOutlineWidth}px 0px ${assOutlineColor}, -${assOutlineWidth}px ${assOutlineWidth}px 0px ${assOutlineColor}, 0px ${assShadowDepth + 2}px 6px rgba(0,0,0,0.8)`
                    }}
                  >
                    <p className="font-semibold tracking-wide drop-shadow-md leading-snug">
                      {currentActiveCue.translatedText}
                    </p>
                    <p className="text-xs opacity-75 font-mono text-slate-300 mt-1">
                      ({currentActiveCue.originalText})
                    </p>
                  </div>
                )}
              </div>

              {/* Player Transport Controls */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => seekTo(currentTime - 2)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Rewind 2s"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded flex items-center gap-1.5 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    onClick={() => seekTo(currentTime + 2)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Fast forward 2s"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => seekTo(0)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Speed & Volume */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-mono">
                    <span className="text-slate-500 mr-1.5">Speed:</span>
                    <select
                      value={playbackRate}
                      onChange={e => {
                        const r = Number(e.target.value);
                        setPlaybackRate(r);
                        if (videoRef.current) videoRef.current.playbackRate = r;
                      }}
                      className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1.0}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2.0}>2.0x</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Search/Replace & Quick Action Toolbox */}
            <div className="lg:col-span-5 space-y-4">
              {/* Search & Replace Box */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    Search & Batch Replace
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchCase}
                        onChange={e => setMatchCase(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Match Case</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSearchTarget('translated')}
                      className={`py-1 rounded text-center transition-colors ${
                        searchTarget === 'translated' ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      In Vietnamese Subtitles
                    </button>
                    <button
                      onClick={() => setSearchTarget('original')}
                      className={`py-1 rounded text-center transition-colors ${
                        searchTarget === 'original' ? 'bg-slate-800 text-indigo-300 font-semibold' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      In Original Speech
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Find text..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Replace with..."
                    value={replaceQuery}
                    onChange={e => setReplaceQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleSearchReplace(false)}
                      disabled={!searchQuery}
                      className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors disabled:opacity-40"
                    >
                      Replace Next
                    </button>
                    <button
                      onClick={() => handleSearchReplace(true)}
                      disabled={!searchQuery}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors disabled:opacity-40"
                    >
                      Replace All
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick AI & Timing Action Matrix */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  One-Click Engine Optimization
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleRunAiTranslation}
                    disabled={isTranslating}
                    className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 rounded text-left transition-colors flex flex-col justify-between"
                  >
                    <span className="font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Gemini AI Translate
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Contextual memory & glossary</span>
                  </button>

                  <button
                    onClick={handleAutoCorrectTiming}
                    className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 rounded text-left transition-colors flex flex-col justify-between"
                  >
                    <span className="font-semibold flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-emerald-400" />
                      Auto-Correct Timing
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Snap gaps & min duration 1.0s</span>
                  </button>

                  <button
                    onClick={handleOptimizeCPS}
                    className="p-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 rounded text-left transition-colors flex flex-col justify-between"
                  >
                    <span className="font-semibold flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-amber-400" />
                      CPS Audit & Speed
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Cap at 20 chars/sec</span>
                  </button>

                  <button
                    onClick={handleAddCue}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-left transition-colors flex flex-col justify-between"
                  >
                    <span className="font-semibold flex items-center gap-1">
                      <Plus className="w-3 h-3 text-slate-400" />
                      Insert Cue Block
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">At current playhead</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Audio Waveform Track */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Audio Waveform Timeline Track
              </span>
              <span className="font-mono text-[11px] tabular-nums">
                Playhead: {currentTime.toFixed(2)}s &middot; Total: {duration.toFixed(2)}s
              </span>
            </div>

            {/* Visual Waveform Bar + Draggable Cursor */}
            <div
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seekTo(pos * duration);
              }}
              className="relative h-20 bg-slate-900 rounded-md border border-slate-800/80 cursor-pointer overflow-hidden select-none"
            >
              {/* Simulated Audio Spectrum Peaks */}
              <div className="absolute inset-0 flex items-center justify-between px-1 opacity-60">
                {Array.from({ length: 90 }).map((_, i) => {
                  const h = Math.max(15, Math.sin(i * 0.3) * 60 + Math.cos(i * 0.7) * 25 + 20);
                  return (
                    <div
                      key={i}
                      className="w-1 bg-indigo-500/70 rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>

              {/* Subtitle Cue Blocks on Timeline */}
              {cues.map(cue => {
                const leftPercent = (cue.start / duration) * 100;
                const widthPercent = Math.max(2, ((cue.end - cue.start) / duration) * 100);
                const isSelected = cue.id === selectedCueId;

                return (
                  <div
                    key={cue.id}
                    onClick={e => {
                      e.stopPropagation();
                      seekTo(cue.start);
                      setSelectedCueId(cue.id);
                    }}
                    className={`absolute top-2 bottom-2 rounded px-1.5 text-[10px] font-mono flex items-center overflow-hidden border truncate transition-all ${
                      isSelected
                        ? 'bg-amber-500/40 border-amber-400 text-amber-200 font-bold z-10'
                        : 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/50'
                    }`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    title={`${cue.start}s - ${cue.end}s: ${cue.translatedText}`}
                  >
                    <span className="truncate">{cue.translatedText}</span>
                  </div>
                );
              })}

              {/* Playhead Red Indicator Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              >
                <div className="w-2.5 h-2.5 bg-rose-500 -ml-1 rounded-full" />
              </div>
            </div>
          </div>

          {/* Subtitle Editor Table / List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Subtitle Segments & Translation Editor</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddCue}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cue</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3 w-12">#</th>
                    <th className="py-2.5 px-3 w-28">Start (s)</th>
                    <th className="py-2.5 px-3 w-28">End (s)</th>
                    <th className="py-2.5 px-3 w-24">Speed (CPS)</th>
                    <th className="py-2.5 px-3 w-32">Speaker</th>
                    <th className="py-2.5 px-3">Original Speech Text</th>
                    <th className="py-2.5 px-3">Vietnamese Subtitle Translation</th>
                    <th className="py-2.5 px-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {cues.map((cue, idx) => {
                    const isSelected = cue.id === selectedCueId;
                    return (
                      <tr
                        key={cue.id}
                        onClick={() => setSelectedCueId(cue.id)}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3 px-3 font-mono text-slate-500 tabular-nums">
                          {idx + 1}
                        </td>

                        {/* Start time */}
                        <td className="py-3 px-3 font-mono">
                          <input
                            type="number"
                            step="0.1"
                            value={cue.start}
                            onChange={e => handleUpdateCue(cue.id, 'start', Number(e.target.value))}
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* End time */}
                        <td className="py-3 px-3 font-mono">
                          <input
                            type="number"
                            step="0.1"
                            value={cue.end}
                            onChange={e => handleUpdateCue(cue.id, 'end', Number(e.target.value))}
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* CPS speed */}
                        <td className="py-3 px-3 font-mono">
                          <span
                            className={`tabular-nums font-semibold ${
                              cue.cpsWarning
                                ? 'text-rose-400'
                                : (cue.cps || 15) > 17
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {cue.cps || 16.0} CPS
                          </span>
                        </td>

                        {/* Speaker tag */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={cue.speaker}
                            onChange={e => handleUpdateCue(cue.id, 'speaker', e.target.value)}
                            className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </td>

                        {/* Original Speech */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={cue.originalText}
                            onChange={e => handleUpdateCue(cue.id, 'originalText', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </td>

                        {/* Vietnamese Translation */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={cue.translatedText}
                            onChange={e => handleUpdateCue(cue.id, 'translatedText', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-300 font-medium text-xs focus:outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                seekTo(cue.start);
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Play from cue start"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleSplitCue(cue);
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Split cue in half"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteCue(cue.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                              title="Delete cue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 1: MEDIA ENGINE */}
      {activePillar === 'media' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Media Engine Architecture</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">FFmpeg 6.1 Native Hardware Acceleration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="text-xs font-semibold text-slate-200">Audio Extraction (16kHz PCM)</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracts raw speech track without downmix distortion, removing music harmonics for Whisper ASR.
                </p>
                <pre className="text-[11px] font-mono text-slate-500 bg-slate-900 p-2 rounded">
                  ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
                </pre>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="text-xs font-semibold text-slate-200">Sidechain Audio Ducking DSP</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dynamic range compression: ducks stream music level (-14dB) when AI voiceover/dialogue triggers.
                </p>
                <pre className="text-[11px] font-mono text-slate-500 bg-slate-900 p-2 rounded">
                  [0:a][1:a]sidechaincompress=threshold=0.08:ratio=4:attack=20[out]
                </pre>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="text-xs font-semibold text-slate-200">Video Hardsub Processing</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-efficiency NVENC / libx264 burning of ASS subtitles with karaoke and box shadow effects.
                </p>
                <pre className="text-[11px] font-mono text-slate-500 bg-slate-900 p-2 rounded">
                  ffmpeg -i video.mp4 -vf &quot;subtitles=subs.ass&quot; -c:a copy out.mp4
                </pre>
              </div>
            </div>

            {/* Probe info & Interactive Burn-in command */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Generated FFmpeg Production Command:</span>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-emerald-400 overflow-x-auto">
                {burninCommand}
              </pre>
            </div>
          </div>

          {/* Audio Ducking Visualizer */}
          <AudioDuckingVisualizer
            attenuationDb={duckingParams.attenuationDb}
            thresholdDb={duckingParams.thresholdDb}
            enabled={duckingParams.enabled}
          />
        </div>
      )}

      {/* PILLAR 2: ASR ENGINE */}
      {activePillar === 'asr' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">ASR Engine (Whisper + VAD + Diarization)</h3>
              </div>
              <button
                onClick={handleRunASR}
                disabled={isTranscribing}
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isTranscribing ? 'Processing Speech...' : 'Run Whisper ASR'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Model Variant</label>
                <select
                  value={whisperModel}
                  onChange={e => setWhisperModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="large-v3">whisper-large-v3 (Highest Vietnamese Accuracy)</option>
                  <option value="medium">whisper-medium (Balanced 6GB VRAM)</option>
                  <option value="small">whisper-small (Fast 3GB VRAM)</option>
                  <option value="base">whisper-base (Sub-200ms ultra low latency)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <label className="font-medium">VAD Silence Threshold</label>
                  <span className="font-mono text-amber-400">{vadThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={vadThreshold}
                  onChange={e => setVadThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-500">Silero VAD threshold for clean speech segmentation</p>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2 bg-slate-950 border border-slate-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDiarization}
                    onChange={e => setEnableDiarization(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">Speaker Diarization</span>
                    <p className="text-[10px] text-slate-500">Separates Host / Guest dialogue automatically</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Word Alignment Preview */}
            <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Timestamp Alignment Architecture:</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic Time Warping (DTW) matches cross-attention weights to speech audio mel spectrograms, producing exact millisecond timestamps for each individual word token.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 3: TRANSLATION ENGINE */}
      {activePillar === 'translation' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">AI Translation, Context Memory & Glossary</h3>
              </div>
              <button
                onClick={handleRunAiTranslation}
                disabled={isTranslating}
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{isTranslating ? 'Translating...' : 'Translate All Cues with Gemini'}</span>
              </button>
            </div>

            {/* Context Memory Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Context Memory (Bối cảnh video)</label>
              <textarea
                rows={2}
                value={contextMemory}
                onChange={e => setContextMemory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                placeholder="Nhập bối cảnh video để AI hiểu chủ đề chuyên sâu..."
              />
            </div>

            {/* Terminology Glossary Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Domain Terminology Glossary (Bảng thuật ngữ)</span>
                <span className="text-[11px] font-mono text-slate-500">{glossary.length} active terms</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {glossary.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-indigo-300 font-semibold">{item.source}</span>
                      <p className="text-slate-300 mt-0.5">&rarr; {item.target}</p>
                      {item.notes && <span className="text-[10px] text-slate-500">{item.notes}</span>}
                    </div>
                    <button
                      onClick={() => setGlossary(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Glossary Form */}
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <input
                  type="text"
                  placeholder="English term (e.g. Sidechain Ducking)"
                  value={newGlossarySource}
                  onChange={e => setNewGlossarySource(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Vietnamese equivalent (Hạ âm nền tự động)"
                  value={newGlossaryTarget}
                  onChange={e => setNewGlossaryTarget(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newGlossarySource && newGlossaryTarget) {
                      setGlossary(prev => [...prev, { source: newGlossarySource, target: newGlossaryTarget }]);
                      setNewGlossarySource('');
                      setNewGlossaryTarget('');
                      showNotification('Added term to Glossary', 'success');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium"
                >
                  Add Term
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 4: SUBTITLE ENGINE (SRT, ASS, VTT, CPS & STYLING) */}
      {activePillar === 'subtitle' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Advanced SubStation Alpha (ASS) Styling Studio</h3>
              </div>
              <button
                onClick={() => handleExport('ass')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
              >
                Export Styled .ASS File
              </button>
            </div>

            {/* Styling Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Font Family</label>
                <select
                  value={assFont}
                  onChange={e => setAssFont(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Arial">Arial Black</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Font Size: {assFontSize}pt</label>
                <input
                  type="range"
                  min="24"
                  max="72"
                  value={assFontSize}
                  onChange={e => setAssFontSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Outline Thickness: {assOutlineWidth}px</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={assOutlineWidth}
                  onChange={e => setAssOutlineWidth(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Shadow Depth: {assShadowDepth}px</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={assShadowDepth}
                  onChange={e => setAssShadowDepth(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Live Subtitle Typography Preview Box */}
            <div className="p-8 bg-slate-950 border border-slate-800 rounded text-center relative overflow-hidden">
              <p
                className="font-bold tracking-wide"
                style={{
                  fontFamily: assFont,
                  fontSize: `${assFontSize * 0.75}px`,
                  color: assPrimaryColor,
                  textShadow: `${assOutlineWidth}px ${assOutlineWidth}px 0px ${assOutlineColor}, -${assOutlineWidth}px -${assOutlineWidth}px 0px ${assOutlineColor}, ${assOutlineWidth}px -${assOutlineWidth}px 0px ${assOutlineColor}, -${assOutlineWidth}px ${assOutlineWidth}px 0px ${assOutlineColor}, 0px ${assShadowDepth + 2}px 6px rgba(0,0,0,0.8)`
                }}
              >
                VIETSUB PRO: Phụ Đề Chuyên Nghiệp Chuẩn Truyền Hình
              </p>
              <p className="text-xs font-mono text-slate-500 mt-3">
                Font: {assFont} &middot; Size: {assFontSize} &middot; Outline: {assOutlineWidth} &middot; Shadow: {assShadowDepth}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 5: EXPORT & FORMATS */}
      {activePillar === 'export' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Export Broadcast Subtitles & Hardsub Burn-in</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white font-mono">.SRT (SubRip)</span>
                  <p className="text-slate-400 mt-1">Universal subtitle standard compatible with YouTube, Premiere, VLC, CapCut.</p>
                </div>
                <button
                  onClick={() => handleExport('srt')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors mt-3"
                >
                  Download .SRT
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-amber-400 font-mono">.ASS (Advanced SubStation)</span>
                  <p className="text-slate-400 mt-1">Preserves custom typography, colors, outline stroke, karaoke glow, and placement.</p>
                </div>
                <button
                  onClick={() => handleExport('ass')}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-colors mt-3"
                >
                  Download .ASS
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white font-mono">.VTT (WebVTT)</span>
                  <p className="text-slate-400 mt-1">HTML5 video streaming standard for modern browsers, HLS, and mobile apps.</p>
                </div>
                <button
                  onClick={() => handleExport('vtt')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors mt-3"
                >
                  Download .VTT
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white font-mono">.JSON (Data Stream)</span>
                  <p className="text-slate-400 mt-1">Raw structured cue objects with timestamps, speaker labels, and CPS metrics.</p>
                </div>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors mt-3"
                >
                  Download .JSON
                </button>
              </div>
            </div>

            {/* Hardsub FFmpeg Command box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Terminal Hardsub Burn-in Command (Single Execution):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(burninCommand);
                    showNotification('Copied FFmpeg hardsub command', 'success');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Command</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-400 overflow-x-auto">
                {burninCommand}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

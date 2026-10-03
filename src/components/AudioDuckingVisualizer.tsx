import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Sliders, Activity } from 'lucide-react';

interface AudioDuckingVisualizerProps {
  attenuationDb: number;
  thresholdDb: number;
  enabled: boolean;
  onUpdateParams?: (params: { attenuationDb: number; thresholdDb: number; enabled: boolean }) => void;
}

export const AudioDuckingVisualizer: React.FC<AudioDuckingVisualizerProps> = ({
  attenuationDb,
  thresholdDb,
  enabled,
  onUpdateParams
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [bgLevel, setBgLevel] = useState<number>(85); // 0-100%
  const [voiceLevel, setVoiceLevel] = useState<number>(0);
  const [gainReductionDb, setGainReductionDb] = useState<number>(0);

  // Dynamic animation simulating real-time audio ducking
  useEffect(() => {
    const interval = setInterval(() => {
      if (isVoiceActive && enabled) {
        // Voice is active: duck background audio
        const targetVoice = 70 + Math.random() * 25;
        setVoiceLevel(targetVoice);
        setGainReductionDb(attenuationDb);
        // Background drops from ~80% to ~25%
        setBgLevel(28 + Math.random() * 8);
      } else {
        // Normal background music/stream level
        setVoiceLevel(Math.random() * 4);
        setGainReductionDb(0);
        setBgLevel(75 + Math.random() * 15);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isVoiceActive, enabled, attenuationDb]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-white">Sidechain Audio Ducking Matrix</h4>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Processor:</span>
          <span className={`font-mono text-xs ${enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
            {enabled ? (isVoiceActive ? 'DUCKING ACTIVE (-' + Math.abs(attenuationDb) + 'dB)' : 'PASSIVE MONITOR') : 'BYPASSED'}
          </span>
        </div>
      </div>

      {/* Dual Waveform / VU Meter Displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stream Background Track */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              Stream Background Level
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {enabled && isVoiceActive ? `${attenuationDb} dB` : '-3.2 dB'}
            </span>
          </div>

          {/* VU Meter Bars */}
          <div className="h-4 bg-slate-900 rounded-sm overflow-hidden flex items-center p-0.5 gap-0.5">
            {Array.from({ length: 24 }).map((_, i) => {
              const active = (i / 24) * 100 <= bgLevel;
              const isHigh = i > 18;
              const isMid = i > 12;
              return (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-xs transition-all duration-75 ${
                    active
                      ? isHigh
                        ? 'bg-rose-500'
                        : isMid
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                      : 'bg-slate-800/50'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            {isVoiceActive && enabled ? 'Attenuated for voice clarity' : 'Nominal broadcast audio'}
          </p>
        </div>

        {/* AI Voiceover / Vietnamese Speech Track */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              AI Voiceover / Dubbing
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {isVoiceActive ? '-1.8 dB' : '-Infinity'}
            </span>
          </div>

          {/* VU Meter Bars */}
          <div className="h-4 bg-slate-900 rounded-sm overflow-hidden flex items-center p-0.5 gap-0.5">
            {Array.from({ length: 24 }).map((_, i) => {
              const active = (i / 24) * 100 <= voiceLevel;
              return (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-xs transition-all duration-75 ${
                    active ? 'bg-amber-400' : 'bg-slate-800/50'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            {isVoiceActive ? 'Voice signal triggers ducking gate' : 'Gate closed (silent)'}
          </p>
        </div>
      </div>

      {/* Controls & Interactive Test */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 mr-1.5">Attenuation:</span>
            <span className="font-mono text-amber-400 font-medium">{attenuationDb} dB</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Threshold:</span>
            <span className="font-mono text-slate-300 font-medium">{thresholdDb} dB</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Attack:</span>
            <span className="font-mono text-slate-300">20ms</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Release:</span>
            <span className="font-mono text-slate-300">250ms</span>
          </div>
        </div>

        {/* Interactive Speech Simulator Button */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => setIsVoiceActive(true)}
            onMouseUp={() => setIsVoiceActive(false)}
            onMouseLeave={() => setIsVoiceActive(false)}
            onTouchStart={() => setIsVoiceActive(true)}
            onTouchEnd={() => setIsVoiceActive(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all select-none ${
              isVoiceActive
                ? 'bg-amber-500 text-slate-950 font-bold scale-95 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isVoiceActive ? 'Voiceover Active (Hold to Duck)' : 'Press & Hold to Test Voice Ducking'}
          </button>
        </div>
      </div>
    </div>
  );
};

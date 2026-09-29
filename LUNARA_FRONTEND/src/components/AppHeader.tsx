import React, { useRef, useEffect, useState } from 'react';
import { NavigationTab } from '../types';
import {
  Orbit,
  Cpu,
  Layers,
  BarChart3,
  BookOpen,
  Settings,
  FileSpreadsheet,
  Compass,
  CheckCircle2,
  RefreshCw,
  Download,
  Server,
  Zap,
} from 'lucide-react';
import { LunaraClient, ConnectionDetails } from '../api/client';
import { BackendConnectionModal } from './BackendConnectionModal';

interface AppHeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isRunningPipeline: boolean;
  onTriggerRun: () => void;
  onExportReport: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  onSelectTab,
  isRunningPipeline,
  onTriggerRun,
  onExportReport,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionDetails | null>(null);
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);

  const refreshConn = async () => {
    try {
      const details = await LunaraClient.checkConnection();
      setConnectionInfo(details);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshConn();
    const interval = setInterval(refreshConn, 15000);
    const handleConnChanged = () => refreshConn();
    const handleSimChanged = () => refreshConn();

    window.addEventListener('lunara_connection_changed', handleConnChanged);
    window.addEventListener('lunara_simulation_changed', handleSimChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('lunara_connection_changed', handleConnChanged);
      window.removeEventListener('lunara_simulation_changed', handleSimChanged);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly enforce muted properties on DOM node for autoplay policy compliance
    video.defaultMuted = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback: listen for user interaction to start playback if blocked by mobile browser policy
        const startPlayback = () => {
          video.play().catch(() => {});
          ['click', 'touchstart', 'touchend', 'scroll'].forEach((evt) => {
            window.removeEventListener(evt, startPlayback);
          });
        };
        ['click', 'touchstart', 'touchend', 'scroll'].forEach((evt) => {
          window.addEventListener(evt, startPlayback, { once: true, passive: true });
        });
      });
    }
  }, []);

  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Executive Overview', icon: <Orbit className="w-4 h-4" /> },
    { id: 'preprocessing', label: 'Preprocessing Phase 1', icon: <Settings className="w-4 h-4" /> },
    { id: 'workspace', label: 'Registration Pipeline', icon: <Layers className="w-4 h-4" />, badge: 'LIVE' },
    { id: 'experiments', label: 'Experiment Ledger', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="lunara-header text-white border-b border-slate-800 shadow-md sticky top-0 z-40 overflow-hidden select-none">
      <div className="lunara-header-video pointer-events-none" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/lunar-landing-poster.jpg"
          onCanPlay={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
          onEnded={(e) => {
            // Unconditional manual loop restart to handle browsers that pause at loop boundary
            const v = e.currentTarget;
            v.currentTime = 0;
            v.play().catch(() => {});
          }}
        >
          <source src="/lunar-landing-header-mobile.mp4" type="video/mp4" media="(max-width: 768px)" />
          <source src="/lunar-landing-header.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="lunara-header-shade pointer-events-none" aria-hidden="true" />

      {/* Main Title & Nav Bar */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Mission Badge */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => onSelectTab('overview')}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center p-0.5 shadow-lg shadow-amber-500/30 ring-1 ring-white/80 overflow-hidden shrink-0">
            <img src="/logo.png" alt="Vyom Drishti Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
                VYOM DRISHTI
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 rounded">
                  v2.4.1-rc
                </span>
              </h1>
              <span className="hidden sm:inline text-xs text-slate-300 font-normal">
                Autonomous Lunar Correspondence Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono flex items-center gap-x-2 gap-y-0.5 flex-wrap mt-0.5">
              <span className="text-slate-200 font-medium">Team Vyom Drishti</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 font-medium">ISRO Space Applications Centre (SAC)</span>
              <span className="text-slate-500 hidden md:inline">•</span>
              <span className="text-cyan-300 font-medium hidden md:inline">Designed for Scientists, Researchers &amp; Students</span>
            </div>
          </div>
        </div>

        {/* Global Action CTA Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Backend Connection Pill */}
          <button
            onClick={() => setIsConnModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-mono transition-all shadow-sm ${
              connectionInfo?.isOnline
                ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/70'
                : connectionInfo?.isSimulation
                ? 'bg-amber-950/70 border-amber-600/60 text-amber-300 hover:bg-amber-900/70'
                : 'bg-rose-950/70 border-rose-600/60 text-rose-300 hover:bg-rose-900/70 animate-pulse'
            }`}
            title="Click to manage backend connection and mode"
          >
            <span className={`w-2 h-2 rounded-full ${
              connectionInfo?.isOnline
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : connectionInfo?.isSimulation
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            }`} />
            <span className="font-semibold hidden sm:inline">
              {connectionInfo?.isOnline
                ? `API: Online ${connectionInfo.latencyMs ? `(${connectionInfo.latencyMs}ms)` : ''}`
                : connectionInfo?.isSimulation
                ? 'Demo Mode'
                : 'API: Offline'}
            </span>
            <span className="font-semibold sm:hidden">
              {connectionInfo?.isOnline ? 'Online' : 'Offline'}
            </span>
          </button>

          <button
            onClick={onTriggerRun}
            disabled={isRunningPipeline}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow transition-all ${
              isRunningPipeline
                ? 'bg-amber-600 text-white cursor-wait'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 active:scale-95 shadow-cyan-400/30'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
            {isRunningPipeline ? 'COMPUTING RIFT2 + MAGSAC++...' : 'RUN PIPELINE'}
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <nav className="relative z-10 w-full border-t border-slate-800/80 bg-slate-900/60">
        <div className="max-w-7xl w-full mx-auto flex items-center px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 flex justify-center items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold uppercase">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <BackendConnectionModal
        isOpen={isConnModalOpen}
        onClose={() => setIsConnModalOpen(false)}
        connectionInfo={connectionInfo}
        onRefreshConnection={refreshConn}
      />
    </header>
  );
};

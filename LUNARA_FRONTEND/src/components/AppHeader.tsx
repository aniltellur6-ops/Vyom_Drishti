import React from 'react';
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
} from 'lucide-react';

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
  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Executive Overview', icon: <Orbit className="w-4 h-4" /> },
    { id: 'preprocessing', label: 'Preprocessing Phase 1', icon: <Settings className="w-4 h-4" /> },
    { id: 'workspace', label: 'Registration Pipeline', icon: <Layers className="w-4 h-4" />, badge: 'LIVE' },
    { id: 'comparison', label: 'Method Matrix', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'experiments', label: 'Experiment Ledger', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-[#0f172a] text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      {/* Top Telemetry & Status Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-semibold tracking-wider">CUDA 12.2 / TENSORRT 8.6</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">VRAM: 680MB / 24576MB</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">ISRO SAC / CH-2 OHRC ↔ LROC NAC</span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">TARGET:</span>
            <span className="text-amber-300 font-semibold">Shackleton Rim (89.9°S, 0.0°E)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">RMSE:</span>
            <span className="text-emerald-400 font-bold">0.36 px</span>
            <span className="text-slate-500">(Threshold: &lt;1.0 px)</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-slate-400">STATUS:</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              SUB-PIXEL VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Main Title & Nav Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Mission Badge */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('overview')}>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1.5 shadow-md shadow-cyan-900/30">
            <img src="/logo.png" alt="Vyom Drishti Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                VYOM DRISHTI
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 rounded">
                  v2.4.1-rc
                </span>
              </h1>
              <span className="hidden sm:inline text-xs text-slate-400 font-normal">
                Autonomous Lunar Correspondence Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span className="text-slate-300 font-medium">Team Vyom Drishti</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">ISRO SAC</span>
            </div>
          </div>
        </div>

        {/* Global Action CTA Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerRun}
            disabled={isRunningPipeline}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold shadow transition-all ${
              isRunningPipeline
                ? 'bg-amber-600 text-white cursor-wait'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
            {isRunningPipeline ? 'COMPUTING RIFT2 + MAGSAC++...' : 'RUN PIPELINE'}
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <nav className="flex items-center w-full border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex justify-center items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
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
      </nav>
    </header>
  );
};

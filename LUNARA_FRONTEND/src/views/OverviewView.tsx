import React, { useState, useEffect } from 'react';
import { NavigationTab } from '../types';
import { LUNARA_ASSETS } from '../data/sampleData';
import { LunaraClient, SystemStatus, Experiment } from '../api/client';
import {
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge,
  Compass,
  FileText,
  Sun,
  Moon,
  Crosshair,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onTriggerRun: () => void;
  isRunningPipeline: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onTriggerRun,
  isRunningPipeline,
}) => {
  const [solarViewMode, setSolarViewMode] = useState<'low' | 'opposing'>('low');
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentExperiments, setRecentExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    LunaraClient.getSystemStatus()
      .then(setSystemStatus)
      .catch(e => console.error("Failed to load status", e));
      
    LunaraClient.getExperiments()
      .then(setRecentExperiments)
      .catch(e => console.error("Failed to load experiments", e));
  }, []);

  const totalExperiments = recentExperiments.length;
  const successfulExperiments = recentExperiments.filter(e => e.status === 'Successful').length;
  const avgRmse = successfulExperiments > 0 
    ? (recentExperiments.reduce((acc, curr) => acc + (curr.metrics?.rmse || 0), 0) / successfulExperiments).toFixed(2)
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 lg:p-8 text-slate-900 shadow-sm">
        <div className="relative z-10 max-w-4xl space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 font-sans">
            Autonomous Sub-Pixel Lunar Surface Image Registration &amp; Optical Correspondence Engine
          </h2>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
            Robust image matching and geometric registration for multi-mission lunar imagery. 
            Powered by Deep Learning Feature Matching and Epipolar Geometry.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('workspace')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              <span>+ New Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('comparison')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              <span>Compare Methods</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid & Glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-40 pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      
      {/* Dynamic Backend Status and Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-700"/> SYSTEM STATUS</h3>
            {systemStatus ? (
                <div className="space-y-2 text-sm font-mono text-slate-600">
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-700"/> API Online</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-700"/> {systemStatus.extractor} Ready</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-700"/> {systemStatus.matcher} Ready</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-700"/> GPU {systemStatus.gpu_available ? "Available" : "Unavailable"}</div>
                </div>
            ) : (
                <div className="text-slate-500 text-sm font-mono animate-pulse">Connecting to backend...</div>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-400"/> EXPERIMENT AGGREGATES</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{totalExperiments}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">TOTAL RUNS</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">{successfulExperiments}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">SUCCESSFUL</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-700">{avgRmse}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">AVG RMSE (px)</div>
                </div>
            </div>
          </div>
      </div>
      
      {/* Recent Experiments List */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
         <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-700"/> RECENT EXPERIMENTS</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-normal">ID</th>
                  <th className="pb-2 font-normal">Method</th>
                  <th className="pb-2 font-normal">Inliers</th>
                  <th className="pb-2 font-normal">RMSE</th>
                  <th className="pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentExperiments.slice(0, 5).map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-semibold text-cyan-800">{exp.name}</td>
                        <td className="py-3 text-slate-600">{exp.method}</td>
                        <td className="py-3">{exp.metrics?.inliers || '-'}</td>
                        <td className="py-3">{exp.metrics?.rmse?.toFixed(2) || '-'} px</td>
                        <td className="py-3">
                            {exp.status === 'Successful' ? (
                                <span className="text-emerald-700 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Successful</span>
                            ) : (
                                <span className="text-rose-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Failed</span>
                            )}
                        </td>
                    </tr>
                ))}
                {recentExperiments.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-slate-500">No recent experiments found. Run a registration in the workspace.</td></tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

    </div>
  );
};

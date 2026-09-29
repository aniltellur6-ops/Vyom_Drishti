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
  const [recentExperiments, setRecentExperiments] = useState<Experiment[]>(() => LunaraClient.getCachedExperiments());

  useEffect(() => {
    const refreshAll = () => {
      LunaraClient.getSystemStatus()
        .then(setSystemStatus)
        .catch(e => console.warn("System status standby:", e));
        
      LunaraClient.getExperiments()
        .then(setRecentExperiments)
        .catch(e => console.warn("Experiments update standby:", e));
    };

    refreshAll();
    window.addEventListener('lunara_experiment_added', refreshAll);
    window.addEventListener('lunara_connection_changed', refreshAll);
    window.addEventListener('lunara_simulation_changed', refreshAll);
    return () => {
      window.removeEventListener('lunara_experiment_added', refreshAll);
      window.removeEventListener('lunara_connection_changed', refreshAll);
      window.removeEventListener('lunara_simulation_changed', refreshAll);
    };
  }, []);

  const totalExperiments = recentExperiments.length;
  const successfulList = recentExperiments.filter(e => e.status === 'Successful');
  const successfulExperiments = successfulList.length;
  const avgRmse = successfulExperiments > 0 
    ? (successfulList.reduce((acc, curr) => acc + (curr.metrics?.rmse || 0), 0) / successfulExperiments).toFixed(2)
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              <span>+ New Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('experiments')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-950 font-semibold text-sm border border-cyan-300 shadow-sm transition-all active:scale-95"
            >
              <span>View Experiment Ledger</span>
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
                    <div className="flex items-center gap-2">
                      {systemStatus.status === 'Ready' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600"/>
                          <span className="text-emerald-800 font-semibold">API Online (Ready)</span>
                        </>
                      ) : systemStatus.status === 'Simulation Ready' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-amber-500"/>
                          <span className="text-amber-700 font-semibold">Demo Mode (Simulation Active)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-500"/>
                          <span className="text-rose-700 font-semibold">API Offline (Standby Cache)</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600"/> {systemStatus.extractor} Feature Extractor
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600"/> {systemStatus.matcher} Transformer Matcher
                    </div>
                    <div className="flex items-center gap-2">
                      {systemStatus.gpu_available ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600"/>
                          <span>GPU Acceleration (CUDA Active)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-cyan-700"/>
                          <span>CPU Pipeline (PyTorch Multithreaded)</span>
                        </>
                      )}
                    </div>
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
                  <th className="pb-2 font-normal text-right">Action</th>
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
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              const restoredMatch = {
                                job_id: exp.id,
                                status: exp.status === 'Successful' ? 'success' : 'error',
                                method_used: exp.method,
                                metrics: {
                                  inliers: exp.metrics?.inliers ?? 0,
                                  inlier_ratio: exp.metrics?.inlier_ratio ?? 0,
                                  rmse: exp.metrics?.rmse ?? 0,
                                  coverage: exp.metrics?.coverage ?? 0,
                                  runtime: exp.metrics?.runtime ?? 0,
                                  transformation: exp.metrics?.transformation || [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
                                },
                                files: {
                                  registered_image: exp.files?.registered_image || '',
                                  overlay_image: exp.files?.overlay_image || '',
                                  matches_viz: exp.files?.matches_viz || '',
                                  raw_reference: exp.files?.raw_reference || '',
                                  raw_moving: exp.files?.raw_moving || '',
                                  preprocessed_reference: exp.files?.preprocessed_reference || '',
                                  preprocessed_moving: exp.files?.preprocessed_moving || ''
                                }
                              };
                              localStorage.setItem('lunara_last_match_result', JSON.stringify(restoredMatch));
                              window.dispatchEvent(new CustomEvent('lunara_restore_match', { detail: restoredMatch }));
                              onNavigate('workspace');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer font-sans"
                            title="Inspect this previous record in Registration Workspace"
                          >
                            <Layers className="w-3.5 h-3.5 text-cyan-700" />
                            <span>Workspace</span>
                          </button>
                        </td>
                    </tr>
                ))}
                {recentExperiments.length === 0 && (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-500">No recent experiments found. Run a registration in the workspace.</td></tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

    </div>
  );
};

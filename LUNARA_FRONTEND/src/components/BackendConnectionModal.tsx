import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  X,
  Play,
  Zap,
  Globe
} from 'lucide-react';
import { LunaraClient, ConnectionDetails } from '../api/client';

interface BackendConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionInfo: ConnectionDetails | null;
  onRefreshConnection: () => Promise<void>;
}

export const BackendConnectionModal: React.FC<BackendConnectionModalProps> = ({
  isOpen,
  onClose,
  connectionInfo,
  onRefreshConnection
}) => {
  const [customUrl, setCustomUrl] = useState(() => LunaraClient.getCustomBackendUrl() || '');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [simulationMode, setSimulationMode] = useState(() => LunaraClient.isSimulationMode());

  useEffect(() => {
    if (isOpen) {
      setCustomUrl(LunaraClient.getCustomBackendUrl() || '');
      setSimulationMode(LunaraClient.isSimulationMode());
      setTestResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSaveCustomUrl = async () => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      await handleResetToAuto();
      return;
    }

    if (trimmed.startsWith('python') || trimmed.includes('.py')) {
      setTestResult({
        ok: false,
        message: 'Notice: "python start_pipeline.py" is a command to run in your computer\'s terminal, not a web URL. Click "Reset to Auto-Discovery" to connect to the active tunnel.'
      });
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setTestResult({
        ok: false,
        message: 'Please enter a valid URL starting with http:// or https:// (e.g. http://127.0.0.1:8000).'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      LunaraClient.setCustomBackendUrl(trimmed);
      await onRefreshConnection();
      const updated = await LunaraClient.checkConnection();
      if (updated.isOnline) {
        setTestResult({ ok: true, message: `Successfully connected to ${updated.url} (${updated.latencyMs}ms ping)` });
      } else {
        setTestResult({ ok: false, message: `Could not reach ${trimmed}. Make sure the server is running.` });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToAuto = async () => {
    setCustomUrl('');
    LunaraClient.setCustomBackendUrl(null);
    setIsTesting(true);
    setTestResult(null);
    try {
      await onRefreshConnection();
      const updated = await LunaraClient.checkConnection();
      if (updated.isOnline) {
        setTestResult({ ok: true, message: `Auto-discovery connected: ${updated.url} (${updated.latencyMs}ms)` });
      } else {
        setTestResult({ ok: false, message: 'Auto-discovery ready. Start the backend with "python start_pipeline.py" or enable Demo Mode below.' });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleSimulation = (enabled: boolean) => {
    setSimulationMode(enabled);
    LunaraClient.setSimulationMode(enabled);
  };

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const isOnline = connectionInfo?.isOnline ?? false;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl max-w-lg w-full text-slate-100 overflow-hidden flex flex-col font-sans relative z-[1000000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50' : 'bg-amber-950 text-amber-400 border border-amber-700/50'}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Backend Service Manager
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Lunara AI Deep Learning & Co-Registration Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Alert Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isOnline 
              ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-200' 
              : 'bg-amber-950/40 border-amber-700/40 text-amber-200'
          }`}>
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm">
                {isOnline ? 'Python Service Connected & Ready' : 'Backend Service Not Detected'}
              </div>
              <div className="text-slate-300 font-mono text-[11px] break-all">
                {isOnline ? (
                  <>Connected to: <span className="text-cyan-300 font-bold">{connectionInfo?.url}</span> {connectionInfo?.latencyMs ? `(${connectionInfo.latencyMs}ms ping)` : ''}</>
                ) : (
                  <>The frontend is unable to reach the Python service on localhost (port 8000) or remote Cloudflare tunnel.</>
                )}
              </div>
            </div>
          </div>

          {/* Quick Start Command Box */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5 text-cyan-400">
                <Play className="w-3.5 h-3.5" /> 1-Click Launch Command
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Run in project root</span>
            </div>
            <div className="bg-slate-900 border border-slate-700/80 rounded-full px-3 py-2 flex items-center justify-between font-mono text-xs text-slate-200">
              <code>python start_pipeline.py</code>
              <button
                onClick={() => copyCommand('python start_pipeline.py')}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                title="Copy command"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copiedCmd ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              This starts the FastAPI backend, LightGlue model, and automatically links the Cloudflare tunnel with Vercel.
            </p>
          </div>

          {/* Custom Backend URL Override */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>CUSTOM BACKEND URL OVERRIDE</span>
              {customUrl && (
                <button 
                  onClick={handleResetToAuto}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Reset to Auto-Discovery
                </button>
              )}
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. http://127.0.0.1:8000 or https://xyz.trycloudflare.com" 
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSaveCustomUrl}
                disabled={isTesting}
                className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>Test &amp; Connect</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400">Presets:</span>
              <button
                type="button"
                onClick={() => setCustomUrl('http://127.0.0.1:8000')}
                className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                127.0.0.1:8000
              </button>
              <button
                type="button"
                onClick={() => setCustomUrl('http://localhost:8000')}
                className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                localhost:8000
              </button>
              {connectionInfo?.url && connectionInfo.url.includes('trycloudflare.com') && (
                <button
                  type="button"
                  onClick={() => setCustomUrl(connectionInfo.url)}
                  className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
                >
                  Active Cloudflare Tunnel
                </button>
              )}
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-full px-4 text-xs font-mono ${testResult.ok ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* Simulation Mode Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Offline Demo / Simulation Mode
              </div>
              <p className="text-[11px] text-slate-400">
                Allows testing and presentations even if the Python GPU service is offline.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={simulationMode} 
                onChange={(e) => handleToggleSimulation(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => onRefreshConnection()}
            disabled={isTesting}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Re-check Status</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

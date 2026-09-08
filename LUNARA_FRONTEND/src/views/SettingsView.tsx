import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Database,
  Sliders,
  CheckCircle2,
  HardDrive,
  Activity,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [useTensorRT, setUseTensorRT] = useState<boolean>(true);
  const [precisionMode, setPrecisionMode] = useState<string>('fp16');
  const [tpsLambda, setTpsLambda] = useState<number>(0.01);

  // Dynamic Telemetry State
  const [hardwareConcurrency, setHardwareConcurrency] = useState<number | string>('Loading...');
  const [deviceMemory, setDeviceMemory] = useState<number | string>('Loading...');
  const [userAgent, setUserAgent] = useState<string>('Loading...');
  const [screenResolution, setScreenResolution] = useState<string>('Loading...');
  const [platform, setPlatform] = useState<string>('Loading...');

  useEffect(() => {
    // Collect Browser & System Info
    setHardwareConcurrency(navigator.hardwareConcurrency || 'Unknown');
    // @ts-ignore
    setDeviceMemory(navigator.deviceMemory ? `${navigator.deviceMemory} GB+` : 'Unknown');
    setUserAgent(navigator.userAgent);
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
    setPlatform(navigator.platform || 'Unknown');
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Engine Configuration &amp; Hardware Telemetry
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-sans">
              Local environment diagnostics and execution streams
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* Hardware Diagnostics */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-bold text-blue-700 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Live Hardware Diagnostics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-[10px]">CPU CORES / CONCURRENCY</div>
            <div className="text-slate-900 font-bold text-sm mt-1">{hardwareConcurrency} Cores</div>
            <div className="text-slate-500 text-[10px] mt-0.5">navigator.hardwareConcurrency</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-[10px]">ESTIMATED DEVICE RAM</div>
            <div className="text-emerald-600 font-bold text-sm mt-1">{deviceMemory}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">navigator.deviceMemory</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-[10px]">DISPLAY RESOLUTION</div>
            <div className="text-cyan-700 font-bold text-sm mt-1">{screenResolution}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Primary Display Matrix</div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-[10px]">USER AGENT &amp; PLATFORM</div>
            <div className="text-slate-900 font-bold text-xs mt-1 break-all">{userAgent}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Platform: {platform}</div>
        </div>
      </div>

      {/* Runtime Hyperparameters & Configuration */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-bold text-blue-700 uppercase flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Pipeline Hyperparameters &amp; Concurrency
        </h3>

        <div className="space-y-4 text-slate-700">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div>
              <div className="font-bold text-slate-900">TensorRT Graph Optimization Engine</div>
              <div className="text-[11px] text-slate-600 font-sans">
                Accelerate LoFTR ResNet-FPN feature pyramid inference using FP16 Tensor Cores
              </div>
            </div>
            <input
              type="checkbox"
              checked={useTensorRT}
              onChange={(e) => setUseTensorRT(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div>
              <div className="font-bold text-slate-900">Execution Precision Format</div>
              <div className="text-[11px] text-slate-600 font-sans">
                Controls floating-point precision for Phase Congruency filter bank
              </div>
            </div>
            <select
              value={precisionMode}
              onChange={(e) => setPrecisionMode(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 px-3 py-1 rounded"
            >
              <option value="fp16">FP16 (Half Precision - Fastest)</option>
              <option value="fp32">FP32 (Single Precision - Maximum Accuracy)</option>
              <option value="bf16">BF16 (Brain Float)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 shadow-sm">
            <div>
              <div className="font-bold text-slate-900">Thin-Plate Spline (TPS) Bending Lambda: {tpsLambda}</div>
              <div className="text-[11px] text-slate-600 font-sans">
                Higher values prevent overfitting to localized high-frequency topographic disparity
              </div>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={tpsLambda}
              onChange={(e) => setTpsLambda(parseFloat(e.target.value))}
              className="w-36 accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

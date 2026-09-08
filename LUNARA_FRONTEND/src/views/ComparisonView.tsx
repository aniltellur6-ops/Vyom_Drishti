import React, { useState } from 'react';
import { SAMPLE_BENCHMARKS, LUNARA_ASSETS } from '../data/sampleData';
import { BenchmarkMethod } from '../types';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';

export const ComparisonView: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<BenchmarkMethod>(SAMPLE_BENCHMARKS[0]);

  const benchmarkVisuals: Record<string, { image: string; title: string; desc: string }> = {
    'Classical SIFT Baseline': {
      image: LUNARA_ASSETS.benchSift,
      title: 'SIFT Correspondence Failure Under Shadow Shift',
      desc: 'Gradient orientation angles rotate dramatically with shifting solar azimuth. Keypoints clump solely on sunny rim ridges (19.4% inliers).',
    },
    'RIFT2 (Phase Congruency)': {
      image: LUNARA_ASSETS.benchRift,
      title: 'RIFT2 Phase Congruency Extraction',
      desc: 'Phase congruency isolates frequency transition boundaries, achieving 75.6% inliers independent of solar illumination.',
    },
    'SuperPoint + SuperGlue': {
      image: LUNARA_ASSETS.benchSuperPoint,
      title: 'SuperPoint + SuperGlue GNN Matching',
      desc: 'Deep learned keypoint detector with attentional graph neural matching. Performs well in illuminated terrain, drops in shadowed craters.',
    },
    'LoFTR (Semi-Dense Transformer)': {
      image: LUNARA_ASSETS.benchLoFTR,
      title: 'LoFTR Semi-Dense Feature Matching',
      desc: 'Transformer cross-attention resolves correspondences even across low-contrast lunar mare surfaces without explicit detector steps.',
    },
    'VYOM DRISHTI Adaptive Orchestrator (Ours)': {
      image: LUNARA_ASSETS.splitA,
      title: 'VYOM DRISHTI Adaptive Frequency-Transformer Hybrid',
      desc: 'Combines phase congruency in high-shadow crater boundaries with transformer cross-attention in smooth regolith for optimal 0.36 px RMSE.',
    },
    'ORB Fast Tracker': {
      image: LUNARA_ASSETS.craterLowSun,
      title: 'ORB Fast Tracking Degradation',
      desc: 'Fast corner tests degrade when features lack clear high-frequency edges; fails threshold test.',
    },
  };

  const currentVisual = benchmarkVisuals[selectedMethod.name] || benchmarkVisuals['VYOM DRISHTI Adaptive Orchestrator (Ours)'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-700" />
            Multi-Method Quantitative Benchmark Matrix
          </h2>
          <p className="text-xs text-slate-600">
            Comparative evaluation across Deep Learning, Frequency Phase Congruency, and Classical Handcrafted Algorithms
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            Target RMSE &lt; 1.0 px: 4/6 PASSED
          </span>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4">Method / Architecture</th>
                <th className="py-3 px-4">Feature Descriptor</th>
                <th className="py-3 px-4 text-center">Inliers</th>
                <th className="py-3 px-4 text-center">Inlier Ratio</th>
                <th className="py-3 px-4 text-center">RMSE (Sub-Pixel)</th>
                <th className="py-3 px-4 text-center">Spatial Cov.</th>
                <th className="py-3 px-4 text-center">Latency</th>
                <th className="py-3 px-4 text-center">VRAM</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {SAMPLE_BENCHMARKS.map((m) => {
                const isSelected = selectedMethod.name === m.name;
                const isOptimal = m.statusType === 'success' && m.name.includes('VYOM DRISHTI');

                return (
                  <tr
                    key={m.name}
                    onClick={() => setSelectedMethod(m)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-50/60 text-slate-900'
                        : 'hover:bg-slate-100 text-slate-900'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold flex items-center gap-2">
                        {isOptimal && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        )}
                        <span className={isOptimal ? 'text-cyan-800 font-bold' : 'text-slate-900'}>
                          {m.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-700 font-normal">{m.citation}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-900">{m.featureType}</td>

                    <td className="py-3 px-4 text-center font-bold">{m.inliers} / {m.totalMatches}</td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold ${
                          m.inlierRatio > 70
                            ? 'text-emerald-700'
                            : m.inlierRatio > 50
                            ? 'text-amber-700'
                            : 'text-rose-400'
                        }`}
                      >
                        {m.inlierRatio.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          m.rmse < 0.5
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : m.rmse < 1.0
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            : m.rmse < 2.0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {m.rmse.toFixed(2)} px
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {m.spatialCoverage.toFixed(1)}%
                    </td>

                    <td className="py-3 px-4 text-center text-slate-900">{m.latencySeconds}s</td>

                    <td className="py-3 px-4 text-center text-slate-800">{m.vramUsageMB} MB</td>

                    <td className="py-3 px-4 text-right">
                      {m.statusType === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {m.status}
                        </span>
                      ) : m.statusType === 'marginal' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {m.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          {m.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Benchmark Detail & Visual Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visual Inspection Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-800 uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-700" />
              Empirical Visual Registration Proof: {selectedMethod.name}
            </span>
          </div>

          <div className="relative aspect-video bg-black overflow-hidden">
            <img
              src={currentVisual.image}
              alt={currentVisual.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <h4 className="text-sm font-bold text-white font-mono">{currentVisual.title}</h4>
              <p className="text-xs text-slate-200 mt-1 max-w-xl">{currentVisual.desc}</p>
            </div>
          </div>
        </div>

        {/* Metric Card Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 font-mono text-xs space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[10px] text-slate-600 uppercase">Architecture Analysis</span>
              <h3 className="font-bold text-cyan-700 text-sm">{selectedMethod.name}</h3>
              <p className="text-slate-700 text-[11px] mt-1 font-sans">{selectedMethod.description}</p>
            </div>

            <div className="space-y-2 text-slate-700">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Inlier Correspondence Rate:</span>
                  <span className="font-bold text-emerald-700">{selectedMethod.inlierRatio}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${selectedMethod.inlierRatio}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Spatial Dispersion Coverage:</span>
                  <span className="font-bold text-cyan-700">{selectedMethod.spatialCoverage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${selectedMethod.spatialCoverage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Residual RMSE (Target &lt; 1.0 px):</span>
                  <span className="font-bold text-amber-700">{selectedMethod.rmse} px</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (1.0 / selectedMethod.rmse) * 40)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Peak CUDA Allocation:</span>
              <span className="text-slate-900 font-bold">{selectedMethod.vramUsageMB} MB VRAM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

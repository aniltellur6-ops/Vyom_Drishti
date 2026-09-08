import React, { useState, useEffect } from 'react';
import { Experiment, LunaraClient } from '../api/client';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Search,
} from 'lucide-react';

export const ExperimentsView: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'accuracy'>('date');

  useEffect(() => {
    LunaraClient.getExperiments().then(data => {
        setExperiments(data);
        if (data.length > 0) setSelectedExp(data[0]);
    }).catch(console.error);
  }, []);

  const filteredExperiments = experiments.filter(
    (e) =>
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.method.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
      if (sortBy === 'accuracy') {
          // Sort by highest inlier ratio, then lowest RMSE
          if (b.metrics.inlier_ratio !== a.metrics.inlier_ratio) {
              return b.metrics.inlier_ratio - a.metrics.inlier_ratio;
          }
          return a.metrics.rmse - b.metrics.rmse;
      }
      // Sort by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const manifestJson = selectedExp ? {
    experiment_id: selectedExp.id,
    timestamp_utc: selectedExp.created_at,
    method: selectedExp.method,
    convergence_metrics: {
      inliers: selectedExp.metrics.inliers,
      inlier_ratio_percent: (selectedExp.metrics.inlier_ratio * 100).toFixed(2),
      rmse_pixels: selectedExp.metrics.rmse,
      spatial_coverage_percent: selectedExp.metrics.coverage,
      runtime: selectedExp.metrics.runtime
    },
    status: selectedExp.status
  } : null;

  const copyManifest = () => {
    if (manifestJson) {
        navigator.clipboard.writeText(JSON.stringify(manifestJson, null, 2));
        alert('Experiment JSON Manifest copied to clipboard!');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-700" />
            Experiment Tracking Ledger
          </h2>
          <p className="text-xs text-slate-600">
            Immutable run records and metric provenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Selector */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'date' | 'accuracy')}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-mono"
          >
            <option value="date">Sort: Date & Time</option>
            <option value="accuracy">Sort: Highest Accuracy</option>
          </select>

          {/* Search input */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Search className="w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-800 outline-none w-44 font-mono placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Ledger on Left, Manifest Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ledger Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-3">Run Name</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 text-center">Inliers</th>
                  <th className="py-3 px-3 text-center">RMSE</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExperiments.map((exp) => {
                  const isSelected = selectedExp?.id === exp.id;
                  return (
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExp(exp)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-50/60 text-slate-900'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-bold text-cyan-800">{exp.name}</span>
                        <div className="text-[10px] text-slate-600">{new Date(exp.created_at).toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{exp.method}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        {exp.metrics.inliers}
                        <div className="text-[10px] text-slate-600">({(exp.metrics.inlier_ratio * 100).toFixed(1)}%)</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold ${
                            exp.metrics.rmse < 1.0 ? 'text-emerald-700' : 'text-rose-400'
                          }`}
                        >
                          {exp.metrics.rmse.toFixed(2)} px
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.status === 'Successful'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredExperiments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">No experiments recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed Manifest Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedExp ? (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-700" />
                    MANIFEST: {selectedExp.name}.json
                </span>

                <div className="flex items-center gap-2">
                    <button
                    onClick={copyManifest}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 text-xs rounded border border-slate-200 font-mono shadow-sm"
                    title="Copy Manifest"
                    >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                    </button>
                </div>
                </div>

                <div className="p-3 bg-slate-50 font-mono text-[11px] text-slate-700 max-h-96 overflow-y-auto">
                <pre>{JSON.stringify(manifestJson, null, 2)}</pre>
                </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-mono text-sm">
                Select an experiment to view manifest
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

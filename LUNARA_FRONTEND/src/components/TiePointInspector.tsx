import React, { useState } from 'react';
import { TiePoint } from '../types';
import { CheckCircle2, XCircle, Filter, Download, ArrowUpDown } from 'lucide-react';

interface TiePointInspectorProps {
  tiePoints: TiePoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  onFilterChange?: (filter: 'all' | 'inliers' | 'outliers') => void;
}

export const TiePointInspector: React.FC<TiePointInspectorProps> = ({
  tiePoints,
  selectedPointId,
  onSelectPoint,
}) => {
  const [filter, setFilter] = useState<'all' | 'inliers' | 'outliers'>('all');
  const [sortBy, setSortBy] = useState<'residual' | 'confidence' | 'id'>('residual');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredPoints = tiePoints
    .filter((pt) => {
      if (filter === 'inliers') return pt.status === 'inlier';
      if (filter === 'outliers') return pt.status === 'outlier';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'residual') {
        return sortAsc ? a.residualError - b.residualError : b.residualError - a.residualError;
      }
      if (sortBy === 'confidence') {
        return sortAsc ? a.confidence - b.confidence : b.confidence - a.confidence;
      }
      return sortAsc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    });

  const exportCSV = () => {
    const headers = 'ID,Moving_X,Moving_Y,Ref_X,Ref_Y,Latitude,Longitude,Confidence,Residual_px,Status\n';
    const rows = tiePoints
      .map(
        (p) =>
          `${p.id},${p.movingX},${p.movingY},${p.refX},${p.refY},"${p.lat}","${p.lon}",${p.confidence},${p.residualError},${p.status}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LUNARA_GCP_TiePoints_Shackleton.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-800 uppercase">
            Optical Tie-Point Correspondences
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
            {tiePoints.length} GCPs
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[11px] font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${
                filter === 'all' ? 'bg-cyan-600 text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              All ({tiePoints.length})
            </button>
            <button
              onClick={() => setFilter('inliers')}
              className={`px-2 py-0.5 rounded ${
                filter === 'inliers'
                  ? 'bg-emerald-600 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              Inliers ({tiePoints.filter((p) => p.status === 'inlier').length})
            </button>
            <button
              onClick={() => setFilter('outliers')}
              className={`px-2 py-0.5 rounded ${
                filter === 'outliers'
                  ? 'bg-rose-600 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-rose-300'
              }`}
            >
              Outliers ({tiePoints.filter((p) => p.status === 'outlier').length})
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-700 border border-slate-700"
            title="Export CSV Tie-Points"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Residual Distribution Bar */}
      <div className="px-3 py-1.5 bg-white/90 border-b border-slate-200 text-[11px] font-mono flex items-center justify-between text-slate-700">
        <div>
          Sub-Pixel Target: <span className="text-emerald-700 font-semibold">&lt; 1.0 px</span> (Achieved:{' '}
          <span className="text-emerald-700 font-bold">0.36 px RMS</span>)
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Sort:</span>
          <button
            onClick={() => {
              if (sortBy === 'residual') setSortAsc(!sortAsc);
              else {
                setSortBy('residual');
                setSortAsc(true);
              }
            }}
            className={`flex items-center gap-1 hover:text-slate-900 ${
              sortBy === 'residual' ? 'text-cyan-700 font-bold' : ''
            }`}
          >
            Residual Error <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-800/80 font-mono text-xs">
        {filteredPoints.map((pt) => {
          const isSelected = pt.id === selectedPointId;
          const isInlier = pt.status === 'inlier';
          return (
            <div
              key={pt.id}
              onClick={() => onSelectPoint(pt.id)}
              className={`px-3 py-2 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-cyan-50/70 border-l-2 border-cyan-400 text-slate-900'
                  : 'hover:bg-slate-800/50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isInlier ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{pt.id}</span>
                    <span className="text-[10px] text-slate-600 font-normal">
                      ({pt.lat}, {pt.lon})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    OHRC: [{pt.movingX}, {pt.movingY}] ↔ LROC: [{pt.refX}, {pt.refY}]
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`font-bold ${
                    pt.residualError < 1.0 ? 'text-emerald-700' : 'text-rose-400'
                  }`}
                >
                  {pt.residualError.toFixed(2)} px
                </div>
                <div className="text-[10px] text-slate-600">
                  Conf: {(pt.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

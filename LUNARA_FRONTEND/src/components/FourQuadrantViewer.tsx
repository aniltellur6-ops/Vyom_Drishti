import React, { useState, useRef, useEffect } from 'react';
import { ViewportMode, TiePoint } from '../types';
import { LUNARA_ASSETS } from '../data/sampleData';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Crosshair,
  Eye,
  Columns,
  Grid2X2,
  Split,
  Layers,
} from 'lucide-react';

interface FourQuadrantViewerProps {
  mode: ViewportMode;
  onChangeMode: (mode: ViewportMode) => void;
  tiePoints: TiePoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  showTiePoints: boolean;
  onToggleTiePoints: () => void;
}

export const FourQuadrantViewer: React.FC<FourQuadrantViewerProps> = ({
  mode,
  onChangeMode,
  tiePoints,
  selectedPointId,
  onSelectPoint,
  showTiePoints,
  onToggleTiePoints,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [wipePercent, setWipePercent] = useState<number>(50);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [reticleActive, setReticleActive] = useState<boolean>(true);
  const [checkerboardFreq, setCheckerboardFreq] = useState<number>(8);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Derived normalized pixel coordinates for display
  const normX = mousePos ? Math.round((mousePos.x / (containerRef.current?.clientWidth || 1)) * 12000) : 4122;
  const normY = mousePos ? Math.round((mousePos.y / (containerRef.current?.clientHeight || 1)) * 24000) : 8910;

  return (
    <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-xl">
      {/* Top Toolbar */}
      <div className="px-3 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Viewport Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded border border-slate-200">
          <button
            onClick={() => onChangeMode('dual')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
              mode === 'dual'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            title="Dual Viewport (CH-2 OHRC vs LROC NAC)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual Synced</span>
          </button>

          <button
            onClick={() => onChangeMode('4quad')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
              mode === '4quad'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            title="4-Quadrant Verification (Moving, Warped, Ref, Diff)"
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span>4-Quadrant</span>
          </button>

          <button
            onClick={() => onChangeMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
              mode === 'split'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            title="Interactive Split Screen Swipe"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Swipe</span>
          </button>

          <button
            onClick={() => onChangeMode('checker')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
              mode === 'checker'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            title="Checkerboard Interleave Test"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Checkerboard</span>
          </button>
        </div>

        {/* Center: Live Reticle Coordinate Telemetry */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-700 bg-slate-50 px-3 py-1 rounded border border-slate-200">
          <div className="flex items-center gap-1">
            <span className="text-cyan-700">PIXEL:</span>
            <span>[{normX}, {normY}]</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-700">LAT/LON:</span>
            <span>89°32'44.1" S, 132°04'12.0" E</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-emerald-700">DN:</span>
            <span>184 (16-bit float)</span>
          </div>
        </div>

        {/* Right: Overlay & Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTiePoints}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono transition-all ${
              showTiePoints
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-slate-800 text-slate-600 border-slate-700'
            }`}
            title="Toggle Tie-Point Vector Overlays"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vectors ({tiePoints.filter((p) => p.status === 'inlier').length})</span>
          </button>

          <button
            onClick={() => setReticleActive(!reticleActive)}
            className={`p-1 rounded border ${
              reticleActive
                ? 'bg-cyan-50 text-cyan-800 border-cyan-700'
                : 'bg-slate-800 text-slate-600 border-slate-700'
            }`}
            title="Toggle Synchronized Crosshairs"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="p-1 hover:bg-slate-800 text-slate-700 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-700 font-semibold min-w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
              className="p-1 hover:bg-slate-800 text-slate-700 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 hover:bg-slate-800 text-slate-600 hover:text-slate-900 rounded"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[520px] bg-slate-50 select-none overflow-hidden cursor-crosshair"
      >
        {/* VIEW MODE 1: DUAL SYNCED VIEW */}
        {mode === 'dual' && (
          <div
            className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-white/50"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Left: Moving Image (CH-2 OHRC) */}
            <div className="relative rounded overflow-hidden bg-black border border-slate-200 group">
              <img
                src={LUNARA_ASSETS.viewportLeft}
                alt="CH-2 OHRC Moving"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-slate-50/80 backdrop-blur px-2 py-0.5 rounded border border-slate-700 text-[11px] font-mono text-cyan-800 font-semibold">
                CH-2 OHRC [MOVING] • GSD: 0.25m • Sun: 82.4°
              </div>

              {/* Inlier Tie-points rendered on Moving image */}
              {showTiePoints && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {tiePoints.map((pt, i) => {
                    const cx = (pt.movingX / 10000) * 100;
                    const cy = (pt.movingY / 20000) * 100;
                    const isSelected = pt.id === selectedPointId;
                    const isInlier = pt.status === 'inlier';
                    return (
                      <g key={pt.id} className="cursor-pointer pointer-events-auto" onClick={() => onSelectPoint(pt.id)}>
                        <circle
                          cx={`${cx}%`}
                          cy={`${cy}%`}
                          r={isSelected ? 6 : 4}
                          className={`${
                            isInlier
                              ? 'fill-cyan-400 stroke-cyan-200'
                              : 'fill-rose-500 stroke-rose-200'
                          } stroke-1 transition-all`}
                        />
                        <text
                          x={`${cx + 2}%`}
                          y={`${cy + 2}%`}
                          className="fill-cyan-200 text-[9px] font-mono font-bold"
                        >
                          #{i + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Right: Reference Image (LROC NAC) */}
            <div className="relative rounded overflow-hidden bg-black border border-slate-200 group">
              <img
                src={LUNARA_ASSETS.viewportRight}
                alt="LROC NAC Reference"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-slate-50/80 backdrop-blur px-2 py-0.5 rounded border border-slate-700 text-[11px] font-mono text-emerald-800 font-semibold">
                LROC NAC [REFERENCE] • GSD: 0.50m • Sun: 78.1°
              </div>

              {/* Reference point markers */}
              {showTiePoints && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {tiePoints.map((pt, i) => {
                    const cx = (pt.refX / 5000) * 100;
                    const cy = (pt.refY / 10000) * 100;
                    const isSelected = pt.id === selectedPointId;
                    const isInlier = pt.status === 'inlier';
                    return (
                      <g key={pt.id} className="cursor-pointer pointer-events-auto" onClick={() => onSelectPoint(pt.id)}>
                        <polygon
                          points={`${cx},${cy - 4} ${cx + 4},${cy + 4} ${cx - 4},${cy + 4}`}
                          className={`${
                            isInlier ? 'fill-emerald-400' : 'fill-rose-500'
                          } stroke-emerald-100 stroke-1`}
                        />
                        <text
                          x={`${cx + 2}%`}
                          y={`${cy + 2}%`}
                          className="fill-emerald-200 text-[9px] font-mono font-bold"
                        >
                          #{i + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: 4-QUADRANT VIEW */}
        {mode === '4quad' && (
          <div
            className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-white/60"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Q1: Moving */}
            <div className="relative bg-black rounded overflow-hidden border border-slate-200">
              <img src={LUNARA_ASSETS.q1Moving} alt="Q1 Moving" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 left-2 bg-slate-50/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-800 border border-slate-200">
                [Q1] INPUT MOVING (OHRC)
              </div>
            </div>

            {/* Q2: Warped */}
            <div className="relative bg-black rounded overflow-hidden border border-slate-200">
              <img src={LUNARA_ASSETS.q2Warped} alt="Q2 Warped" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 left-2 bg-slate-50/80 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-300 border border-slate-200">
                [Q2] TPS NON-RIGID WARP
              </div>
            </div>

            {/* Q3: Reference */}
            <div className="relative bg-black rounded overflow-hidden border border-slate-200">
              <img src={LUNARA_ASSETS.q3Ref} alt="Q3 Ref" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 left-2 bg-slate-50/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-800 border border-slate-200">
                [Q3] GEODETIC REF (LROC)
              </div>
            </div>

            {/* Q4: Checkerboard Co-registered */}
            <div className="relative bg-black rounded overflow-hidden border border-slate-200">
              <img src={LUNARA_ASSETS.q4Checker} alt="Q4 Checker" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 left-2 bg-slate-50/80 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 border border-slate-200">
                [Q4] CHECKER OVERLAY (CO-REG)
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: SPLIT SWIPE / WIPE */}
        {mode === 'split' && (
          <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Background Image: Reference */}
            <img
              src={LUNARA_ASSETS.splitB}
              alt="Reference"
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 right-3 bg-slate-50/80 backdrop-blur px-2.5 py-1 rounded text-xs font-mono text-emerald-800 border border-emerald-200">
              LROC NAC REFERENCE (BASE)
            </div>

            {/* Foreground Image: Warped moving clipped with wipe percent */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${wipePercent}%` }}
            >
              <img
                src={LUNARA_ASSETS.splitA}
                alt="Warped Moving"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: containerRef.current?.clientWidth || '100%', height: '100%' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-slate-50/80 backdrop-blur px-2.5 py-1 rounded text-xs font-mono text-cyan-800 border border-cyan-200">
                WARPED CH-2 OHRC (REGISTERED)
              </div>
            </div>

            {/* Draggable Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 cursor-ew-resize z-20"
              style={{ left: `${wipePercent}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 text-[10px] font-bold">
                ⬌
              </div>
            </div>

            {/* Interactive Slider Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={wipePercent}
              onChange={(e) => setWipePercent(Number(e.target.value))}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-2 z-30 opacity-70 hover:opacity-100 cursor-pointer accent-cyan-400 wipe-slider"
            />
          </div>
        )}

        {/* VIEW MODE 4: CHECKERBOARD INTERLEAVE */}
        {mode === 'checker' && (
          <div className="relative w-full h-full overflow-hidden bg-black">
            <img
              src={LUNARA_ASSETS.q4Checker}
              alt="Checkerboard alignment"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 bg-slate-50/85 backdrop-blur px-3 py-1.5 rounded border border-slate-700 text-xs font-mono">
              <span className="text-cyan-700 font-bold">CHECKERBOARD MATRIX:</span>{' '}
              <span className="text-slate-800">Tiles alternate between OHRC & LROC NAC</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-slate-50/85 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-2 text-xs font-mono text-slate-700">
              <span>Grid Frequency:</span>
              <button
                onClick={() => setCheckerboardFreq((f) => Math.max(4, f - 2))}
                className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-900"
              >
                -
              </button>
              <span className="font-bold text-cyan-700">{checkerboardFreq}x{checkerboardFreq}</span>
              <button
                onClick={() => setCheckerboardFreq((f) => Math.min(16, f + 2))}
                className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-900"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Reticle Crosshairs Layer */}
        {reticleActive && mousePos && (
          <>
            <div
              className="crosshair-reticle"
              style={{
                left: mousePos.x,
                top: 0,
                bottom: 0,
                width: 1,
              }}
            />
            <div
              className="crosshair-reticle"
              style={{
                top: mousePos.y,
                left: 0,
                right: 0,
                height: 1,
              }}
            />
            {/* Coordinate readout bubble near cursor */}
            <div
              className="absolute pointer-events-none bg-slate-50/90 text-[10px] font-mono text-cyan-800 px-1.5 py-0.5 rounded border border-cyan-200 shadow-md z-30"
              style={{
                left: Math.min(mousePos.x + 12, (containerRef.current?.clientWidth || 500) - 100),
                top: Math.min(mousePos.y + 12, (containerRef.current?.clientHeight || 500) - 30),
              }}
            >
              {normX}, {normY}
            </div>
          </>
        )}
      </div>

      {/* Bottom Status & Quality Banner */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-700">
          <div>
            <span className="text-slate-600">Total Matches:</span>{' '}
            <span className="text-cyan-800 font-bold">544</span>
          </div>
          <div>
            <span className="text-slate-600">Inliers (MAGSAC++):</span>{' '}
            <span className="text-emerald-700 font-bold">425</span>
          </div>
          <div>
            <span className="text-slate-600">Inlier Ratio:</span>{' '}
            <span className="text-emerald-700 font-bold">78.1%</span>
          </div>
          <div>
            <span className="text-slate-600">Mean Residual:</span>{' '}
            <span className="text-emerald-700 font-bold">0.36 px</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span>Transformation:</span>
          <span className="text-indigo-300 font-semibold">Non-Rigid TPS (λ=0.01)</span>
        </div>
      </div>
    </div>
  );
};

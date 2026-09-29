import React, { useState, useEffect } from 'react';
import { TiePoint } from '../types';
import { Play, UploadCloud, FileImage, Settings, Target, Layers } from 'lucide-react';
import { ImageCondition, MatchingResult, LunaraClient } from '../api/client';
import { NgrokImage } from '../components/NgrokImage';

interface WorkspaceViewProps {
  tiePoints: TiePoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  showTiePoints: boolean;
  onToggleTiePoints: () => void;
  isRunningPipeline: boolean;
  onTriggerRun: () => void;
  refFile: File | null;
  srcFile: File | null;
  setRefFile: (f: File | null) => void;
  setSrcFile: (f: File | null) => void;
  analysisResult: ImageCondition | null;
  matchResult: MatchingResult | null;
  selectedMethod: string;
  setSelectedMethod: (m: string) => void;
  selectedPreprocessing: string;
  setSelectedPreprocessing: (m: string) => void;
  selectedReferenceSensor: string;
  setSelectedReferenceSensor: (m: string) => void;
  selectedMovingSensor: string;
  setSelectedMovingSensor: (m: string) => void;
  onResetWorkspace?: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  isRunningPipeline,
  onTriggerRun,
  refFile,
  srcFile,
  setRefFile,
  setSrcFile,
  analysisResult,
  matchResult,
  selectedMethod,
  setSelectedMethod,
  selectedPreprocessing,
  setSelectedPreprocessing,
  selectedReferenceSensor,
  setSelectedReferenceSensor,
  selectedMovingSensor,
  setSelectedMovingSensor,
  onResetWorkspace
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">NEW REGISTRATION</h1>
        <p className="text-slate-600 mt-1">Compare two lunar images and estimate their geometric correspondence.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Input Configuration Column */}
        <div className="xl:col-span-4 space-y-4 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><FileImage className="w-4 h-4 text-cyan-700" /> IMAGES</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">REFERENCE IMAGE (BASE)</label>
                <div className="border-2 border-dashed border-cyan-400/90 bg-cyan-50/70 hover:bg-cyan-100/70 rounded-md p-4 text-center transition-colors cursor-pointer relative shadow-xs">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setRefFile)} />
                  {refFile ? (
                    <span className="text-emerald-700 font-mono text-sm font-semibold">{refFile.name}</span>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-cyan-800">
                      <UploadCloud className="w-6 h-6 text-cyan-700" />
                      <span className="text-sm font-semibold text-cyan-950">Upload Reference</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">MOVING IMAGE (TARGET)</label>
                <div className="border-2 border-dashed border-cyan-400/90 bg-cyan-50/70 hover:bg-cyan-100/70 rounded-md p-4 text-center transition-colors cursor-pointer relative shadow-xs">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setSrcFile)} />
                  {srcFile ? (
                    <span className="text-cyan-800 font-mono text-sm font-semibold">{srcFile.name}</span>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-cyan-800">
                      <UploadCloud className="w-6 h-6 text-cyan-700" />
                      <span className="text-sm font-semibold text-cyan-950">Upload Moving</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-700" /> SENSORS</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">REFERENCE SENSOR</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={selectedReferenceSensor}
                  onChange={(e) => setSelectedReferenceSensor(e.target.value)}
                >
                  <option value="AUTO">Automatic (Detect)</option>
                  <option value="LROC">LRO LROC (NAC)</option>
                  <option value="SELENE">SELENE / Kaguya TC</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">MOVING SENSOR</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={selectedMovingSensor}
                  onChange={(e) => setSelectedMovingSensor(e.target.value)}
                >
                  <option value="AUTO">Automatic (Detect)</option>
                  <option value="OHRC">Chandrayaan-2 OHRC</option>
                  <option value="TMC-2">Chandrayaan-2 TMC-2</option>
                  <option value="IIRS">Chandrayaan-2 IIRS</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-700" /> METHOD & PREPROCESSING</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">MATCHING METHOD</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                >
                  <option value="auto">Automatic Recommendation</option>
                  <option value="lightglue">SuperPoint + LightGlue</option>
                  <option value="sift">SIFT</option>
                  <option value="loftr">LoFTR</option>
                  <option value="rift2">RIFT2 (Phase Congruency)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">PREPROCESSING</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={selectedPreprocessing}
                  onChange={(e) => setSelectedPreprocessing(e.target.value)}
                >
                  <option value="AUTO">Automatic Recommendation (Recommended)</option>
                  <option value="P0_RAW">P0 - Raw (No Preprocessing)</option>
                  <option value="P1_ROBUST_NORMALIZED">P1 - Robust Normalized</option>
                  <option value="P2_ILLUMINATION_CORRECTED">P2 - Illumination Corrected</option>
                  <option value="P3_GRADIENT">P3 - Gradient Magnitude</option>
                  <option value="P4_HYBRID">P4 - HYBRID (NORM + GRADIENT + ILLU + CLAHE)</option>
                  <option value="P5_CLAHE">P5 - CLAHE Enhanced</option>
                  <option value="P6_ILLUMINATION_CLAHE">P6 - Illumination + CLAHE</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={onTriggerRun}
            disabled={isRunningPipeline || !refFile || !srcFile}
            className={`w-full py-4 font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg relative overflow-hidden ${
              isRunningPipeline 
                ? 'bg-amber-500 text-slate-950 border border-amber-200/80 shadow-[0_0_18px_rgba(245,158,11,0.45)] cursor-not-allowed' 
                : 'bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-300 disabled:text-slate-500 text-slate-950 shadow-cyan-500/25'
            }`}
          >
            {isRunningPipeline ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent w-[200%] animate-shimmer"></div>
                <Layers className="w-5 h-5 animate-spin-slow relative z-10 text-indigo-400" />
                <span className="animate-pulse tracking-widest relative z-10 font-mono">ANALYZING GEOMETRY...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                RUN REGISTRATION
              </>
            )}
          </button>
        </div>

        {/* Output Column */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Analysis View (if run has started and returned analysis) */}
          {analysisResult && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 animate-in fade-in shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  EMPIRICAL CONDITION ANALYSIS
                </h2>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  analysisResult.overall_difficulty === 'EASY' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : analysisResult.overall_difficulty === 'MEDIUM' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  DIFFICULTY: {analysisResult.overall_difficulty}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Illumination Offset</div>
                  <div className="text-amber-700 font-bold text-sm mt-0.5">
                    {analysisResult.illumination_difference} {analysisResult.illumination_delta ? `(Δ ${analysisResult.illumination_delta} DN)` : ''}
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Shadow Coverage</div>
                  <div className="text-slate-800 font-bold text-sm mt-0.5">
                    {analysisResult.shadow_coverage}%
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Surface Texture</div>
                  <div className="text-slate-800 font-bold text-sm mt-0.5">
                    {analysisResult.texture} {analysisResult.texture_variance ? `(Var ${analysisResult.texture_variance})` : ''}
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Scale Discrepancy</div>
                  <div className="text-slate-800 font-bold text-sm mt-0.5">
                    {analysisResult.resolution_difference}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-cyan-50/80 p-3 rounded border border-cyan-200">
                  <div className="text-cyan-800 font-bold text-xs mb-1">
                    RECOMMENDED MATCHING METHOD:
                  </div>
                  <div className="text-cyan-900 font-bold text-sm mb-1">
                    {analysisResult.recommended_method}
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    {analysisResult.reason.split('Preprocessing:')[0]}
                  </div>
                </div>

                <div className="bg-amber-50/80 p-3 rounded border border-amber-200">
                  <div className="text-amber-900 font-bold text-xs mb-1">
                    RECOMMENDED PREPROCESSING:
                  </div>
                  <div className="text-amber-900 font-bold text-sm mb-1">
                    {analysisResult.recommended_preprocessing_name || analysisResult.recommended_preprocessing || 'P6 - Illumination + CLAHE'}
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    {analysisResult.preprocessing_reason || (analysisResult.reason.includes('Preprocessing:') ? analysisResult.reason.split('Preprocessing:')[1] : 'Equalizes steep solar incidence shadows and optimizes crater rim keypoint repeatability.')}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Results View */}
          {matchResult ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-xs font-mono text-slate-800 uppercase tracking-wider">
                    CO-REGISTRATION RECORD ({matchResult.job_id.slice(0, 10)})
                  </span>
                </div>
                {onResetWorkspace && (
                  <button
                    onClick={onResetWorkspace}
                    className="px-4 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 rounded-full text-xs font-mono border border-cyan-200 font-medium transition-colors shadow-xs"
                  >
                    + New Run / Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-slate-500 text-xs mb-1">INLIERS</span>
                  <span className="text-2xl font-bold text-cyan-700">{matchResult.metrics.inliers}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-slate-500 text-xs mb-1">INLIER RATIO</span>
                  <span className="text-2xl font-bold text-emerald-700">{(matchResult.metrics.inlier_ratio * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-slate-500 text-xs mb-1">RMSE</span>
                  <span className="text-2xl font-bold text-indigo-600">{matchResult.metrics.rmse.toFixed(2)} px</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-slate-500 text-xs mb-1">COVERAGE</span>
                  <span className="text-2xl font-bold text-amber-700">{matchResult.metrics.coverage.toFixed(1)}%</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-xs mb-1">METHOD</span>
                  <span className="text-lg font-bold text-cyan-700">{matchResult.status === "error" ? "FAILED" : (matchResult.method_used === "lightglue" ? "LIGHTGLUE" : matchResult.method_used || analysisResult?.recommended_method || 'AUTO').toUpperCase()}</span>
                </div>
              </div>
              
              {matchResult.preprocessing_metadata && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-mono text-xs">
                  <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>APPLIED PREPROCESSING: {matchResult.preprocessing_metadata.preprocessing?.representation || selectedPreprocessing}</span>
                    <span className="text-[11px] font-normal text-slate-500">{matchResult.preprocessing_metadata.preprocessing?.method}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold text-cyan-800 mb-1">MOVING IMAGE STATISTICS</div>
                      <div className="text-slate-600">Mean: {matchResult.preprocessing_metadata.moving_statistics?.mean?.toFixed(2)} DN | Std: {matchResult.preprocessing_metadata.moving_statistics?.std?.toFixed(2)}</div>
                      <div className="text-slate-600">Dark Shadow Fraction: {(matchResult.preprocessing_metadata.moving_statistics?.dark_fraction * 100)?.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="font-semibold text-cyan-800 mb-1">REFERENCE IMAGE STATISTICS</div>
                      <div className="text-slate-600">Mean: {matchResult.preprocessing_metadata.reference_statistics?.mean?.toFixed(2)} DN | Std: {matchResult.preprocessing_metadata.reference_statistics?.std?.toFixed(2)}</div>
                      <div className="text-slate-600">Dark Shadow Fraction: {(matchResult.preprocessing_metadata.reference_statistics?.dark_fraction * 100)?.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preprocessed Image Pair (Input to Co-Registration Pipeline) */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-700" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      PREPROCESSED IMAGES (INPUT TO CO-REGISTRATION PIPELINE)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold">
                    USED FOR KEYPOINT MATCHING
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Invariant feature extraction (SuperPoint / LoFTR) and RANSAC homography estimation are executed directly on these preprocessed images to normalize solar shadow gradients and maximize sub-pixel correspondence accuracy.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-cyan-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
                    <div className="bg-cyan-100/70 px-3 py-2 border-b border-cyan-200 text-xs font-mono font-bold text-cyan-950 flex justify-between items-center">
                      <span>PREPROCESSED REFERENCE IMAGE</span>
                      <span className="text-[10px] text-cyan-700 font-semibold">Reference Tile</span>
                    </div>
                    <div className="bg-cyan-50/70 border border-cyan-200/90 rounded flex-1 flex items-center justify-center min-h-[280px] p-2">
                      <NgrokImage
                        src={LunaraClient.getResultUrl(matchResult.files.preprocessed_reference)}
                        alt="Preprocessed Reference"
                        className="max-h-[460px] max-w-full object-contain rounded"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-cyan-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
                    <div className="bg-cyan-100/70 px-3 py-2 border-b border-cyan-200 text-xs font-mono font-bold text-cyan-950 flex justify-between items-center">
                      <span>PREPROCESSED MOVING IMAGE</span>
                      <span className="text-[10px] text-amber-800 font-semibold">Moving Tile</span>
                    </div>
                    <div className="bg-cyan-50/70 border border-cyan-200/90 rounded flex-1 flex items-center justify-center min-h-[280px] p-2">
                      <NgrokImage
                        src={LunaraClient.getResultUrl(matchResult.files.preprocessed_moving)}
                        alt="Preprocessed Moving"
                        className="max-h-[460px] max-w-full object-contain rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visual Before/After Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-cyan-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
                  <div className="bg-cyan-100/70 px-3 py-2 border-b border-cyan-200 text-xs font-mono font-bold text-cyan-950 flex justify-between items-center">
                    <span>ORIGINAL RAW MOVING IMAGE (PRE-ALIGNMENT)</span>
                  </div>
                  <div className="bg-cyan-50/70 border border-cyan-200/90 rounded flex-1 flex items-center justify-center relative min-h-[300px] p-2">
                    {srcFile ? (
                      <img src={URL.createObjectURL(srcFile)} alt="Original Moving" className="max-h-[500px] max-w-full object-contain" />
                    ) : matchResult.files?.preprocessed_moving ? (
                      <NgrokImage 
                        src={LunaraClient.getResultUrl(matchResult.files.preprocessed_moving)} 
                        alt="Original Moving" 
                        className="max-h-[500px] max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-cyan-800 font-mono">Original moving image cached from session</span>
                    )}
                  </div>
                </div>
                
                <div className="bg-white border border-cyan-200/80 rounded-lg overflow-hidden flex flex-col shadow-xs">
                  <div className="bg-cyan-100/70 px-3 py-2 border-b border-cyan-200 text-xs font-mono font-bold text-cyan-950 flex justify-between items-center">
                    <span>WARPED REGISTERED MOVING IMAGE</span>
                    <span className="text-emerald-700 font-bold">RMSE: {matchResult.metrics.rmse.toFixed(2)} px</span>
                  </div>
                  <div className="bg-cyan-50/70 border border-cyan-200/90 rounded flex-1 flex items-center justify-center relative min-h-[300px] p-2">
                    <NgrokImage 
                      src={LunaraClient.getResultUrl(matchResult.files.registered_image)} 
                      alt="Registered" 
                      className="max-h-[500px] max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                 <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-700" /> CO-REGISTRATION RESULT & OVERLAYS</h2>
                  <div className="flex flex-col gap-4">
                    <div className="aspect-video bg-cyan-50/70 rounded-lg border border-cyan-200/90 overflow-hidden relative">
                      <NgrokImage src={LunaraClient.getResultUrl(matchResult.files.overlay_image)} alt="Overlay" className="w-full h-full object-contain" />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-mono text-cyan-950 border border-cyan-200 font-bold shadow-sm">OVERLAY (50/50 BLEND)</div>
                    </div>
                    
                    <div className="aspect-video bg-cyan-50/70 rounded-lg border border-cyan-200/90 overflow-hidden relative">
                      <NgrokImage src={LunaraClient.getResultUrl(matchResult.files.matches_viz)} alt="Matches" className="w-full h-full object-contain" />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-mono text-emerald-950 border border-cyan-200 font-bold shadow-sm">INLIER CORRESPONDENCES ({matchResult.metrics.inliers} Inliers)</div>
                    </div>
                  </div>
              </div>

            </div>
          ) : (
            <div className={`h-full min-h-[420px] border-2 border-dashed ${
              isRunningPipeline 
                ? 'border-cyan-400 bg-cyan-50/90' 
                : 'border-cyan-300 bg-gradient-to-br from-cyan-50/90 via-cyan-100/50 to-sky-50/80'
            } rounded-xl flex items-center justify-center font-mono text-sm relative overflow-hidden transition-all duration-500 shadow-xs`}>
              {isRunningPipeline ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent scanline-active pointer-events-none"></div>
                  <div className="absolute inset-0 pulse-ring-effect rounded-full border-2 border-cyan-500/30 m-auto w-32 h-32 pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="relative animate-float">
                      <Target className="w-16 h-16 text-cyan-600 animate-spin-slow opacity-80" />
                      <Layers className="w-6 h-6 text-cyan-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-cyan-800 animate-pulse tracking-[0.2em] text-lg font-bold shadow-cyan-500/50 drop-shadow-md">COMPUTING CORRESPONDENCES</span>
                      <span className="text-cyan-900/80 text-xs mt-2 max-w-xs uppercase">Running RANSAC spatial validation and Homography estimation matrix</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-cyan-950 flex flex-col items-center gap-3.5 p-6 text-center max-w-md">
                  <div className="p-4 bg-cyan-100 border border-cyan-300 rounded-2xl shadow-xs">
                    <Layers className="w-10 h-10 text-cyan-700" />
                  </div>
                  <span className="tracking-widest font-bold text-cyan-950 text-base">AWAITING REGISTRATION REQUEST</span>
                  <span className="text-xs text-cyan-800 leading-relaxed font-sans">
                    Select reference and moving lunar imagery from the control panel, configure method &amp; sensors, then click RUN REGISTRATION.
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

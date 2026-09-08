import React from 'react';
import { TiePoint } from '../types';
import { Play, UploadCloud, FileImage, Settings, Target, Layers } from 'lucide-react';
import { ImageCondition, MatchingResult, LunaraClient } from '../api/client';

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
  setSelectedMethod
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
                <div className="border-2 border-dashed border-slate-700 rounded-md p-4 text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setRefFile)} />
                  {refFile ? (
                    <span className="text-emerald-700 font-mono text-sm">{refFile.name}</span>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <UploadCloud className="w-6 h-6" />
                      <span className="text-sm font-semibold">Upload Reference</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">MOVING IMAGE (TARGET)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-md p-4 text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setSrcFile)} />
                  {srcFile ? (
                    <span className="text-cyan-700 font-mono text-sm">{srcFile.name}</span>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <UploadCloud className="w-6 h-6" />
                      <span className="text-sm font-semibold">Upload Moving</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-700" /> METHOD & PREPROCESSING</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">MATCHING METHOD</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-700 rounded p-2 text-sm text-slate-800"
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
                <select className="w-full bg-slate-50 border border-slate-700 rounded p-2 text-sm text-slate-800">
                  <option>Automatic</option>
                  <option>Raw</option>
                  <option>Lunar Robust (CLAHE)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={onTriggerRun}
            disabled={isRunningPipeline || !refFile || !srcFile}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
          >
            {isRunningPipeline ? (
              <span className="animate-pulse">PROCESSING...</span>
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
            <div className="bg-white border border-slate-200 rounded-lg p-5 animate-in fade-in">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-amber-700" /> CONDITION ANALYSIS</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-sm">
                <div>
                  <div className="text-slate-500 text-xs">Illumination</div>
                  <div className="text-amber-700 font-bold">{analysisResult.illumination_difference}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Texture</div>
                  <div className="text-slate-800 font-bold">{analysisResult.texture}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Resolution Diff</div>
                  <div className="text-slate-800 font-bold">{analysisResult.resolution_difference}</div>
                </div>
                <div className="col-span-2 md:col-span-3 mt-2 bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="text-cyan-700 text-xs mb-1 font-bold">RECOMMENDED METHOD: {analysisResult.recommended_method}</div>
                  <div className="text-slate-600 text-xs">{analysisResult.reason}</div>
                </div>
              </div>
            </div>
          )}

          {/* Results View */}
          {matchResult ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-slate-500 text-xs mb-1">INLIERS</span>
                  <span className="text-2xl font-bold text-cyan-700">{matchResult.metrics.inliers}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-slate-500 text-xs mb-1">INLIER RATIO</span>
                  <span className="text-2xl font-bold text-emerald-700">{(matchResult.metrics.inlier_ratio * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-slate-500 text-xs mb-1">RMSE</span>
                  <span className="text-2xl font-bold text-indigo-400">{matchResult.metrics.rmse.toFixed(2)} px</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-slate-500 text-xs mb-1">COVERAGE</span>
                  <span className="text-2xl font-bold text-amber-700">{matchResult.metrics.coverage.toFixed(1)}%</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-slate-500 text-xs mb-1">METHOD</span>
                  <span className="text-2xl font-bold text-cyan-700">{matchResult.status === "error" ? "FAILED" : (matchResult.method_used || analysisResult?.recommended_method || 'AUTO').toUpperCase()}</span>
                </div>
              </div>
              
              {/* Visual Before/After Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700">ORIGINAL MOVING IMAGE</div>
                  <div className="bg-black flex-1 flex items-center justify-center relative min-h-[300px]">
                    {srcFile && <img src={URL.createObjectURL(srcFile)} alt="Original" className="max-h-[500px] max-w-full object-contain" />}
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700">REGISTERED IMAGE (AFTER {(matchResult.method_used || analysisResult?.recommended_method || 'AUTO').toUpperCase()})</div>
                  <div className="bg-black flex-1 flex items-center justify-center relative min-h-[300px]">
                    <img 
                      src={LunaraClient.getResultUrl(matchResult.files.registered_image)} 
                      alt="Registered" 
                      className="max-h-[500px] max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-lg">
                 <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-700" /> REGISTRATION RESULT</h2>
                 <div className="flex flex-col gap-4">
                    <div className="aspect-video bg-black rounded-lg border border-slate-200 overflow-hidden relative">
                      <img src={LunaraClient.getResultUrl(matchResult.files.overlay_image)} alt="Overlay" className="w-full h-full object-contain" />
                      <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-mono text-cyan-700 border border-slate-700">OVERLAY (50/50 BLEND)</div>
                    </div>
                    
                    <div className="aspect-video bg-black rounded-lg border border-slate-200 overflow-hidden relative">
                      <img src={LunaraClient.getResultUrl(matchResult.files.matches_viz)} alt="Matches" className="w-full h-full object-contain" />
                      <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-mono text-emerald-700 border border-slate-700">INLIER CORRESPONDENCES</div>
                    </div>
                 </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-mono text-sm">
              {isRunningPipeline ? "PIPELINE RUNNING..." : "AWAITING REGISTRATION REQUEST"}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Upload, Settings, RefreshCw, Layers } from 'lucide-react';

interface PreprocessingViewProps {
  onTriggerRun?: () => void;
}

export const PreprocessingView: React.FC<PreprocessingViewProps> = ({ onTriggerRun }) => {
  const [refImg, setRefImg] = useState<File | null>(null);
  const [srcImg, setSrcImg] = useState<File | null>(null);
  
  const [resizeScale, setResizeScale] = useState<number>(1.0);
  const [percentileNorm, setPercentileNorm] = useState<boolean>(true);
  const [clahe, setClahe] = useState<boolean>(false);
  const [denoise, setDenoise] = useState<boolean>(false);

  const [previewRef, setPreviewRef] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePreview = async () => {
    if (!refImg && !srcImg) return;
    setIsProcessing(true);
    try {
      const formRef = new FormData();
      if (refImg) {
        formRef.append('image', refImg);
        formRef.append('resize_scale', resizeScale.toString());
        formRef.append('percentile_norm', percentileNorm.toString());
        formRef.append('clahe', clahe.toString());
        formRef.append('denoise', denoise.toString());
        
        const res = await fetch('http://localhost:8000/api/v1/preprocess/preview', {
          method: 'POST',
          body: formRef
        });
        const blob = await res.blob();
        setPreviewRef(URL.createObjectURL(blob));
      }

      const formSrc = new FormData();
      if (srcImg) {
        formSrc.append('image', srcImg);
        formSrc.append('resize_scale', resizeScale.toString());
        formSrc.append('percentile_norm', percentileNorm.toString());
        formSrc.append('clahe', clahe.toString());
        formSrc.append('denoise', denoise.toString());

        const res2 = await fetch('http://localhost:8000/api/v1/preprocess/preview', {
          method: 'POST',
          body: formSrc
        });
        const blob2 = await res2.blob();
        setPreviewSrc(URL.createObjectURL(blob2));
      }
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full min-h-[80vh]">
      {/* Controls Sidebar */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 flex flex-col h-full text-slate-900 shadow-sm overflow-y-auto">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-blue-600" /> PREPROCESSING PHASE 1
          </h2>
          <p className="text-xs text-slate-500">Configure geometry-preserving enhancements before matching.</p>
        </div>

        <div className="space-y-5 flex-1">
          {/* Uploads */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 border-b border-slate-100 pb-1">IMAGE INPUTS</h3>
            <div className="text-xs">
              <label className="block text-slate-600 font-medium mb-1">Reference Image (A)</label>
              <input type="file" onChange={e => setRefImg(e.target.files?.[0] || null)} className="w-full bg-slate-50 text-slate-700 p-2 rounded border border-slate-200" />
            </div>
            <div className="text-xs">
              <label className="block text-slate-600 font-medium mb-1">Source Image (B)</label>
              <input type="file" onChange={e => setSrcImg(e.target.files?.[0] || null)} className="w-full bg-slate-50 text-slate-700 p-2 rounded border border-slate-200" />
            </div>
          </div>

          {/* Configs */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 border-b border-slate-100 pb-1">PIPELINE SETTINGS</h3>
            
            <label className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
              <span className="text-slate-700">Percentile Normalization (1st-99th)</span>
              <input type="checkbox" checked={percentileNorm} onChange={e => setPercentileNorm(e.target.checked)} className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500" />
            </label>

            <label className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
              <span className="text-slate-700">CLAHE (Adaptive Equalization)</span>
              <input type="checkbox" checked={clahe} onChange={e => setClahe(e.target.checked)} className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500" />
            </label>

            <label className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
              <span className="text-slate-700">Light Denoising (Gaussian)</span>
              <input type="checkbox" checked={denoise} onChange={e => setDenoise(e.target.checked)} className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500" />
            </label>
            
            <div className="p-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-slate-700">Resolution Alignment Scale</label>
                <span className="text-xs font-mono text-blue-600">{resizeScale.toFixed(2)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="2.0" step="0.1" 
                value={resizeScale} onChange={e => setResizeScale(parseFloat(e.target.value))} 
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">Scale images to align spatial resolution before extraction.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handlePreview}
          disabled={isProcessing || (!refImg && !srcImg)}
          className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
          {isProcessing ? 'PROCESSING...' : 'PREVIEW PIPELINE'}
        </button>
      </div>

      {/* Main View Area */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[60vh]">
        <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col shadow-sm">
           <div className="text-xs font-mono text-slate-500 mb-2 px-2 py-1 bg-slate-50 rounded flex justify-between border border-slate-100">
              <span>REFERENCE PREVIEW</span>
              {previewRef && <span className="text-blue-600 font-bold">PROCESSED</span>}
           </div>
           <div className="flex-1 bg-slate-50 rounded flex items-center justify-center overflow-hidden border border-slate-200">
             {previewRef ? (
               <img src={previewRef} alt="Reference Preview" className="w-full h-full object-contain" />
             ) : refImg ? (
               <img src={URL.createObjectURL(refImg)} alt="Reference Raw" className="w-full h-full object-contain opacity-50 grayscale" />
             ) : (
               <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                 <Upload className="w-6 h-6 opacity-50" />
                 <span>Awaiting Input</span>
               </div>
             )}
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col shadow-sm">
           <div className="text-xs font-mono text-slate-500 mb-2 px-2 py-1 bg-slate-50 rounded flex justify-between border border-slate-100">
              <span>SOURCE PREVIEW</span>
              {previewSrc && <span className="text-blue-600 font-bold">PROCESSED</span>}
           </div>
           <div className="flex-1 bg-slate-50 rounded flex items-center justify-center overflow-hidden border border-slate-200">
             {previewSrc ? (
               <img src={previewSrc} alt="Source Preview" className="w-full h-full object-contain" />
             ) : srcImg ? (
               <img src={URL.createObjectURL(srcImg)} alt="Source Raw" className="w-full h-full object-contain opacity-50 grayscale" />
             ) : (
               <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                 <Upload className="w-6 h-6 opacity-50" />
                 <span>Awaiting Input</span>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

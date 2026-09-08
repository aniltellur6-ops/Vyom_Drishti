import React from 'react';
import { Check, Loader2, Play } from 'lucide-react';

export interface PipelineStage {
  step: number;
  name: string;
  subhead: string;
  status: 'pending' | 'running' | 'completed';
  duration: string;
  metric: string;
}

interface PipelineStepperProps {
  stages: PipelineStage[];
  activeStageIndex: number;
  onSelectStage: (index: number) => void;
  isRunning: boolean;
  onRunStep?: (index: number) => void;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  stages,
  activeStageIndex,
  onSelectStage,
  isRunning,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-700 uppercase">
            REGISTRATION PIPELINE EXECUTION
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-600">
            5/5 STAGES READY
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-600">
          Total Wall Clock: <span className="text-cyan-800 font-semibold">3.84s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        {stages.map((stg, idx) => {
          const isCurrent = activeStageIndex === idx;
          const isDone = stg.status === 'completed';
          const isExecuting = stg.status === 'running' && isRunning;

          return (
            <div
              key={stg.step}
              onClick={() => onSelectStage(idx)}
              className={`p-2.5 rounded-md border cursor-pointer transition-all relative overflow-hidden ${
                isCurrent
                  ? 'bg-cyan-50/50 border-cyan-500 shadow-sm shadow-cyan-950'
                  : 'bg-slate-50/60 border-slate-200/90 hover:border-slate-700 hover:bg-white'
              }`}
            >
              {isExecuting && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-active" />
              )}

              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-700">
                  STAGE 0{stg.step}
                </span>

                {isExecuting ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                ) : isDone ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-600 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-emerald-700" />
                  </div>
                ) : (
                  <Play className="w-3 h-3 text-slate-500" />
                )}
              </div>

              <div className="text-xs font-semibold text-slate-100 truncate">{stg.name}</div>
              <div className="text-[10px] text-slate-600 font-mono truncate">{stg.subhead}</div>

              <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-cyan-700 font-medium">{stg.metric}</span>
                <span className="text-slate-600">{stg.duration}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

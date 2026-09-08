import React, { useState } from 'react';
import { NavigationTab, TiePoint } from './types';
import { SAMPLE_TIE_POINTS } from './data/sampleData';
import { AppHeader } from './components/AppHeader';
import { OverviewView } from './views/OverviewView';
import { PreprocessingView } from './views/PreprocessingView';
import { WorkspaceView } from './views/WorkspaceView';
import { ComparisonView } from './views/ComparisonView';
import { ExperimentsView } from './views/ExperimentsView';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { LunaraClient, MatchingResult, ImageCondition } from './api/client';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [tiePoints, setTiePoints] = useState<TiePoint[]>(SAMPLE_TIE_POINTS);
  const [selectedPointId, setSelectedPointId] = useState<string | null>('PT_001');
  const [showTiePoints, setShowTiePoints] = useState<boolean>(true);
  
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [refFile, setRefFile] = useState<File | null>(null);
  const [srcFile, setSrcFile] = useState<File | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('auto');
  
  const [analysisResult, setAnalysisResult] = useState<ImageCondition | null>(null);
  const [matchResult, setMatchResult] = useState<MatchingResult | null>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToastMessage({msg, type});
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleTriggerRun = async () => {
    if (isRunningPipeline) return;
    if (!refFile || !srcFile) {
        showToast("Please select both reference and moving images.", "error");
        return;
    }
    
    setIsRunningPipeline(true);
    setMatchResult(null);
    setAnalysisResult(null);

    try {
      showToast('Analyzing image conditions...', 'success');
      const condition = await LunaraClient.analyzeImages(refFile, srcFile);
      setAnalysisResult(condition);
      
      showToast(`Method selected: ${condition.recommended_method}. Running matching...`, 'success');
      
      const methodToRun = selectedMethod === 'auto' ? condition.recommended_method : selectedMethod;
      const result = await LunaraClient.runMatching(refFile, srcFile, methodToRun);
      setMatchResult(result);
      
      showToast(`Co-Registration Complete: RMSE = ${result.metrics.rmse.toFixed(2)} px.`, 'success');
      
      if (currentTab === 'overview') {
        setCurrentTab('workspace');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Pipeline failed: ${err.message}`, 'error');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const handleExportReport = () => {
    setCurrentTab('reports');
    showToast('Navigated to Report Export Center.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <AppHeader
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isRunningPipeline={isRunningPipeline}
        onTriggerRun={handleTriggerRun}
        onExportReport={handleExportReport}
      />

      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6">
        {currentTab === 'overview' && (
          <OverviewView
            onNavigate={(tab) => setCurrentTab(tab)}
            onTriggerRun={handleTriggerRun}
            isRunningPipeline={isRunningPipeline}
          />
        )}

        {currentTab === 'preprocessing' && (
          <PreprocessingView onTriggerRun={handleTriggerRun} />
        )}

        {currentTab === 'workspace' && (
          <WorkspaceView
            tiePoints={tiePoints}
            selectedPointId={selectedPointId}
            onSelectPoint={(id) => setSelectedPointId(id)}
            showTiePoints={showTiePoints}
            onToggleTiePoints={() => setShowTiePoints(!showTiePoints)}
            isRunningPipeline={isRunningPipeline}
            onTriggerRun={handleTriggerRun}
            refFile={refFile}
            srcFile={srcFile}
            setRefFile={setRefFile}
            setSrcFile={setSrcFile}
            analysisResult={analysisResult}
            matchResult={matchResult}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
          />
        )}

        {currentTab === 'comparison' && <ComparisonView />}
        {currentTab === 'experiments' && <ExperimentsView />}
      </main>

      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-2xl font-mono text-xs animate-bounce ${toastMessage.type === 'error' ? 'bg-rose-950 text-rose-100 border-rose-500 shadow-rose-950' : 'bg-white/95 text-slate-100 border-cyan-500 shadow-cyan-950'}`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      <footer className="border-t border-slate-200/80 bg-slate-50 text-slate-600 text-xs py-3 px-4 sm:px-6">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-800 font-bold">VYOM DRISHTI v2.0</span>
            <span className="text-slate-600">•</span>
            <span>Team Vyom Drishti</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            {matchResult ? (
              <span className="text-emerald-700 font-semibold">RMSE: {matchResult.metrics.rmse.toFixed(2)} px</span>
            ) : (
              <span>Ready</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

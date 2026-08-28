import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, CheckCircle2, FileJson, Image as ImageIcon, Check, Loader2, ArrowRight, AlertCircle, Anchor } from 'lucide-react';
import { startSurveyProcessing } from '../services/api';

type ProcessState = 'upload' | 'processing' | 'complete';

const glass = 'bg-white/[0.02] backdrop-blur-3xl border border-white/10 border-t-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]';
const inputClass = 'w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F4EFE6] placeholder-[#8B9BB4]/50 focus:outline-none focus:border-[#1E6AFF]/60 focus:bg-white/[0.06] transition-all duration-200 backdrop-blur-xl';

export default function UploadProcess() {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<ProcessState>('upload');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [metadata, setMetadata] = useState({
    surveyName: '', vessel: '', area: '', surveyDate: '', depthRange: '', baselineRef: ''
  });

  const hasFiles = selectedFiles.length > 0;

  const steps = [
    'Ingest Survey',
    'Register Coordinates',
    'Compare Baseline',
    'Detect Anomalies',
    'Prepare Review Queue'
  ];

  useEffect(() => {
    if (appState !== 'processing') return;
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 5 + 1;
      if (p >= 100) {
        p = 100;
        setAppState('complete');
        clearInterval(interval);
      }
      setProgress(p);
      setCurrentStep(Math.floor((p / 100) * steps.length));
    }, 200);
    startSurveyProcessing('surv_003');
    return () => clearInterval(interval);
  }, [appState]);

  const handleStartAnalysis = () => {
    if (!hasFiles) { setShowErrorToast(true); setTimeout(() => setShowErrorToast(false), 3000); return; }
    setAppState('processing');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    setShowErrorToast(false);
    const jsonFile = files.find(f => f.name.endsWith('.json'));
    if (jsonFile) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const d = JSON.parse(ev.target?.result as string);
          setMetadata(prev => ({
            ...prev,
            surveyName: d.surveyName || d.name || prev.surveyName,
            vessel: d.vessel || d.platform || prev.vessel,
            area: d.area || d.location || prev.area,
            surveyDate: d.surveyDate || d.date || prev.surveyDate,
            depthRange: d.depthRange || d.depth || prev.depthRange,
            baselineRef: d.baselineRef || d.baseline || prev.baselineRef,
          }));
        } catch {}
      };
      reader.readAsText(jsonFile);
    }
  };

  const formatSize = (b: number) => {
    if (b === 0) return '0 B';
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
  };

  const getIcon = (name: string) => {
    if (name.endsWith('.json')) return <FileJson className="w-5 h-5 text-[#60A5FA] shrink-0" />;
    if (name.match(/\.(png|jpg|jpeg)$/i)) return <ImageIcon className="w-5 h-5 text-[#B993FF] shrink-0" />;
    return <File className="w-5 h-5 text-[#8B9BB4] shrink-0" />;
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-2 relative">

      {/* Error Toast */}
      {showErrorToast && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className="bg-[#E05763]/10 border border-[#E05763]/30 text-[#E05763] px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Please upload a survey file first.</span>
          </div>
        </div>
      )}

      {appState === 'upload' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Anchor className="w-4 h-4 text-[#60A5FA] opacity-70" />
              <span className="text-[10px] text-[#8B9BB4] font-mono uppercase tracking-[0.15em]">S.A.G.A.R. Command — Data Ingestion</span>
            </div>
            <h2 className="text-2xl font-bold text-[#F4EFE6] tracking-tight">Upload New Survey</h2>
            <p className="text-[#8B9BB4] text-sm mt-1">Import sonar data and metadata for baseline comparison and anomaly detection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left: Drop zone + metadata */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={onFileChange} accept=".sl2,.xtf,.png,.jpg,.jpeg,.json" />

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer ${glass} rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-white/[0.05] hover:border-[#1E6AFF]/40 group`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${hasFiles ? 'bg-[#1E6AFF]/15 border border-[#1E6AFF]/30' : 'bg-white/[0.04] border border-white/10 group-hover:bg-[#1E6AFF]/10 group-hover:border-[#1E6AFF]/30'}`}>
                  {hasFiles ? <CheckCircle2 className="w-8 h-8 text-[#1E6AFF]" /> : <UploadCloud className="w-8 h-8 text-[#8B9BB4] group-hover:text-[#1E6AFF] transition-colors" />}
                </div>
                <h3 className="text-[#F4EFE6] text-base font-semibold mb-1">{hasFiles ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected` : 'Drag and drop survey files'}</h3>
                <p className="text-sm text-[#8B9BB4] mb-6 max-w-sm">Upload raw sonar logs (.sl2, .xtf, .png) and associated metadata (.json) for baseline comparison.</p>
                <div className={`text-sm px-6 py-2.5 rounded-xl font-semibold pointer-events-none transition-all border ${hasFiles ? 'bg-white/[0.04] border-white/10 text-[#8B9BB4]' : 'bg-[#1E6AFF]/10 border-[#1E6AFF]/30 text-[#1E6AFF] group-hover:bg-[#1E6AFF]/20'}`}>
                  {hasFiles ? 'Add More Files' : 'Browse Files'}
                </div>
              </div>

              {/* Metadata form */}
              <div className={`${glass} rounded-2xl p-6`}>
                <h3 className="font-semibold text-[#F4EFE6] mb-5 flex items-center gap-2.5 text-xs uppercase tracking-[0.12em]">
                  <FileJson className="w-4 h-4 text-[#8B9BB4]" /> Survey Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'surveyName',  label: 'Survey Name',       placeholder: 'e.g. Mumbai Harbor Q4', type: 'text' },
                    { key: 'vessel',      label: 'Vessel / Platform',  placeholder: 'e.g. R/V Samudra Shakti', type: 'text' },
                    { key: 'area',        label: 'Area / Sector',      placeholder: 'e.g. Sector 7A', type: 'text' },
                    { key: 'surveyDate',  label: 'Survey Date',        placeholder: '', type: 'date' },
                    { key: 'depthRange',  label: 'Depth Range',        placeholder: 'e.g. 15–45m', type: 'text' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-[#8B9BB4] uppercase tracking-[0.1em]">{label}</label>
                      <input
                        type={type}
                        value={(metadata as any)[key]}
                        onChange={e => setMetadata(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-[#8B9BB4] uppercase tracking-[0.1em]">Baseline Reference</label>
                    <select
                      value={metadata.baselineRef}
                      onChange={e => setMetadata(p => ({ ...p, baselineRef: e.target.value }))}
                      className={`${inputClass} cursor-pointer appearance-none`}
                    >
                      <option value="" disabled>Select baseline…</option>
                      <option value="Coastal Baseline 2025">Coastal Baseline 2025</option>
                      <option value="Harbor Survey 2024">Harbor Survey 2024</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: File list + CTA */}
            <div className="flex flex-col gap-5">
              <div className={`${glass} rounded-2xl p-5 flex-1 flex flex-col`}>
                <h3 className="font-semibold text-[#F4EFE6] mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.12em]">
                  <UploadCloud className="w-4 h-4 text-[#8B9BB4]" /> Queued Files
                </h3>
                {hasFiles ? (
                  <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
                    {selectedFiles.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-3 flex items-start gap-3 hover:bg-white/[0.05] transition-colors">
                        {getIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#F4EFE6] truncate">{file.name}</p>
                          <p className="text-[11px] text-[#8B9BB4] mt-0.5 font-mono">{formatSize(file.size)}</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#45A796] shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-[#8B9BB4] text-sm bg-white/[0.01] rounded-xl border border-dashed border-white/[0.07] p-6 text-center">
                    <UploadCloud className="w-8 h-8 mb-3 opacity-30" />
                    <p className="max-w-[160px] text-[#8B9BB4]/70">No files queued yet.</p>
                  </div>
                )}
              </div>

              {hasFiles && (
                <div className="bg-[#1E6AFF]/[0.06] border border-[#1E6AFF]/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-5 h-5 text-[#1E6AFF] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#F4EFE6] leading-relaxed">Metadata verified. Ready for baseline comparison and anomaly detection.</p>
                </div>
              )}

              <button
                onClick={handleStartAnalysis}
                className={`w-full font-semibold px-4 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  hasFiles
                    ? 'bg-[#1E6AFF]/90 hover:bg-[#1E6AFF] text-[#F4EFE6] border border-[#1E6AFF]/60 shadow-[0_4px_20px_rgba(30,106,255,0.2)]'
                    : 'bg-white/[0.03] text-[#8B9BB4]/40 cursor-not-allowed border border-white/[0.05]'
                }`}
              >
                Start Analysis <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(appState === 'processing' || appState === 'complete') && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto w-full">
          <div className={`w-full ${glass} rounded-2xl overflow-hidden`}>

            {/* Scanner header */}
            <div className="h-48 bg-gradient-to-br from-[#0A192F] to-[#000000] relative overflow-hidden border-b border-white/[0.07] flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(69,167,150,0.3) 3px, rgba(69,167,150,0.3) 4px)',
                backgroundSize: '100% 4px'
              }} />
              {/* Scanning line */}
              {appState === 'processing' && (
                <div className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-[#45A796]/25 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
              )}
              {appState === 'complete' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#45A796]/5 backdrop-blur-sm animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-[#45A796]/20 border border-[#45A796]/30 flex items-center justify-center mb-2 shadow-lg animate-in zoom-in">
                    <Check className="w-8 h-8 text-[#45A796]" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[10px] font-mono text-[#8B9BB4]">
                <div className={`w-1.5 h-1.5 rounded-full ${appState === 'processing' ? 'bg-[#E5B869] animate-pulse' : 'bg-[#45A796]'}`} />
                {appState === 'processing' ? 'Sonar scan active…' : 'Scan complete'}
              </div>
              <div className="absolute top-3 right-4 text-[10px] font-mono text-[#8B9BB4] uppercase tracking-wider">450 kHz · CHIRP</div>
            </div>

            <div className="p-8">
              {appState === 'processing' ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#F4EFE6] flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-[#1E6AFF] animate-spin" />
                      Processing Survey…
                    </h3>
                    <span className="text-[#1E6AFF] font-mono text-lg font-bold">{Math.round(progress)}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-8 border border-white/[0.05]">
                    <div className="h-full bg-gradient-to-r from-[#1E6AFF]/70 to-[#1E6AFF] transition-all duration-300 ease-out rounded-full" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, idx) => {
                      const done = currentStep > idx;
                      const active = currentStep === idx;
                      return (
                        <div key={idx} className={`flex items-center gap-3 transition-all duration-300 ${active ? 'text-[#F4EFE6]' : done ? 'text-[#8B9BB4]' : 'text-white/20'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border flex-shrink-0 transition-all ${
                            done ? 'bg-[#45A796]/15 border-[#45A796]/30 text-[#45A796]' :
                            active ? 'bg-[#1E6AFF]/15 border-[#1E6AFF]/50 text-[#1E6AFF]' :
                            'bg-transparent border-white/10 text-white/20'
                          }`}>
                            {done ? <Check className="w-3 h-3" /> : idx + 1}
                          </div>
                          <span className={active ? 'font-semibold' : ''}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-300">
                  <h3 className="text-2xl font-bold text-[#F4EFE6] mb-2">Analysis Complete</h3>
                  <p className="text-[#8B9BB4] mb-8 max-w-sm">
                    The model has processed the survey against the baseline.{' '}
                    <strong className="text-[#F4EFE6]">7 unknown anomalies</strong> require human review.
                  </p>
                  <button
                    onClick={() => navigate('/map')}
                    className="w-full bg-[#1E6AFF]/90 hover:bg-[#1E6AFF] text-[#F4EFE6] font-bold px-6 py-4 rounded-xl transition-all text-base border border-[#1E6AFF]/60 shadow-[0_4px_20px_rgba(30,106,255,0.2)]"
                  >
                    Open Anomaly Map
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { transform: translateX(-400%); } 100% { transform: translateX(400%); } }
      `}</style>
    </div>
  );
}

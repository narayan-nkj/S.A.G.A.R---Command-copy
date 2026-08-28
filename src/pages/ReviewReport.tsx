import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAnomalies, submitReview, getReportSummary, getModelFeedback } from '../services/api';
import { Anomaly, ReportSummary, ModelFeedback, HARBOURS } from '../data/mockData';
import { useMapStyle } from '../data/mapStyle';
import { Map, Marker } from '../components/RawMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import StatusBadge from '../components/ui/StatusBadge';
import { FileCheck, FileText, Download, Share2, AlertCircle, Save, CheckCircle2, Navigation, Clock, MessageSquare, Zap, Check } from 'lucide-react';
import { useHarbour } from '../contexts/AppContext';
import { usePreferences } from '../contexts/PreferencesContext';

type Tab = 'review' | 'report';

export default function ReviewReport() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeHarbour } = useHarbour();
  const mapStyle = useMapStyle();
  const { formatCoordinates } = usePreferences();
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [feedbackData, setFeedbackData] = useState<ModelFeedback | null>(null);

  useEffect(() => {
    getAnomalies({}, activeHarbour).then(data => {
      setAnomalies(data);
      if (data.length > 0) setSelectedId(data.find(a => a.reviewStatus === 'pending')?.id || data[0].id);
    });
    getReportSummary('surv_001').then(setReportData);
    getModelFeedback().then(setFeedbackData);
  }, [activeHarbour]);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDecision = async (decision: 'confirmed_unknown' | 'known_object' | 'false_positive') => {
    if (!selectedId) return;
    try {
      const updated = await submitReview(selectedId, { status: decision, notes });
      setAnomalies(prev => prev.map(a => a.id === selectedId ? updated : a));
      
      // Update local feedback count for demo
      if (feedbackData) {
        setFeedbackData({ ...feedbackData, feedbackSamples: feedbackData.feedbackSamples + 1 });
      }
      
      triggerToast('Review saved successfully. Added to feedback loop.');
      setNotes('');
      
      // Select next pending
      const nextPending = anomalies.find(a => a.id !== selectedId && a.reviewStatus === 'pending');
      if (nextPending) {
        setTimeout(() => setSelectedId(nextPending.id), 500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedAnomaly = anomalies.find(a => a.id === selectedId);

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className="bg-[#059669]/10 border border-[#059669]/30 text-[#F4EFE6] px-4 py-3 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            <span className="text-sm font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F4EFE6] tracking-tight">
            {activeTab === 'review' ? 'Human Review Queue' : 'Survey Intelligence Report'}
          </h2>
          <p className="text-[#94A3B8] mt-1 text-sm">
            {activeTab === 'review' 
              ? 'Validate AI detections and provide feedback to improve the model.' 
              : 'Exportable operational summary for Sector 7A.'}
          </p>
        </div>
        
        <div className="flex bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-1 shrink-0 shadow-2xl shadow-black/40">
          <button 
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'review' ? 'bg-[#F4EFE6]/10 text-[#F4EFE6] shadow-inner' : 'text-[#94A3B8] hover:text-[#F4EFE6] hover:bg-[#F4EFE6]/[0.06]'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Review Queue
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'report' ? 'bg-[#F4EFE6]/10 text-[#F4EFE6] shadow-inner' : 'text-[#94A3B8] hover:text-[#F4EFE6] hover:bg-[#F4EFE6]/[0.06]'
            }`}
          >
            <FileText className="w-4 h-4" /> Final Report
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-8">
        
        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            
            {/* Left: Queue */}
            <div className="lg:col-span-1 bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 shadow-2xl shadow-black/40 rounded-2xl flex flex-col overflow-hidden h-[600px] lg:h-auto">
              <div className="p-4 border-b border-[#F4EFE6]/10 flex justify-between items-center bg-transparent">
                 <h3 className="font-semibold text-[#F4EFE6] text-sm uppercase tracking-wider">Pending Review</h3>
                 <span className="bg-[#F4EFE6]/10 text-[#94A3B8] text-xs px-2 py-1 rounded-full font-medium">
                    {anomalies.filter(a => a.reviewStatus === 'pending').length} left
                 </span>
              </div>
              <ul className="flex-1 overflow-y-auto divide-y divide-[#F4EFE6]/5">
                {anomalies.map(anomaly => (
                  <li key={anomaly.id}>
                    <button
                      onClick={() => setSelectedId(anomaly.id)}
                      className={`w-full text-left p-4 hover:bg-[#F4EFE6]/[0.06] transition-colors flex flex-col gap-2 border-l-2
                        ${selectedId === anomaly.id ? 'bg-[#F4EFE6]/10 border-[#059669] shadow-inner' : 'bg-transparent border-transparent'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-sm ${selectedId === anomaly.id ? 'text-[#F4EFE6]' : 'text-[#94A3B8]'}`}>{anomaly.label}</span>
                        {anomaly.reviewStatus === 'pending' ? (
                           <div className="w-2 h-2 rounded-full bg-[#D97706]"></div>
                        ) : (
                           <Check className="w-3.5 h-3.5 text-[#059669]" />
                        )}
                      </div>
                      <StatusBadge status={anomaly.reviewStatus} />
                      {anomaly.notes && (
                         <div className="mt-2 text-xs text-[#94A3B8] bg-[#070D18]/50 p-2 rounded-lg border border-[#F4EFE6]/5 text-left truncate animate-in fade-in slide-in-from-top-1 duration-300">
                            <span className="text-[#1E40AF] font-semibold">Notes:</span> {anomaly.notes}
                         </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Center: Evidence Viewer */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {selectedAnomaly ? (
                <>
                  <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-2xl p-6 shadow-2xl shadow-black/40 flex flex-col gap-6">
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="text-xl font-bold text-[#F4EFE6] mb-2">{selectedAnomaly.label} Evidence</h3>
                           <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                              <button 
                                 onClick={() => navigate('/map', { state: { selectedAnomalyId: selectedAnomaly.id } })}
                                 className="flex items-center gap-1.5 hover:text-[#F4EFE6] transition-colors cursor-pointer bg-[#F4EFE6]/5 px-2 py-1 rounded border border-[#F4EFE6]/10 hover:bg-[#F4EFE6]/10"
                                 title="View on Map"
                              >
                                 <Navigation className="w-4 h-4 text-[#059669]" /> 
                                 {formatCoordinates(selectedAnomaly.latitude, selectedAnomaly.longitude)}
                              </button>
                              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(selectedAnomaly.detectedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-3xl font-mono font-bold text-[#DC2626]">{selectedAnomaly.overallScore}</div>
                           <div className="text-xs text-[#94A3B8] uppercase tracking-wider font-semibold">Anomaly Score</div>
                        </div>
                     </div>
                     
                     {/* Sonar Image Crop */}
                     <div className="w-full h-64 bg-gradient-to-br from-[#0a1922] to-[#040810] border border-[#F4EFE6]/10 rounded-xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #059669 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {/* Dynamic Sonar Shape Rendering */}
                        {(() => {
                           const isCable = selectedAnomaly.label.toLowerCase().includes('cable') || selectedAnomaly.explanation.toLowerCase().includes('cable');
                           const isUnknown = selectedAnomaly.classification === 'unknown';
                           
                           if (isCable) {
                             return (
                               <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-80 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                                 <path d="M0,80 Q40,60 60,30 T100,10" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="4,2" className="animate-pulse"/>
                                 <path d="M0,82 Q40,62 60,32 T100,12" fill="none" stroke="#DC2626" strokeWidth="0.5" opacity="0.6"/>
                                 <rect x="55" y="25" width="10" height="10" fill="rgba(220,38,38,0.2)" stroke="#DC2626" strokeWidth="0.5" className="animate-ping" style={{transformOrigin: '60px 30px'}}/>
                               </svg>
                             );
                           } else if (isUnknown) {
                             const getSeededRandom = (seed: string) => {
                               let h = 0;
                               for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
                               return () => {
                                 h = Math.imul(1525540023, h) + 1 | 0;
                                 return (h >>> 0) / 4294967296;
                               };
                             };
                             const rand = getSeededRandom(selectedAnomaly.id);
                             const numPoints = 5 + Math.floor(rand() * 4);
                             const points = Array.from({ length: numPoints }).map((_, i) => {
                               const angle = (i / numPoints) * Math.PI * 2;
                               const radius = 20 + rand() * 30; // Radius between 20 and 50
                               const x = 50 + Math.cos(angle) * radius;
                               const y = 50 + Math.sin(angle) * radius;
                               return `${x.toFixed(1)},${y.toFixed(1)}`;
                             }).join(' ');

                             return (
                               <svg viewBox="0 0 100 100" className="absolute inset-1/4 w-1/2 h-1/2 opacity-80 drop-shadow-[0_0_12px_rgba(217,119,6,0.8)]">
                                 <polygon points={points} fill="rgba(217,119,6,0.15)" stroke="#D97706" strokeWidth="1" strokeDasharray="3,3" className="animate-pulse" />
                                 <circle cx="50" cy="50" r={30 + rand() * 15} fill="none" stroke="#D97706" strokeWidth="0.5" opacity="0.3" strokeDasharray="2,4" />
                               </svg>
                             );
                           } else {
                             return (
                               <div className="absolute inset-[30%] border border-[#059669] rounded-md opacity-60 bg-[#059669]/10 shadow-[0_0_20px_rgba(5,150,105,0.4)] flex items-center justify-center">
                                 <div className="w-1/2 h-1/2 bg-[#059669]/20 rounded-full animate-ping"></div>
                               </div>
                             );
                           }
                        })()}

                        <span className="absolute bottom-3 left-3 text-xs font-mono text-[#059669] bg-[#070D18]/80 px-2 py-1 rounded border border-[#059669]/30">Sonar Crop — 450kHz</span>
                     </div>
                     
                     {/* Explanation */}
                     <div className="bg-[#070D18]/50 border border-[#F4EFE6]/10 shadow-inner rounded-xl p-4 flex items-start gap-4">
                        <Zap className="w-6 h-6 text-[#B993FF] shrink-0 mt-1" />
                        <div>
                           <div className="text-sm font-semibold text-[#B993FF] mb-1">AI-Assisted Explanation</div>
                           <p className="text-sm text-[#F4EFE6] leading-relaxed">{selectedAnomaly.explanation}</p>
                        </div>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#94A3B8]">Select an anomaly to review</div>
              )}
            </div>

            {/* Right: Decision Card */}
            <div className="lg:col-span-1">
              <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-2xl p-6 shadow-2xl shadow-black/40 sticky top-6">
                 <h3 className="font-semibold text-[#F4EFE6] mb-6">Review Decision</h3>
                 
                 <div className="flex flex-col gap-3 mb-6">
                    <button 
                       onClick={() => handleDecision('confirmed_unknown')}
                       className="w-full text-left px-4 py-3 bg-[#F4EFE6]/5 hover:bg-[#F4EFE6]/10 border border-transparent hover:border-[#B993FF]/50 rounded-xl transition-colors text-[#F4EFE6] font-medium flex items-center justify-between group shadow-sm"
                    >
                       Confirm Unknown
                       <CheckCircle2 className="w-4 h-4 text-[#B993FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button 
                       onClick={() => handleDecision('known_object')}
                       className="w-full text-left px-4 py-3 bg-[#F4EFE6]/5 hover:bg-[#F4EFE6]/10 border border-transparent hover:border-[#1D4ED8]/50 rounded-xl transition-colors text-[#F4EFE6] font-medium flex items-center justify-between group shadow-sm"
                    >
                       Label as Known Object
                       <CheckCircle2 className="w-4 h-4 text-[#1D4ED8] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button 
                       onClick={() => handleDecision('false_positive')}
                       className="w-full text-left px-4 py-3 bg-[#F4EFE6]/5 hover:bg-[#F4EFE6]/10 border border-transparent hover:border-[#94A3B8]/50 rounded-xl transition-colors text-[#F4EFE6] font-medium flex items-center justify-between group shadow-sm"
                    >
                       False Positive
                       <CheckCircle2 className="w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button 
                       onClick={() => setShowNewClassModal(true)}
                       className="w-full text-left px-4 py-3 bg-transparent border border-[#F4EFE6]/20 hover:border-[#F4EFE6]/40 hover:bg-[#F4EFE6]/5 rounded-xl transition-colors text-[#94A3B8] hover:text-[#F4EFE6] font-medium border-dashed">
                       + Add New Class
                    </button>
                 </div>
                 
                 <div className="mb-6 relative">
                    <label className="text-xs text-[#94A3B8] uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Operator Notes</label>
                    <textarea 
                       value={notes}
                       onChange={e => setNotes(e.target.value)}
                       onBlur={() => {
                         if (notes.trim() !== '' && selectedId) {
                           setAnomalies(prev => prev.map(a => a.id === selectedId ? { ...a, notes } : a));
                           triggerToast('Notes saved successfully');
                         }
                       }}
                       className="w-full bg-[#070D18] border border-[#F4EFE6]/10 shadow-inner rounded-xl p-3 text-sm text-[#F4EFE6] focus:outline-none focus:border-[#059669]/50 focus:ring-1 focus:ring-[#059669]/50 resize-none h-24 transition-all" 
                       placeholder="Add justification for the model feedback loop..."
                    ></textarea>
                 </div>
                 
                 <div className="bg-[#059669]/10 border border-[#059669]/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#059669]/20 rounded-full flex items-center justify-center shrink-0">
                       <Zap className="w-4 h-4 text-[#059669]" />
                    </div>
                    <div className="text-xs text-[#F4EFE6]">
                       Your decision adds to the active learning set for Model v1.1
                    </div>
                 </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'report' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
             
             {/* Report Actions */}
              <div className="flex gap-3 mt-4 md:mt-0">
                <button 
                  onClick={() => {
                    triggerToast('Generating PDF...');
                    setTimeout(() => {
                      const blob = new Blob(['Dummy PDF Content'], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `abysswatch_report_${activeHarbour.replace(' ', '_')}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      triggerToast('Downloaded PDF');
                    }, 1500);
                  }}
                  className="bg-[#F4EFE6]/10 hover:bg-[#1E40AF]/80 text-[#F4EFE6] text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                   <Download className="w-4 h-4" /> Export PDF
                </button>
                <button 
                  onClick={() => {
                    triggerToast('Generating CSV...');
                    setTimeout(() => {
                      const csvContent = 'ID,Classification,Score,Status\n' + anomalies.map(a => `${a.id},${a.classification},${a.overallScore},${a.reviewStatus}`).join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `abysswatch_data_${activeHarbour.replace(' ', '_')}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      triggerToast('Downloaded CSV');
                    }, 1000);
                  }}
                  className="bg-[#F4EFE6]/10 hover:bg-[#1E40AF]/80 text-[#F4EFE6] text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                   <FileText className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={async () => {
                   try {
                     await navigator.clipboard.writeText(window.location.href);
                     triggerToast('Link copied to clipboard!');
                   } catch (err) {
                     const textArea = document.createElement("textarea");
                     textArea.value = window.location.href;
                     document.body.appendChild(textArea);
                     textArea.select();
                     try {
                       document.execCommand("copy");
                       triggerToast('Link copied to clipboard!');
                     } catch (e) {
                       triggerToast('Failed to copy link', 'info');
                     }
                     textArea.remove();
                   }
                }} className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-[#F4EFE6] font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                   <Share2 className="w-4 h-4" /> Share Demo Link
                </button>
             </div>
             
             {/* Disclaimer */}
             <div className="bg-[#D97706]/10 border border-[#D97706]/30 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-sm text-[#D97706] leading-relaxed">
                   <strong>Disclaimer:</strong> Prototype output for operational review and SIH demonstration; not a substitute for certified marine assessment. This report relies on mock data for demonstration purposes.
                </p>
             </div>
             
             {/* Summary Cards */}
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-4 shadow-2xl shadow-black/40">
                   <div className="text-xs text-[#94A3B8] mb-1 font-semibold uppercase tracking-wider">Coverage</div>
                   <div className="text-2xl font-bold text-[#F4EFE6]">{reportData?.surveyCoverage}</div>
                </div>
                <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-4 shadow-2xl shadow-black/40">
                   <div className="text-xs text-[#94A3B8] mb-1 font-semibold uppercase tracking-wider">Normal Regions</div>
                   <div className="text-2xl font-bold text-[#059669]">{reportData?.normalRegions}</div>
                </div>
                <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-4 shadow-2xl shadow-black/40">
                   <div className="text-xs text-[#94A3B8] mb-1 font-semibold uppercase tracking-wider">Known Objects</div>
                   <div className="text-2xl font-bold text-[#1D4ED8]">{reportData?.knownAnomalies}</div>
                </div>
                <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-4 shadow-2xl shadow-black/40">
                   <div className="text-xs text-[#94A3B8] mb-1 font-semibold uppercase tracking-wider">Unknown</div>
                   <div className="text-2xl font-bold text-[#B993FF]">{reportData?.unknownAnomalies}</div>
                </div>
                <div className="bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-4 shadow-2xl shadow-black/40">
                   <div className="text-xs text-[#94A3B8] mb-1 font-semibold uppercase tracking-wider">New Changes</div>
                   <div className="text-2xl font-bold text-[#DC2626]">{reportData?.newChanges}</div>
                </div>
             </div>
             
             {/* Map Snapshot & Table */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 border border-[#F4EFE6]/10 rounded-xl overflow-hidden h-64 relative flex items-center justify-center bg-[#070D18]">
                    <Map
                      initialViewState={{
                        longitude: HARBOURS[activeHarbour].lng,
                        latitude: HARBOURS[activeHarbour].lat,
                        zoom: 12
                      }}
                    >
                      {anomalies.filter(a => a.priority === 'immediate' || a.priority === 'high').map(anomaly => (
                        <Marker
                          key={anomaly.id}
                          longitude={anomaly.longitude}
                          latitude={anomaly.latitude}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#DC2626] border border-white animate-pulse shadow-[0_0_10px_#DC2626]"></div>
                        </Marker>
                      ))}
                    </Map>
                </div>
                
                <div className="md:col-span-2 bg-[#F4EFE6]/[0.03] backdrop-blur-xl border border-[#F4EFE6]/10 rounded-xl p-5 overflow-x-auto shadow-2xl shadow-black/40">
                   <h3 className="font-semibold text-[#F4EFE6] mb-4">Top Priority Detections</h3>
                   <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[#94A3B8] uppercase tracking-wider bg-[#F4EFE6]/5 border-b border-[#F4EFE6]/10">
                         <tr>
                            <th className="px-4 py-3 font-semibold rounded-tl-lg">ID</th>
                            <th className="px-4 py-3 font-semibold">Classification</th>
                            <th className="px-4 py-3 font-semibold">Score</th>
                            <th className="px-4 py-3 font-semibold rounded-tr-lg">Review Status</th>
                         </tr>
                      </thead>
                      <tbody>
                         {anomalies.sort((a, b) => b.overallScore - a.overallScore).slice(0, 10).map(a => (
                            <tr key={a.id} className="border-b border-[#F4EFE6]/5 hover:bg-[#F4EFE6]/[0.06] transition-colors">
                               <td className="px-4 py-3 font-mono text-[#F4EFE6]">{a.id}</td>
                               <td className="px-4 py-3 capitalize text-[#F4EFE6]">{a.classification.replace('_', ' ')}</td>
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-[#F4EFE6]/10 rounded-full overflow-hidden border border-[#F4EFE6]/5">
                                       <div className="bg-[#DC2626] h-full shadow-[0_0_8px_#DC2626]" style={{ width: `${a.overallScore}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-[#94A3B8]">{a.overallScore}</span>
                                 </div>
                               </td>
                               <td className="px-4 py-3"><StatusBadge status={a.reviewStatus} /></td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

          </div>
        )}
        
        {showNewClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070D18]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#070D18] border border-[#F4EFE6]/10 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-semibold text-[#F4EFE6] mb-4">Add New Class</h3>
              <input 
                type="text"
                autoFocus
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newClassName.trim() !== '') {
                     try {
                       const updated = await submitReview(selectedId!, { status: 'confirmed_unknown', newClass: newClassName.trim() });
                       setAnomalies(prev => prev.map(a => a.id === selectedId ? updated : a));
                       triggerToast(`Class '${newClassName}' added successfully`);
                       
                       const nextPending = anomalies.find(a => a.id !== selectedId && a.reviewStatus === 'pending');
                       if (nextPending) {
                         setTimeout(() => setSelectedId(nextPending.id), 500);
                       }
                     } catch (e) {}
                     setShowNewClassModal(false);
                     setNewClassName('');
                  }
                  if (e.key === 'Escape') {
                     setShowNewClassModal(false);
                     setNewClassName('');
                  }
                }}
                placeholder="e.g. Submerged Container"
                className="w-full bg-[#050A14] border border-[#F4EFE6]/10 rounded-lg p-3 text-[#F4EFE6] focus:outline-none focus:border-[#1E40AF] mb-6"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { setShowNewClassModal(false); setNewClassName(''); }}
                  className="px-4 py-2 text-sm text-[#94A3B8] hover:text-[#F4EFE6] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                     if (newClassName.trim() !== '') {
                        try {
                          const updated = await submitReview(selectedId!, { status: 'confirmed_unknown', newClass: newClassName.trim() });
                          setAnomalies(prev => prev.map(a => a.id === selectedId ? updated : a));
                          triggerToast(`Class '${newClassName}' added successfully`);
                          
                          const nextPending = anomalies.find(a => a.id !== selectedId && a.reviewStatus === 'pending');
                          if (nextPending) {
                            setTimeout(() => setSelectedId(nextPending.id), 500);
                          }
                        } catch (e) {}
                        setShowNewClassModal(false);
                        setNewClassName('');
                     }
                  }}
                  className="px-4 py-2 text-sm bg-[#1D4ED8] text-[#F4EFE6] font-semibold rounded-lg hover:bg-[#1E40AF] transition-colors"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

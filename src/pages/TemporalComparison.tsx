import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { History, Zap, ShieldAlert, ToggleLeft, ToggleRight, SlidersHorizontal, Anchor } from 'lucide-react';
import { getTemporalSeries, getAnomalyById, getAnomalies } from '../services/api';
import { TemporalPoint, Anomaly } from '../data/mockData';
import { useHarbour } from '../contexts/AppContext';

const glass = 'bg-white/[0.02] backdrop-blur-3xl border border-white/10 border-t-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]';

export default function TemporalComparison() {
  const { activeHarbour } = useHarbour();
  const [chartData, setChartData] = useState<TemporalPoint[]>([]);
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const [showChangedOnly, setShowChangedOnly] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(4);

  const currentSurveyIndex  = chartData.length > 0 ? chartData.length - 1 : 5;
  const previousSurveyIndex = chartData.length > 0 ? chartData.length - 2 : 4;
  const baselineIndex = 0;

  useEffect(() => {
    getAnomalies({}, activeHarbour).then(anomalies => {
      const id = anomalies[0]?.id || 'ano_017';
      getTemporalSeries(id, activeHarbour).then(data => {
        setChartData(data);
        setSliderIndex(data.length > 1 ? data.length - 2 : 4); // default to previous survey
      });
      getAnomalyById(id, activeHarbour).then(setAnomaly).catch(() => setAnomaly(null));
    });
  }, [activeHarbour]);

  // The "reference" panel shows the date at sliderIndex; the "current" panel always shows latest
  const referenceDate = chartData[sliderIndex]?.date || "Mar '26";
  const currentDate   = chartData[currentSurveyIndex]?.date || "Aug '26";

  // Heatmap opacity changes with sliderIndex — older = less delta, recent = more
  const deltaOpacity = chartData.length > 0
    ? 0.1 + (sliderIndex / (chartData.length - 1)) * 0.6
    : 0.4;

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Anchor className="w-4 h-4 text-[#60A5FA] opacity-70" />
            <span className="text-[10px] text-[#8B9BB4] font-mono uppercase tracking-[0.15em]">S.A.G.A.R. Command — Temporal Analysis</span>
          </div>
          <h2 className="text-2xl font-bold text-[#F4EFE6] tracking-tight">What changed beneath the surface?</h2>
          <p className="text-[#8B9BB4] mt-1 text-sm">
            {anomaly ? `Anomaly ${anomaly.label} — ${activeHarbour}` : 'Temporal analysis'}
          </p>
        </div>

        {/* Survey selector pills */}
        <div className={`flex ${glass} rounded-xl p-1 shrink-0`}>
          {[
            { label: 'Baseline',        idx: baselineIndex },
            { label: 'Previous Survey', idx: previousSurveyIndex },
            { label: 'Current Survey',  idx: currentSurveyIndex },
          ].map(({ label, idx }) => (
            <button
              key={label}
              onClick={() => setSliderIndex(idx)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sliderIndex === idx
                  ? 'bg-white/[0.08] text-[#F4EFE6] shadow-sm border border-white/10'
                  : 'text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.04]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">

        {/* Left: Imagery + Slider */}
        <div className="flex flex-col gap-4 min-h-[400px]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#F4EFE6] text-sm">Imagery Synchronisation</h3>
            <button
              onClick={() => setShowChangedOnly(!showChangedOnly)}
              className="flex items-center gap-2 text-sm text-[#8B9BB4] hover:text-[#F4EFE6] transition-colors"
            >
              {showChangedOnly
                ? <ToggleRight className="w-5 h-5 text-[#45A796]" />
                : <ToggleLeft className="w-5 h-5" />}
              Show changed regions only
            </button>
          </div>

          {/* Dual panels */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* Reference */}
            <div className={`${glass} rounded-2xl overflow-hidden flex flex-col relative group`}>
              <div className="absolute top-3 left-3 bg-[#020611]/80 backdrop-blur-xl border border-white/10 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-[#F4EFE6] z-10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B9BB4]" />
                {referenceDate} · Reference
              </div>
              <div className="flex-1 bg-gradient-to-br from-[#0A192F] to-[#000000] relative min-h-[180px]">
                {/* Sonar dot matrix */}
                <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, #45A796 1px, transparent 1px)',
                  backgroundSize: '28px 28px'
                }} />
                {/* Depth lines */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.2) 18px, rgba(255,255,255,0.2) 19px)'
                }} />
                <div className="absolute bottom-3 right-3 text-[9px] font-mono text-[#8B9BB4]/60">0m depth</div>
              </div>
            </div>

            {/* Current */}
            <div className={`${glass} rounded-2xl overflow-hidden flex flex-col relative group`}>
              <div className="absolute top-3 left-3 bg-[#E05763]/10 backdrop-blur border border-[#E05763]/30 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-[#E05763] z-10 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3" />
                {currentDate} · Current
              </div>
              <div className="flex-1 bg-gradient-to-br from-[#0A192F] to-[#000000] relative min-h-[180px]">
                <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, #45A796 1px, transparent 1px)',
                  backgroundSize: '28px 28px'
                }} />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.2) 18px, rgba(255,255,255,0.2) 19px)'
                }} />
                {/* Heatmap delta overlay — opacity driven by slider */}
                {showChangedOnly && (
                  <div
                    className="absolute inset-1/4 border border-[#E05763]/50 rounded-xl bg-[#E05763]/10 flex flex-col items-center justify-center transition-all duration-500"
                    style={{ opacity: deltaOpacity }}
                  >
                    <div className="w-12 h-12 bg-[#E05763]/15 rounded-full blur-xl" />
                    <span className="text-[#E05763] font-mono text-[10px] mt-2 relative z-10 font-bold bg-[#020611]/80 px-2 py-0.5 rounded">+0.8m ELEV</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 text-[9px] font-mono text-[#8B9BB4]/60">0m depth</div>
              </div>
            </div>
          </div>

          {/* Timeline slider */}
          <div className={`${glass} rounded-xl p-4 flex items-center gap-4`}>
            <SlidersHorizontal className="w-4 h-4 text-[#8B9BB4] shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <input
                type="range"
                min="0"
                max={chartData.length > 1 ? chartData.length - 1 : 5}
                value={sliderIndex}
                onChange={e => setSliderIndex(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              {/* Tick labels */}
              {chartData.length > 0 && (
                <div className="flex justify-between px-0.5">
                  {chartData.map((d, i) => (
                    <span key={i} className={`text-[9px] font-mono transition-colors ${i === sliderIndex ? 'text-[#1E6AFF]' : 'text-[#8B9BB4]/50'}`}>
                      {d.date}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-center shrink-0">
              <div className="text-xs font-mono font-bold text-[#F4EFE6]">{referenceDate}</div>
              <div className="text-[9px] text-[#8B9BB4] font-mono">selected</div>
            </div>
          </div>
        </div>

        {/* Right: Chart + Evidence */}
        <div className="flex flex-col gap-5 min-h-[400px]">

          {/* Temporal trend chart */}
          <div className={`${glass} rounded-2xl p-6`}>
            <h3 className="font-semibold text-[#F4EFE6] mb-4 flex items-center gap-2.5 text-xs uppercase tracking-[0.12em]">
              <div className="w-6 h-6 rounded-lg bg-[#45A796]/10 border border-[#45A796]/20 flex items-center justify-center">
                <History className="w-3.5 h-3.5 text-[#45A796]" />
              </div>
              Temporal Trend
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E05763" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#E05763" stopOpacity={0.03}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8B9BB4" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke="#8B9BB4" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(2,6,17,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F4EFE6', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                    itemStyle={{ color: '#E05763', fontWeight: 600, fontSize: '13px' }}
                    labelStyle={{ color: '#8B9BB4', fontSize: '11px', marginBottom: '4px' }}
                    cursor={{ stroke: '#E05763', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <ReferenceLine y={80} stroke="#E5B869" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
                  {/* Vertical reference line at selected slider position */}
                  {chartData[sliderIndex] && (
                    <ReferenceLine x={chartData[sliderIndex].date} stroke="#1E6AFF" strokeDasharray="3 3" strokeWidth={1.5} opacity={0.6} />
                  )}
                  <Area type="monotone" dataKey="score" stroke="#E05763" strokeWidth={2} fillOpacity={1} fill="url(#colorChange)" activeDot={{ r: 4, fill: '#020611', stroke: '#E05763', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evidence + AI */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className={`${glass} rounded-2xl p-5`}>
              <h4 className="text-[10px] font-semibold text-[#8B9BB4] uppercase tracking-[0.12em] mb-4">Evidence Summary</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Spatial deviation',    value: 'High (88/100)',      color: 'text-[#E5B869]' },
                  { label: 'Temporal change',       value: 'Very High (95/100)', color: 'text-[#E05763]' },
                  { label: 'First observed',        value: '27 Aug 2026',        color: 'text-[#F4EFE6] font-mono' },
                  { label: 'Prior state',           value: 'Not present',        color: 'text-[#F4EFE6]' },
                ].map(row => (
                  <li key={row.label} className="flex justify-between items-center text-xs">
                    <span className="text-[#8B9BB4]">{row.label}</span>
                    <span className={row.color}>{row.value}</span>
                  </li>
                ))}
                <li className="flex justify-between items-center text-xs pt-2 border-t border-white/[0.06] mt-1">
                  <span className="text-[#8B9BB4]">Recommended Priority</span>
                  <span className="text-[#E05763] font-bold">Immediate Review</span>
                </li>
              </ul>
            </div>

            <div className={`${glass} rounded-2xl p-5 relative overflow-hidden flex flex-col border-[#B993FF]/20`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B993FF]/8 blur-3xl rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
              <h4 className="text-[10px] font-semibold text-[#B993FF] uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5 relative z-10">
                <Zap className="w-3.5 h-3.5" /> AI Explanation
              </h4>
              <p className="text-xs text-[#F4EFE6] leading-relaxed flex-1 relative z-10">
                {anomaly?.explanation || 'Load anomaly data to see AI-assisted explanation.'}
              </p>
              <div className="mt-4 relative z-10">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[10px] text-[#8B9BB4]">Model Confidence</span>
                  <span className="text-[#45A796] font-mono font-bold text-base">{anomaly?.confidence ?? '--'}%</span>
                </div>
                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                  <div className="bg-gradient-to-r from-[#45A796]/60 to-[#45A796] h-full transition-all duration-700" style={{ width: `${anomaly?.confidence || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

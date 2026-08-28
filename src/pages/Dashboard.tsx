import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Source, Layer, Marker } from '../components/RawMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { UploadCloud, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Anchor } from 'lucide-react';

import MetricCard from '../components/ui/MetricCard';
import ActiveLearningWidget from '../components/ui/ActiveLearningWidget';
import PriorityQueue from '../components/ui/PriorityQueue';
import {
  getDashboardMetrics,
  getAnomalies,
  getTemporalSeries,
  getModelFeedback
} from '../services/api';
import { DashboardMetrics, Anomaly, TemporalPoint, ModelFeedback, HARBOURS } from '../data/mockData';
import { useMapStyle } from '../data/mapStyle';
import { useHarbour, useRealTimeAnomalies } from '../contexts/AppContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { generateGraticule } from '../utils/graticule';

export default function Dashboard() {
  const { activeHarbour, setActiveHarbour } = useHarbour();
  const mapStyle = useMapStyle();
  const navigate = useNavigate();
  const { formatCoordinates, formatLat, formatLng } = usePreferences();
  const realTimeUpdates = useRealTimeAnomalies();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [chartData, setChartData] = useState<TemporalPoint[]>([]);
  const [modelFeedback, setModelFeedback] = useState<ModelFeedback | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [m, a, c, mf] = await Promise.all([
        getDashboardMetrics(activeHarbour),
        getAnomalies({}, activeHarbour),
        getTemporalSeries('', activeHarbour),
        getModelFeedback()
      ]);
      setMetrics(m);
      setAnomalies(a);
      setChartData(c);
      setModelFeedback(mf);
      if (a.length > 0) {
        const top = a.find(x => x.priority === 'immediate') || a.find(x => x.priority === 'high') || a[0];
        setSelectedAnomalyId(top.id);
      }
    }
    loadData();
  }, [activeHarbour]);

  const liveAnomalies = React.useMemo(() =>
    anomalies.map(a => ({ ...a, ...(realTimeUpdates[a.id] || {}) })),
    [anomalies, realTimeUpdates]
  );

  const priorityAnomalies = liveAnomalies
    .filter(a => a.priority === 'immediate' || a.priority === 'high' || a.priority === 'medium')
    .sort((a, b) => b.overallScore - a.overallScore);

  const harborConfig = HARBOURS[activeHarbour] || HARBOURS['Mumbai Harbor Q3'];

  // Glass card class — canonical formula
  const glass = 'bg-white/[0.02] backdrop-blur-3xl border border-white/10 border-t-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]';

  return (
    <div className="flex flex-col h-full gap-6">

      {/* ── Hero Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Anchor className="w-4 h-4 text-[#60A5FA] opacity-70" />
            <span className="text-[10px] text-[#8B9BB4] font-mono uppercase tracking-[0.15em]">Sector 7A — {activeHarbour}</span>
          </div>
          <h2 className="text-3xl font-bold text-[#F4EFE6] tracking-tight leading-tight">
            Seabed Intelligence,<br />
            <span className="text-[#8B9BB4] font-light">made reviewable.</span>
          </h2>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 bg-[#1E6AFF]/90 hover:bg-[#1E6AFF] text-[#F4EFE6] font-semibold px-6 py-3 rounded-xl transition-all duration-200 border border-[#1E6AFF]/60 hover:border-[#1E6AFF] shadow-[0_4px_20px_rgba(30,106,255,0.2)] shrink-0"
        >
          <UploadCloud className="w-5 h-5" />
          Upload New Survey
        </button>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Normal Regions"    value={metrics?.normalRegions ?? '--'}    icon={CheckCircle}   colorClass="text-[#45A796]" />
        <MetricCard label="Known Anomalies"   value={metrics?.knownAnomalies ?? '--'}   icon={AlertTriangle} colorClass="text-[#60A5FA]" />
        <MetricCard label="Unknown Anomalies" value={metrics?.unknownAnomalies ?? '--'} icon={AlertCircle}   colorClass="text-[#B993FF]" trend="+2 since last run" />
        <MetricCard label="New Changes"       value={metrics?.newChanges ?? '--'}       icon={TrendingUp}    colorClass="text-[#E5B869]" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Left: Map + Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-[600px] lg:min-h-0">

          {/* Normality Map */}
          <div className={`${glass} rounded-2xl overflow-hidden flex-1 relative flex flex-col`}>
            {/* Legend */}
            <div className="absolute top-4 left-4 z-20 bg-[#020611]/80 backdrop-blur-xl border border-white/10 rounded-xl p-3.5">
              <h3 className="font-semibold text-[#F4EFE6] mb-2.5 text-[10px] uppercase tracking-[0.12em]">Normality Map</h3>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#45A796]"/><span className="text-[#8B9BB4]">Normal</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#E5B869]"/><span className="text-[#8B9BB4]">Unusual</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#E05763]"/><span className="text-[#8B9BB4]">Highly Anomalous</span></div>
              </div>
            </div>

            <button
              onClick={() => navigate('/map')}
              className="absolute top-4 right-4 z-20 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 text-[#F4EFE6] text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200"
            >
              Open Full Map
            </button>

            {/* Map */}
            <div className="flex-1 w-full relative overflow-hidden">
              {/* Real Map Section */}
              <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden border border-white/10">
                  <div 
                    className={`w-full h-full absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <Map
                      key={activeHarbour}
                      initialViewState={{ longitude: harborConfig.lng, latitude: harborConfig.lat, zoom: 4 }}
                      onIdle={(e: any) => {
                        e.target.resize();
                        setIsMapLoaded(true);
                      }}
                    >
                  {/* Harbour markers */}
                  {Object.entries(HARBOURS).map(([name, coords]) => (
                    <Marker key={name} longitude={coords.lng} latitude={coords.lat}>
                      <div
                        className="flex flex-col items-center group cursor-pointer relative"
                        onClick={e => { e.stopPropagation(); setActiveHarbour(name); navigate('/map'); }}
                      >
                        {name === activeHarbour && (
                          <div className="absolute -inset-6 rounded-full border border-dashed border-[#45A796]/50 bg-[#45A796]/5 pointer-events-none -translate-y-4">
                            <div className="absolute inset-3 rounded-full border border-dotted border-[#45A796]/30" />
                          </div>
                        )}
                        <div className="w-3 h-3 bg-[#1E6AFF] rounded-full border-2 border-[#020611] shadow-lg group-hover:scale-125 transition-transform z-10 relative" />
                        <div className="mt-1 px-2 py-0.5 bg-white/[0.04] backdrop-blur border border-white/10 rounded text-[10px] text-[#8B9BB4] font-bold whitespace-nowrap">
                          {name}
                        </div>
                      </div>
                    </Marker>
                  ))}

                  {/* Grid */}
                  <Source id="graticule" type="geojson" data={generateGraticule(0.02, formatLat, formatLng)}>
                    <Layer id="graticule-line" type="line" paint={{ 'line-color': '#F4EFE6', 'line-width': 1, 'line-opacity': 0.07 }} />
                    <Layer id="graticule-label" type="symbol"
                      layout={{ 'text-field': ['get', 'label'], 'symbol-placement': 'line', 'text-size': 10, 'text-letter-spacing': 0.1 }}
                      paint={{ 'text-color': '#8B9BB4', 'text-halo-color': '#020611', 'text-halo-width': 2 }}
                    />
                  </Source>

                  {/* Anomaly nodes */}
                  {liveAnomalies.map(anomaly => {
                    const isHigh = anomaly.severity === 'high';
                    const isUnusual = anomaly.severity === 'unusual';
                    const dotColor = isHigh ? '#E05763' : isUnusual ? '#E5B869' : '#45A796';
                    const ringColor = isHigh ? 'border-[#E05763]' : isUnusual ? 'border-[#E5B869]' : 'border-[#45A796]';
                    const selected = anomaly.id === selectedAnomalyId;
                    return (
                      <Marker key={anomaly.id} longitude={anomaly.longitude} latitude={anomaly.latitude} anchor="center">
                        <div
                          className="relative group cursor-pointer flex flex-col items-center justify-center translate-y-6"
                          onClick={e => { e.stopPropagation(); setSelectedAnomalyId(anomaly.id); }}
                        >
                          <div className="relative mb-2 flex items-center justify-center w-4 h-4">
                            {/* Static dotted ring */}
                            <div className={`absolute -inset-2 rounded-full border border-dotted opacity-60 pointer-events-none ${ringColor}`} />
                            {/* Pulse for selected / immediate */}
                            {(selected || anomaly.priority === 'immediate') && (
                              <div className={`absolute -inset-2 rounded-full animate-ping opacity-30 border-2 ${ringColor}`} />
                            )}
                            {/* Core dot */}
                            <div
                              className={`w-4 h-4 rounded-full z-10 transition-all shadow-lg ${selected ? 'scale-125 ring-4 ring-[#020611]' : 'hover:scale-110 ring-2 ring-[#020611]'}`}
                              style={{ backgroundColor: dotColor }}
                            />
                          </div>
                          <div className="bg-white/[0.04] backdrop-blur border border-white/10 rounded px-2 py-1 flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity z-20">
                            <span className="text-[10px] font-bold text-[#F4EFE6] whitespace-nowrap">{anomaly.label}</span>
                            <span className="text-[9px] font-mono text-[#8B9BB4] whitespace-nowrap">{formatCoordinates(anomaly.latitude, anomaly.longitude)}</span>
                          </div>
                        </div>
                      </Marker>
                    );
                  })}
                </Map>
                </div>
              </div>
            </div>
          </div>

          {/* Survey Activity Chart */}
          <div className={`${glass} rounded-2xl p-6 h-64 shrink-0 flex flex-col`}>
            <h3 className="font-semibold text-[#F4EFE6] mb-4 text-xs uppercase tracking-[0.12em]">Survey Activity — Anomaly Score Trend</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#45A796" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#45A796" stopOpacity={0.03}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8B9BB4" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke="#8B9BB4" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(2,6,17,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F4EFE6', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                    itemStyle={{ color: '#45A796', fontWeight: 600, fontSize: '13px' }}
                    labelStyle={{ color: '#8B9BB4', fontSize: '11px', marginBottom: '4px' }}
                    cursor={{ stroke: '#45A796', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#45A796" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 4, fill: '#020611', stroke: '#45A796', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Priority Queue + Active Learning */}
        <div className="flex flex-col gap-6 h-full min-h-[600px] lg:min-h-0">
          <div className="flex-1 min-h-0">
            <PriorityQueue
              anomalies={priorityAnomalies}
              selectedId={selectedAnomalyId}
              onSelectAnomaly={id => {
                setSelectedAnomalyId(id);
                navigate('/map', { state: { selectedAnomalyId: id } });
              }}
            />
          </div>
          <div className="shrink-0">
            {modelFeedback && (
              <ActiveLearningWidget
                currentModel={modelFeedback.currentModel}
                feedbackSamples={modelFeedback.feedbackSamples}
                potentialRetrainingSet={modelFeedback.potentialRetrainingSet}
                nextModel={modelFeedback.nextModel}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

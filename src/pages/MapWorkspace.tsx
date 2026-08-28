import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Source, Layer, Marker } from '../components/RawMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Crosshair, Filter, Activity, Clock, Navigation, Zap, AlertTriangle, ArrowRight, FileCheck, ExternalLink, X, History, List, Plus, Minus, Compass } from 'lucide-react';

import { getAnomalies } from '../services/api';
import { Anomaly, HARBOURS } from '../data/mockData';
import { useMapStyle } from '../data/mapStyle';
import { useHarbour, useRealTimeAnomalies } from '../contexts/AppContext';
import { usePreferences } from '../contexts/PreferencesContext';
import StatusBadge from '../components/ui/StatusBadge';
import { generateGraticule } from '../utils/graticule';

const glass = 'bg-white/[0.02] backdrop-blur-3xl border border-white/10 border-t-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]';

export default function MapWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeHarbour, setActiveHarbour } = useHarbour();
  const mapStyle = useMapStyle();
  const { formatCoordinates, formatLat, formatLng } = usePreferences();
  const realTimeUpdates = useRealTimeAnomalies();
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [showAnomalyList, setShowAnomalyList] = useState(false);
  const [showGraticule, setShowGraticule] = useState(true);
  const mapRef = useRef<any>(null);
  const radarBlipsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [showSonarModal, setShowSonarModal] = useState(false);
  const [showExplanationDrawer, setShowExplanationDrawer] = useState(false);

  useEffect(() => {
    getAnomalies({}, activeHarbour).then(data => {
      setAnomalies(data);
      if (location.state?.selectedAnomalyId) {
        const id = location.state.selectedAnomalyId;
        setSelectedAnomalyId(id);
        const anomaly = data.find(a => a.id === id);
        if (anomaly && mapRef.current) {
          setTimeout(() => {
            mapRef.current.flyTo({ 
              center: [anomaly.longitude, anomaly.latitude], 
              zoom: 15, 
              duration: 2500,
              curve: 1.2,
              essential: true
            });
          }, 500);
        }
      }
    });
  }, [activeHarbour, location.state]);

  const liveAnomalies = useMemo(() =>
    anomalies.map(a => ({ ...a, ...(realTimeUpdates[a.id] || {}) })),
    [anomalies, realTimeUpdates]
  );

  const filteredAnomalies = useMemo(() => {
    if (activeFilter === 'All') return liveAnomalies;
    if (activeFilter === 'Unknown') return liveAnomalies.filter(a => a.classification === 'unknown');
    if (activeFilter === 'Known Object') return liveAnomalies.filter(a => a.classification === 'known');
    if (activeFilter === 'New Change') return liveAnomalies.filter(a => a.severity === 'unusual' || a.severity === 'high');
    if (activeFilter === 'High Priority') return liveAnomalies.filter(a => a.severity === 'high' || a.severity === 'unusual');
    return liveAnomalies;
  }, [liveAnomalies, activeFilter]);

  // Radar sync
  useEffect(() => {
    let animId: number;
    const update = () => {
      const map = mapRef.current;
      if (map) {
        const zoom = map.getZoom();
        const w = map.getContainer().clientWidth;
        const h = map.getContainer().clientHeight;
        filteredAnomalies.forEach(a => {
          const el = radarBlipsRef.current[a.id];
          if (!el) return;
          if (zoom < 8) { el.style.opacity = '0'; return; }
          const pt = map.project([a.longitude, a.latitude]);
          const rx = 50 + ((pt.x - w / 2) / (w / 2)) * 40;
          const ry = 50 + ((pt.y - h / 2) / (h / 2)) * 40;
          const d = Math.sqrt((rx - 50) ** 2 + (ry - 50) ** 2);
          if (d > 45) { el.style.opacity = '0'; } else {
            el.style.opacity = '1'; el.style.top = `${ry}%`; el.style.left = `${rx}%`;
          }
        });
      }
      animId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animId);
  }, [filteredAnomalies]);

  const selectedAnomaly = selectedAnomalyId ? liveAnomalies.find(a => a.id === selectedAnomalyId) : null;
  const harborConfig = HARBOURS[activeHarbour] || HARBOURS['Mumbai Harbor Q3'];

  // Zoom handlers
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleRecenter = () => mapRef.current?.flyTo({ 
    center: [harborConfig.lng, harborConfig.lat], 
    zoom: 11.5, 
    pitch: 0, 
    bearing: 0, 
    duration: 2000,
    curve: 1.2,
    essential: true 
  });

  // Jump map when harbour changes
  useEffect(() => {
    mapRef.current?.flyTo({
      center: [harborConfig.lng, harborConfig.lat],
      zoom: 11.5,
      duration: 2000,
      curve: 1.2,
      essential: true
    });
  }, [activeHarbour, harborConfig]);

  // Anomaly styling helpers
  const dotColor = (s: string) => s === 'high' ? '#E05763' : s === 'unusual' ? '#E5B869' : '#8B5CF6';
  const ringColor = (s: string) => s === 'high' ? 'border-[#E05763]' : s === 'unusual' ? 'border-[#E5B869]' : 'border-[#8B5CF6]';
  const severityBg = (s: string) => s === 'high' ? 'bg-[#E05763]/15 text-[#E05763]' : s === 'unusual' ? 'bg-[#E5B869]/15 text-[#E5B869]' : 'bg-[#45A796]/15 text-[#45A796]';

  return (
    <div className="flex h-full w-full relative overflow-hidden -m-4 lg:-m-8 -mt-4 lg:-mt-8">

      {/* ══════ FULL-BLEED MAP ══════ */}
      <div className="flex-1 h-full relative bg-[#020611]">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: harborConfig.lng,
              latitude: harborConfig.lat,
              zoom: 11.5,
              pitch: 0,
              bearing: 0,
            }}
          >
          {/* Harbour markers */}
          {Object.entries(HARBOURS).map(([name, coords]) => (
            <Marker key={name} longitude={coords.lng} latitude={coords.lat}>
              <div
                className="flex flex-col items-center group cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  setActiveHarbour(name);
                  mapRef.current?.flyTo({ 
                    center: [coords.lng, coords.lat], 
                    zoom: 11.5, 
                    duration: 2000,
                    curve: 1.2,
                    essential: true 
                  });
                }}
              >
                {name === activeHarbour && (
                  <div className="absolute -inset-6 rounded-full border border-dashed border-[#45A796]/50 bg-[#45A796]/5 pointer-events-none -translate-y-4">
                    <div className="absolute inset-3 rounded-full border border-dotted border-[#45A796]/30" />
                  </div>
                )}
                <div className={`w-3 h-3 rounded-full border-2 border-[#020611] shadow-lg group-hover:scale-125 transition-transform z-10 relative ${name === activeHarbour ? 'bg-[#45A796]' : 'bg-[#1E6AFF]'}`} />
                <div className="mt-1 px-2 py-0.5 bg-white/[0.04] backdrop-blur border border-white/10 rounded text-[10px] text-[#8B9BB4] font-bold whitespace-nowrap">
                  {name}
                </div>
              </div>
            </Marker>
          ))}

          {/* Graticule */}
          {showGraticule && (
            <Source id="graticule" type="geojson" data={generateGraticule(0.02, formatLat, formatLng)}>
              <Layer id="graticule-line" type="line" paint={{ 'line-color': '#F4EFE6', 'line-width': 1, 'line-opacity': 0.07 }} />
              <Layer id="graticule-label" type="symbol"
                layout={{ 'text-field': ['get', 'label'], 'symbol-placement': 'line', 'text-size': 10, 'text-letter-spacing': 0.1 }}
                paint={{ 'text-color': '#8B9BB4', 'text-halo-color': '#020611', 'text-halo-width': 2 }}
              />
            </Source>
          )}

          {/* Anomaly nodes */}
          {filteredAnomalies.map(anomaly => {
            const selected = anomaly.id === selectedAnomalyId;
            return (
              <Marker key={anomaly.id} longitude={anomaly.longitude} latitude={anomaly.latitude} anchor="center"
                onClick={(e: any) => {
                  if (e.stopPropagation) e.stopPropagation();
                  setSelectedAnomalyId(anomaly.id);
                  mapRef.current?.flyTo({ 
                    center: [anomaly.longitude, anomaly.latitude], 
                    zoom: 15, 
                    duration: 2000,
                    curve: 1.2,
                    essential: true 
                  });
                }}
              >
                <div className="relative group cursor-pointer flex flex-col items-center justify-center translate-y-6">
                  <div className="relative mb-2 flex items-center justify-center w-4 h-4">
                    <div className={`absolute -inset-2 rounded-full border border-dotted opacity-60 pointer-events-none ${ringColor(anomaly.severity)}`} />
                    {(selected || anomaly.severity === 'high') && (
                      <div className={`absolute -inset-2 rounded-full animate-ping opacity-30 border-2 ${ringColor(anomaly.severity)}`} />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full z-10 transition-all shadow-lg ${selected ? 'scale-125 ring-4 ring-[#020611]' : 'hover:scale-110 ring-2 ring-[#020611]'}`}
                      style={{ backgroundColor: dotColor(anomaly.severity) }}
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

        {/* ── Top: Filters ── */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className={`${glass} rounded-full p-1 flex items-center gap-0.5 pointer-events-auto w-fit`}>
            {['All', 'Unknown', 'Known Object', 'New Change', 'High Priority'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 text-[11px] font-medium transition-all duration-200 rounded-full whitespace-nowrap ${
                  activeFilter === f
                    ? 'bg-white/[0.08] text-[#F4EFE6] border border-white/10'
                    : 'text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.04]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Map Controls — Layers/List/Recenter */}
          <div className={`${glass} rounded-xl p-1 flex flex-col gap-0.5 pointer-events-auto`}>
            <button
              onClick={() => setShowAnomalyList(!showAnomalyList)}
              className={`p-2 rounded-lg transition-all ${showAnomalyList ? 'bg-white/[0.08] text-[#F4EFE6]' : 'text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.05]'}`}
              title="Anomaly List"
            >
              <List className="w-5 h-5" />
            </button>
            <div className="w-6 h-px bg-white/10 mx-auto" />
            <button
              onClick={() => setShowGraticule(!showGraticule)}
              className={`p-2 rounded-lg transition-all ${showGraticule ? 'bg-white/[0.08] text-[#F4EFE6]' : 'text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.05]'}`}
              title="Toggle Grid"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={handleRecenter}
              className="p-2 text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.05] rounded-lg transition-all"
              title="Recenter on harbour"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Zoom Controls (bottom-right) ── */}
        <div className="absolute bottom-6 right-4 z-10 pointer-events-auto flex flex-col gap-1">
          <div className={`${glass} rounded-xl p-1 flex flex-col gap-0.5`}>
            <button onClick={handleZoomIn} className="p-2.5 text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded-lg transition-all" title="Zoom In">
              <Plus className="w-5 h-5" />
            </button>
            <div className="w-6 h-px bg-white/10 mx-auto" />
            <button onClick={handleZoomOut} className="p-2.5 text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded-lg transition-all" title="Zoom Out">
              <Minus className="w-5 h-5" />
            </button>
            <div className="w-6 h-px bg-white/10 mx-auto" />
            <button onClick={handleRecenter} className="p-2.5 text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded-lg transition-all" title="Recenter">
              <Compass className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Anomaly List Panel ── */}
        {showAnomalyList && (
          <div className="absolute top-16 right-16 bottom-20 w-72 z-20 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-[#020611]/95 backdrop-blur-3xl border border-white/10 border-t-white/[0.15] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] flex flex-col h-full overflow-hidden">
              <div className="px-4 py-3.5 border-b border-white/[0.07] flex justify-between items-center">
                <h3 className="text-[#F4EFE6] font-semibold text-xs uppercase tracking-[0.12em]">Anomalies ({filteredAnomalies.length})</h3>
                <button onClick={() => setShowAnomalyList(false)} className="text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredAnomalies.map(anomaly => (
                  <button
                    key={`list-${anomaly.id}`}
                    onClick={() => {
                      setSelectedAnomalyId(anomaly.id);
                      mapRef.current?.flyTo({ 
                        center: [anomaly.longitude, anomaly.latitude], 
                        zoom: 16, 
                        duration: 2000,
                        curve: 1.2,
                        essential: true 
                      });
                    }}
                    className={`w-full flex flex-col text-left p-3 rounded-xl border transition-all duration-200 ${
                      selectedAnomalyId === anomaly.id
                        ? 'bg-white/[0.06] border-[#E05763]/40'
                        : 'bg-transparent border-transparent hover:border-white/[0.07] hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[#F4EFE6] font-medium text-sm">{anomaly.label}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${severityBg(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8B9BB4] font-mono">
                      Score: {anomaly.overallScore} · Depth: {anomaly.depthMeters}m
                    </div>
                  </button>
                ))}
                {filteredAnomalies.length === 0 && (
                  <div className="text-center p-6 text-[#8B9BB4] text-sm">No anomalies match this filter.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Sonar Radar (bottom-left) ── */}
        <div className="absolute bottom-4 left-4 z-10 w-44 h-44 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-[#020611]/85 backdrop-blur-xl border border-[#45A796]/25 rounded-full relative overflow-hidden shadow-[0_0_24px_rgba(69,167,150,0.1)] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#45A796]/10 m-4" />
            <div className="absolute inset-0 rounded-full border border-[#45A796]/10 m-10" />
            <div className="absolute inset-0 rounded-full border border-[#45A796]/10 m-14" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-[#45A796]/15" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-[#45A796]/15" />
            {/* Sweep */}
            <div className="absolute inset-0 rounded-full origin-center animate-spin"
              style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(69,167,150,0.35) 100%)', animationDuration: '3s' }}
            >
              <div className="absolute top-0 right-1/2 w-[2px] h-1/2 bg-[#45A796] origin-bottom transform translate-x-1/2 opacity-60" />
            </div>
            {/* Blips */}
            {filteredAnomalies.map(a => (
              <div key={`radar-${a.id}`} ref={el => { radarBlipsRef.current[a.id] = el; }}
                className={`absolute w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor] transition-opacity duration-300 ${
                  a.severity === 'high' ? 'bg-[#E05763] text-[#E05763]' : a.severity === 'unusual' ? 'bg-[#E5B869] text-[#E5B869]' : 'bg-[#45A796] text-[#45A796]'
                }`}
                style={{ top: '50%', left: '50%', opacity: 0 }}
              />
            ))}
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-[8px] font-mono text-[#45A796] bg-[#020611]/90 px-1.5 rounded tracking-wider">LIVE RANGING</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ SELECTED ANOMALY PANEL ══════ */}
      {selectedAnomaly && (
        <div className="absolute top-4 right-4 bottom-4 w-full max-w-[400px] pointer-events-none z-20 hidden sm:flex flex-col">
          <div className="bg-[#020611]/92 backdrop-blur-3xl border border-white/10 border-t-white/[0.15] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] pointer-events-auto flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300">

            {/* Header */}
            <div className="p-6 border-b border-white/[0.07] flex flex-col gap-3 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-[#F4EFE6] tracking-tight mb-2">{selectedAnomaly.label}</h2>
                  <StatusBadge status={
                    selectedAnomaly.classification === 'unknown' ? 'unknown' :
                    selectedAnomaly.classification === 'known' ? 'known_object' : 'false_positive'
                  } />
                </div>
                <button onClick={() => setSelectedAnomalyId(null)}
                  className="p-1.5 text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedAnomaly.severity === 'high' && (
                <div className="flex items-center gap-1.5 text-[#E05763] bg-[#E05763]/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#E05763]/20 w-fit">
                  <AlertTriangle className="w-3 h-3" /> Immediate
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.07]">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8B9BB4] mb-1">Overall Score</div>
                  <div className="text-3xl font-bold text-[#F4EFE6] font-mono">{selectedAnomaly.overallScore}</div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-[#F4EFE6] h-full" style={{ width: `${selectedAnomaly.overallScore}%` }} />
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.07]">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8B9BB4] mb-1">Confidence</div>
                  <div className="text-3xl font-bold text-[#45A796] font-mono">{selectedAnomaly.confidence}%</div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-[#45A796] h-full" style={{ width: `${selectedAnomaly.confidence}%` }} />
                  </div>
                </div>
              </div>

              {/* Deviation bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[#8B9BB4] text-xs uppercase tracking-wider font-semibold"><Activity className="w-3.5 h-3.5" /> Spatial Deviation</span>
                    <span className="font-mono text-[#F4EFE6] text-xs">{selectedAnomaly.spatialDeviationScore}/100</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#E5B869] h-full transition-all" style={{ width: `${selectedAnomaly.spatialDeviationScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[#8B9BB4] text-xs uppercase tracking-wider font-semibold"><Clock className="w-3.5 h-3.5" /> Temporal Change</span>
                    <span className="font-mono text-[#F4EFE6] text-xs">{selectedAnomaly.temporalChangeScore}/100</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#E05763] h-full transition-all" style={{ width: `${selectedAnomaly.temporalChangeScore}%` }} />
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 border-t border-white/[0.05] pt-5">
                <div>
                  <div className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold mb-1">Depth</div>
                  <div className="text-[#F4EFE6] text-sm font-medium">{selectedAnomaly.depthMeters} m</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold mb-1">Detected</div>
                  <div className="text-[#F4EFE6] text-sm font-medium">{new Date(selectedAnomaly.detectedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold mb-1">Coordinates</div>
                  <div className="text-[#F4EFE6] font-mono text-sm flex items-center gap-2 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.07]">
                    <Navigation className="w-4 h-4 text-[#8B9BB4] shrink-0" />
                    {formatCoordinates(selectedAnomaly.latitude, selectedAnomaly.longitude)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/[0.07] flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <button onClick={() => setShowSonarModal(true)}
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-[#F4EFE6] text-sm font-medium py-2.5 rounded-xl transition-all border border-white/10">
                  View Sonar
                </button>
                <button onClick={() => setShowExplanationDrawer(true)}
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-[#F4EFE6] text-sm font-medium py-2.5 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#B993FF]" /> Explain
                </button>
              </div>
              <button onClick={() => navigate('/review')}
                className="w-full bg-[#1E6AFF]/90 hover:bg-[#1E6AFF] text-[#F4EFE6] text-sm font-semibold py-3 rounded-xl transition-all border border-[#1E6AFF]/60 shadow-[0_4px_20px_rgba(30,106,255,0.2)] flex items-center justify-center gap-2 mt-1">
                Review Anomaly <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ SONAR MODAL ══════ */}
      {showSonarModal && (
        <div className="absolute inset-0 z-50 bg-[#020611]/90 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 animate-in fade-in">
          <div className="bg-[#020611]/95 backdrop-blur-3xl border border-white/10 border-t-white/[0.15] rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
              <h3 className="font-semibold text-[#F4EFE6] flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-[#8B9BB4]" />
                Sonar Evidence — {selectedAnomaly?.label}
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-[#8B9BB4]">Compare baseline</span>
                  <div onClick={() => setIsCompareMode(!isCompareMode)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isCompareMode ? 'bg-[#45A796]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isCompareMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
                <button onClick={() => setShowSonarModal(false)} className="text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#000000] p-4 relative flex items-center justify-center">
              <div className="w-full h-full max-w-4xl max-h-full bg-[#020611] border border-white/10 relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(rgba(69,167,150,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(69,167,150,0.15) 1px, transparent 1px)',
                  backgroundSize: '30px 30px'
                }} />
                <div className={`absolute top-[20%] left-[30%] w-[50%] h-[60%] rounded-full opacity-15 bg-[radial-gradient(ellipse_at_center,_#E5B869_0%,_transparent_70%)] blur-[40px] transition-opacity duration-1000 ${isCompareMode ? 'opacity-5 grayscale' : ''}`} />
                <div className={`absolute top-[40%] left-[50%] w-[30%] h-[40%] rounded-full opacity-25 bg-[radial-gradient(ellipse_at_center,_#E05763_0%,_transparent_60%)] blur-[30px] transition-opacity duration-1000 ${isCompareMode ? 'opacity-0' : ''}`} />
                {isCompareMode && (
                  <div className="absolute top-4 left-4 bg-black/50 text-[#8B9BB4] px-3 py-1 text-xs font-mono border border-white/10 rounded backdrop-blur-sm animate-in fade-in">
                    BASELINE VIEW — ANOMALIES HIDDEN
                  </div>
                )}
                <div className="absolute -inset-full w-[300%] h-[300%] bg-gradient-to-b from-transparent via-[#45A796]/10 to-transparent animate-[scan_4s_ease-in-out_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] border border-[#45A796]/20 rounded-full animate-[spin_10s_linear_infinite]">
                    <div className="w-1.5 h-1.5 bg-[#45A796] rounded-full absolute -top-1 left-1/2 -translate-x-1/2" />
                    <div className="w-1.5 h-1.5 bg-[#45A796] rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
                  </div>
                  <div className="absolute w-[200px] h-[200px] md:w-[280px] md:h-[280px] border border-dashed border-[#E5B869]/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                  <div className="relative w-32 h-32 md:w-40 md:h-40 border border-[#E05763]/70 bg-[#E05763]/10 flex items-center justify-center animate-pulse">
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#E05763]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#E05763]" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#E05763]" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#E05763]" />
                    <div className="w-full h-[1px] bg-[#E05763]/30 absolute" />
                    <div className="h-full w-[1px] bg-[#E05763]/30 absolute" />
                    <span className="text-[#E05763] font-mono text-[9px] tracking-widest absolute -top-5 left-0 bg-[#020611] px-1 border border-[#E05763]/30">TARGET_LOCKED</span>
                    <span className="text-[#E05763] font-mono text-[9px] absolute -bottom-5 right-0 bg-[#020611] px-1 border border-[#E05763]/30">CONF: {selectedAnomaly?.confidence}%</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex flex-col items-end gap-0.5 font-mono text-[10px] text-[#45A796]/70">
                  <span>SYS_TIME: {new Date().toISOString().split('T')[1].slice(0, 8)} UTC</span>
                  <span>LAT: {formatLat(selectedAnomaly?.latitude || 0)}</span>
                  <span>LNG: {formatLng(selectedAnomaly?.longitude || 0)}</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-white/[0.07] flex justify-between text-[11px] text-[#8B9BB4] font-mono">
              <span>Transect: B_04</span>
              <span>Freq: 450 kHz</span>
              <span>Range: 50m</span>
              <span>{formatCoordinates(selectedAnomaly?.latitude || 0, selectedAnomaly?.longitude || 0, true)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════ EXPLANATION DRAWER ══════ */}
      {showExplanationDrawer && (
        <div className="absolute inset-0 z-50 flex justify-end animate-in fade-in bg-[#020611]/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#020611]/95 backdrop-blur-3xl border-l border-white/10 h-full shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right-full">
            <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#B993FF]" />
                <h3 className="font-semibold text-[#F4EFE6]">AI-Assisted Explanation</h3>
              </div>
              <button onClick={() => setShowExplanationDrawer(false)} className="text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] rounded p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-[#B993FF]/10 border border-[#B993FF]/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B993FF]" />
                <p className="text-[#F4EFE6] text-sm leading-relaxed">{selectedAnomaly?.explanation}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4EFE6] mb-4">Evidence Factors</h4>
                <div className="space-y-2.5">
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[#F4EFE6] font-medium">Geometric Regularity</span>
                      <span className="text-[10px] text-[#E05763] font-mono font-bold">HIGH</span>
                    </div>
                    <p className="text-xs text-[#8B9BB4]">Strong linear edges detected, unlike natural rock formations.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[#F4EFE6] font-medium">Acoustic Shadow</span>
                      <span className="text-[10px] text-[#E5B869] font-mono font-bold">MEDIUM</span>
                    </div>
                    <p className="text-xs text-[#8B9BB4]">Shadow length indicates an object height of ~2.5m above seabed.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/[0.07]">
              <button onClick={() => { setShowExplanationDrawer(false); navigate('/comparison'); }}
                className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#F4EFE6] text-sm font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <History className="w-4 h-4" /> View Temporal Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

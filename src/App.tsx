import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Map, History, FileCheck, Bell, User, Menu, X, Anchor } from 'lucide-react';
import Dashboard from './pages/Dashboard'; // trigger refresh
import UploadProcess from './pages/UploadProcess';
import MapWorkspace from './pages/MapWorkspace';
import TemporalComparison from './pages/TemporalComparison';
import ReviewReport from './pages/ReviewReport';
import Settings from './pages/Settings';
import { usePreferences } from './contexts/PreferencesContext';
import { useUser, UserProvider } from './contexts/UserContext';
import { subscribeToRealTimeAnomalies } from './services/api';
import { HARBOURS } from './data/mockData';
import type { Anomaly } from './data/mockData';
import { BootScreen } from './components/BootScreen';

import { HarbourContext, RealTimeAnomalyContext } from './contexts/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Survey', path: '/upload', icon: UploadCloud },
  { id: 'map', label: 'Baseline & Anomalies', path: '/map', icon: Map },
  { id: 'comparison', label: 'Temporal Comparison', path: '/comparison', icon: History },
  { id: 'review', label: 'Human Review', path: '/review', icon: FileCheck },
];

// Avatar component reused in header + sidebar
const AvatarBadge: React.FC<{ size?: 'sm' | 'md', showStatus?: boolean }> = ({ size = 'sm', showStatus = false }) => {
  const { profile } = useUser();
  const dim = size === 'md' ? 'w-12 h-12' : 'w-8 h-8';
  const iconDim = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className={`${dim} rounded-full bg-[#F4EFE6]/[0.06] flex items-center justify-center border border-white/10 overflow-hidden relative shrink-0`}>
      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
      ) : (
        <User className={`${iconDim} text-[#94A3B8]`} />
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#059669] border-2 border-[#0A192F]" />
      )}
    </div>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeHarbour, setActiveHarbour] = useState('Mumbai Harbor Q3');
  const [anomalyUpdates, setAnomalyUpdates] = useState<Record<string, Partial<Anomaly>>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = NAV_ITEMS.find(n => location.pathname.startsWith(n.path));
  const { formatCoordinates } = usePreferences();
  const { profile } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRealTimeAnomalies(
      activeHarbour,
      (id, updates) => {
        setAnomalyUpdates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
      },
      () => { }
    );
    return () => unsubscribe();
  }, [activeHarbour]);

  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <HarbourContext.Provider value={{ activeHarbour, setActiveHarbour }}>
      <RealTimeAnomalyContext.Provider value={anomalyUpdates}>
        {/* ── Root shell: Deep Water mesh gradient ── */}
        <div className="flex h-screen w-full overflow-hidden font-sans relative text-[#F4EFE6]"
          style={{ background: 'radial-gradient(ellipse at top right, #0A192F 0%, #020611 55%, #000000 100%)' }}>

          {/* Ambient glow orbs behind everything */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#1E40AF]/10 blur-3xl" />
            <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] rounded-full bg-[#059669]/8 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-[#1E40AF]/6 blur-3xl" />
          </div>

          {/* Mobile overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* ══ SIDEBAR ══ */}
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-[260px]
            bg-[#F4EFE6]/[0.02] backdrop-blur-3xl
            border-r border-white/10
            shadow-[8px_0_32px_0_rgba(0,0,0,0.6)]
            transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
            flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1E40AF]/30 border border-[#1E40AF]/50 flex items-center justify-center shadow-[0_0_20px_rgba(30,64,175,0.3)]">
                  <Anchor className="w-5 h-5 text-[#60A5FA]" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-sm tracking-[0.15em] uppercase text-[#F4EFE6]">S.A.G.A.R.</span>
                  <span className="text-[9px] text-[#8B9BB4] tracking-[0.1em] uppercase font-medium">Command</span>
                </div>
              </div>
              <button className="md:hidden text-[#94A3B8] hover:text-[#F4EFE6]" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group
                      ${isActive
                        ? 'bg-[#1E40AF]/25 text-[#60A5FA] border border-[#1E40AF]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                        : 'text-[#8B9BB4] hover:bg-white/[0.04] hover:text-[#F4EFE6] border border-transparent'
                      }
                    `}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#60A5FA]' : 'text-[#8B9BB4] group-hover:text-[#F4EFE6]'}`} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Active sector card */}
            <div className="p-3 border-t border-white/[0.07]">
              <div className="bg-white/[0.03] border border-white/10 border-t-white/20 border-l-white/20 rounded-xl p-4 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group hover:bg-white/[0.05] transition-all duration-300 ease-out cursor-pointer relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] font-mono uppercase tracking-wider font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                    Active Sector
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8]"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={activeHarbour}
                  onChange={(e) => setActiveHarbour(e.target.value)}
                >
                  {Object.keys(HARBOURS).map((harbour) => (
                    <option key={harbour} value={harbour}>{harbour}</option>
                  ))}
                </select>
                <div className="text-sm font-bold text-[#F4EFE6] tracking-wide uppercase">{activeHarbour}</div>
                <div className="text-[10px] text-[#45A796] mt-1 mb-2 font-mono">{formatCoordinates(HARBOURS[activeHarbour].lat, HARBOURS[activeHarbour].lng)}</div>
                <div className="text-[11px] text-[#8B9BB4] truncate font-medium">surv_001 · R/V Samudra Shakti</div>
              </div>
            </div>
          </aside>

          {/* ══ MAIN CONTENT ══ */}
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
            {/* ── Top Header ── */}
            <header className="h-16 shrink-0 bg-white/[0.02] backdrop-blur-3xl border-b border-white/[0.07] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex items-center justify-between px-4 lg:px-6 z-30">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 -ml-2 text-[#94A3B8] hover:text-[#F4EFE6] rounded-xl hover:bg-white/[0.06] transition-colors"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col leading-tight">
                  <h1 className="text-base font-semibold text-[#F4EFE6] tracking-[0.08em] uppercase">
                    {currentNav?.label || 'S.A.G.A.R. Command'}
                  </h1>
                  <span className="text-[10px] text-[#8B9BB4] tracking-wider font-mono uppercase">Seabed Anomaly Grid & Analysis Repository</span>
                </div>
              </div>

              <div className="flex items-center gap-3 relative" ref={menuRef}>
                {/* Live clock */}
                <div className="hidden lg:flex items-center text-[11px] font-mono text-[#45A796] border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 rounded-lg backdrop-blur-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669] mr-2 animate-pulse" />
                  {time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })} IST
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    className="relative p-2 text-[#94A3B8] hover:text-[#F4EFE6] rounded-xl hover:bg-white/[0.06] transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E05763] border-2 border-[#020611]" />
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A192F]/95 backdrop-blur-3xl border border-white/10 border-t-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-3.5 border-b border-white/[0.07]">
                        <h3 className="font-semibold text-[#F4EFE6] text-sm tracking-wider uppercase">Notifications</h3>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.05]">
                        <div className="p-4 hover:bg-white/[0.04] transition-colors">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#E05763] mt-1.5 shrink-0" />
                            <div>
                              <p className="text-sm text-[#F4EFE6] leading-snug">New high-priority anomaly detected in Sector 7A.</p>
                              <p className="text-xs text-[#8B9BB4] mt-1">2 mins ago · Mumbai Harbor Q3</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-white/[0.04] transition-colors">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#45A796] mt-1.5 shrink-0" />
                            <div>
                              <p className="text-sm text-[#F4EFE6] leading-snug">Survey 'Mumbai Harbor Q3' processing complete.</p>
                              <p className="text-xs text-[#8B9BB4] mt-1">1 hr ago · System</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-white/[0.04] transition-colors">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#E5B869] mt-1.5 shrink-0" />
                            <div>
                              <p className="text-sm text-[#F4EFE6] leading-snug">Model v1.1 retraining scheduled for 03:00 IST.</p>
                              <p className="text-xs text-[#8B9BB4] mt-1">3 hrs ago · AI Pipeline</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-white/10 hidden sm:block" />

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    className="flex items-center gap-2.5 text-sm font-medium text-[#F4EFE6] hover:bg-white/[0.06] px-2 py-1.5 rounded-xl transition-colors"
                  >
                    <AvatarBadge size="sm" showStatus />
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-[#F4EFE6] text-sm font-medium">{profile.fullName}</span>
                      <span className="text-[10px] text-[#8B9BB4] font-mono">{profile.role}</span>
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0A192F]/95 backdrop-blur-3xl border border-white/10 border-t-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Profile header */}
                      <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-3">
                        <AvatarBadge size="md" showStatus />
                        <div>
                          <div className="text-sm font-semibold text-[#F4EFE6]">{profile.fullName}</div>
                          <div className="text-xs text-[#8B9BB4] mt-0.5">{profile.email}</div>
                        </div>
                      </div>
                      <div className="py-1">
                        <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] transition-colors">Profile Settings</button>
                        <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.06] transition-colors">Preferences</button>
                      </div>
                      <div className="h-px bg-white/[0.07] mx-3" />
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2.5 text-sm text-[#E05763] hover:bg-white/[0.06] transition-colors font-medium">Sign Out</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Page content */}
            <div className="flex-1 overflow-auto bg-transparent">
              <div className="p-4 lg:p-8 mx-auto max-w-[1600px] h-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </RealTimeAnomalyContext.Provider>
    </HarbourContext.Provider>
  );
};

export default function App() {
  const [booting, setBooting] = useState(true);

  return (
    <UserProvider>
      {booting && <BootScreen onComplete={() => setBooting(false)} />}
      <Router>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadProcess />} />
            <Route path="/map" element={<MapWorkspace />} />
            <Route path="/comparison" element={<TemporalComparison />} />
            <Route path="/review" element={<ReviewReport />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </Router>
    </UserProvider>
  );
}

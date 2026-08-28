import React, { useState, useRef } from 'react';
import { User, Settings as SettingsIcon, Bell, Shield, CheckCircle, Camera, Anchor, Lock } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useUser } from '../contexts/UserContext';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer shrink-0">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full border border-white/10 peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-[#8B9BB4] peer-checked:after:bg-[#F4EFE6] after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-[#1E40AF]/60 peer-checked:border-[#1E40AF]/80" />
  </label>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white/[0.03] border border-white/10 border-t-white/[0.15] border-l-white/[0.15] rounded-xl backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ${className}`}>
    {children}
  </div>
);

const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.05]">
    <div>
      <h4 className="text-sm font-medium text-[#F4EFE6]">{label}</h4>
      <p className="text-xs text-[#8B9BB4] mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

export default function Settings() {
  const { coordFormat, setCoordFormat } = usePreferences();
  const { profile, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state for profile (mirrors global but lets user edit without instant update)
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);

  // Preferences
  const [workspace, setWorkspace] = useState('Dashboard');

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [notifyWeekly, setNotifyWeekly] = useState(true);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Avatar changes are immediate — update global context as soon as file is chosen
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        updateProfile({ avatarUrl: url }); // instant global update → header updates NOW
        showToast('Avatar updated successfully!');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    updateProfile({ fullName, email });
    showToast('Changes have been successfully saved!');
  };

  const TABS = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  const selectClass = "bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#F4EFE6] focus:outline-none focus:border-[#1E40AF]/80 backdrop-blur-xl cursor-pointer";
  const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[#F4EFE6] focus:outline-none focus:border-[#1E40AF]/80 focus:ring-1 focus:ring-[#1E40AF]/40 transition-all placeholder-[#8B9BB4]/50 backdrop-blur-xl";

  return (
    <div className="flex h-full flex-col md:flex-row gap-6 max-w-6xl mx-auto relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-[#0A192F]/95 backdrop-blur-3xl border border-[#45A796]/40 text-[#F4EFE6] px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-[100]">
          <CheckCircle className="w-5 h-5 text-[#45A796] shrink-0" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Nav */}
      <div className="w-full md:w-64 shrink-0">
        <div className="flex items-center gap-3 px-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#1E40AF]/25 border border-[#1E40AF]/40 flex items-center justify-center">
            <Anchor className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F4EFE6] tracking-wider uppercase leading-none">Settings</h2>
            <p className="text-[10px] text-[#8B9BB4] font-mono mt-0.5">S.A.G.A.R. Command</p>
          </div>
        </div>
        <div className="space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium border ${
                activeTab === tab.id
                  ? 'bg-[#1E40AF]/25 text-[#60A5FA] border-[#1E40AF]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-[#8B9BB4] hover:text-[#F4EFE6] hover:bg-white/[0.04] border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <GlassCard className="flex-1 p-6 flex flex-col min-h-0">

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="space-y-7 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-[#F4EFE6] tracking-wider uppercase mb-0.5">Profile Settings</h3>
              <p className="text-xs text-[#8B9BB4]">Your identity across the S.A.G.A.R. Command platform.</p>
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-6 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.07]">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 rounded-2xl bg-white/[0.06] overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-[0_0_20px_rgba(30,64,175,0.2)]">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-9 h-9 text-[#8B9BB4]" />
                  )}
                </div>
                {/* hover overlay */}
                <div className="absolute inset-0 bg-[#020611]/70 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Camera className="w-6 h-6 text-[#F4EFE6]" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F4EFE6]">{profile.fullName}</p>
                <p className="text-xs text-[#8B9BB4] mt-1">{profile.role} · {profile.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 bg-[#1E40AF]/30 hover:bg-[#1E40AF]/50 text-[#60A5FA] text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-[#1E40AF]/40 hover:border-[#1E40AF]/70"
                >
                  Change Avatar
                </button>
                <p className="text-[10px] text-[#8B9BB4] mt-2 opacity-70">Changes appear everywhere instantly.</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Enter your name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="Enter your email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold">Role</label>
                <input type="text" value={profile.role} readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold">Organisation</label>
                <input type="text" defaultValue="S.A.G.A.R. Command — INS" readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {activeTab === 'preferences' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-[#F4EFE6] tracking-wider uppercase mb-0.5">Preferences</h3>
              <p className="text-xs text-[#8B9BB4]">Customise your workspace experience.</p>
            </div>
            <div className="space-y-2">
              <SettingRow label="Default Workspace" description="Choose which screen loads first when you log in">
                <select value={workspace} onChange={e => setWorkspace(e.target.value)} className={selectClass}>
                  <option>Dashboard</option>
                  <option>Map Workspace</option>
                  <option>Human Review</option>
                </select>
              </SettingRow>
              <SettingRow label="Coordinate Format" description="Display format for latitude and longitude across the platform">
                <select value={coordFormat} onChange={e => setCoordFormat(e.target.value as 'DD' | 'DMS')} className={selectClass}>
                  <option value="DD">Decimal Degrees (DD)</option>
                  <option value="DMS">Degrees Minutes Seconds (DMS)</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-[#F4EFE6] tracking-wider uppercase mb-0.5">Notifications</h3>
              <p className="text-xs text-[#8B9BB4]">Control how and when you receive alerts.</p>
            </div>
            <div className="space-y-2">
              <SettingRow label="Email Alerts" description="Receive email alerts for new high-severity anomalies">
                <ToggleSwitch checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
              </SettingRow>
              <SettingRow label="Push Notifications" description="Get desktop notifications for active sector updates">
                <ToggleSwitch checked={notifyPush} onChange={() => setNotifyPush(!notifyPush)} />
              </SettingRow>
              <SettingRow label="Weekly Summary Reports" description="Receive a weekly digest of anomaly scans and metrics">
                <ToggleSwitch checked={notifyWeekly} onChange={() => setNotifyWeekly(!notifyWeekly)} />
              </SettingRow>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-[#F4EFE6] tracking-wider uppercase mb-0.5">Security & Privacy</h3>
              <p className="text-xs text-[#8B9BB4]">Manage your account security settings.</p>
            </div>
            <div className="space-y-2">
              <SettingRow label="Change Password" description="Update your account password">
                <button className="bg-white/[0.06] hover:bg-[#1E40AF]/40 text-[#F4EFE6] text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-white/10 hover:border-[#1E40AF]/50 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Update
                </button>
              </SettingRow>
              <SettingRow label="Two-Factor Authentication (2FA)" description="Add an extra layer of security to your account">
                <ToggleSwitch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
              </SettingRow>
              <SettingRow label="Session Timeout" description="Automatically log out after inactivity">
                <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className={selectClass}>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>Never</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="mt-auto pt-6 border-t border-white/[0.07] flex justify-end">
          <button
            onClick={handleSave}
            className="bg-[#1E6AFF]/90 hover:bg-[#1E6AFF] text-[#F4EFE6] font-bold text-sm px-7 py-2.5 rounded-xl transition-all border border-[#1E6AFF]/60 hover:border-[#1E6AFF] shadow-[0_4px_20px_rgba(30,106,255,0.25)]"
          >
            Save Changes
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

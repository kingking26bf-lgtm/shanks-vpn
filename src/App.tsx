/**
 * SHANKS VPN - Android Main Application
 * 
 * Features:
 * - Real Android VpnService Bridge & honest runtime reporting
 * - Light Mode (white background, black text, electric blue accents) & Dark Mode
 * - Expiration blocking & remaining time displays
 * - Native Android share sheet ("Exporter") with privacy protection
 * - Web Audio API synthesized connection & failure sound effects
 * - Real measured traffic statistics & hardware installation ID
 * - VLESS, VMess, Trojan, SlowDNS, .hc, .ehi, .hat, .dark, .npv, .ssc
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  VpnProfile, 
  ConnectionState, 
  ConnectionStats, 
  ConnectionLogEntry, 
  ConnectionSession, 
  AppSettings 
} from './types/vpn';
import { 
  getStoredProfiles, 
  saveStoredProfiles, 
  getStoredSelectedId, 
  saveStoredSelectedId, 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredHistory, 
  addStoredSession, 
  clearStoredHistory,
  isProfileExpired
} from './services/storage/vpnStorage';
import { vpnBridge } from './services/vpn/AndroidVpnBridge';
import { playConnectSuccess, playConnectFailure } from './services/audio/soundEffects';
import { LANDSCAPE_WALLPAPERS } from './services/wallpaper/wallpaperList';

// Layout & Modals
import { AndroidStatusBar } from './components/layout/AndroidStatusBar';
import { BottomTabBar, NavTabId } from './components/layout/BottomTabBar';
import { VpnStatusModal } from './components/modals/VpnStatusModal';

// Tabs
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ImportTab } from './components/import/ImportTab';
import { ServersTab } from './components/servers/ServersTab';
import { HistoryTab } from './components/history/HistoryTab';
import { SettingsTab } from './components/settings/SettingsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [profiles, setProfiles] = useState<VpnProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [stats, setStats] = useState<ConnectionStats>({
    uploadSpeed: 0,
    downloadSpeed: 0,
    totalUpload: 0,
    totalDownload: 0,
    duration: 0,
    currentIp: '185.220.101.5',
    assignedVpnIp: '10.8.0.2',
    realPublicIp: null,
    ping: 42,
    dnsResolver: '1.1.1.1 (Cloudflare)',
    speedHistory: [],
  });
  const [logs, setLogs] = useState<ConnectionLogEntry[]>([]);
  const [sessions, setSessions] = useState<ConnectionSession[]>([]);
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeSessionRef = useRef<{ startTime: number; profile: VpnProfile } | null>(null);

  // Initialize stored data
  useEffect(() => {
    const loadedProfiles = getStoredProfiles();
    setProfiles(loadedProfiles);

    const loadedId = getStoredSelectedId();
    if (loadedProfiles.some(p => p.id === loadedId)) {
      setSelectedProfileId(loadedId);
    } else if (loadedProfiles.length > 0) {
      setSelectedProfileId(loadedProfiles[0].id);
    }

    setSessions(getStoredHistory());
  }, []);

  // Handle Light / Dark Theme toggle dynamically on HTML root
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // Listen to VPN Bridge telemetry and logs
  useEffect(() => {
    const removeListener = vpnBridge.addListener({
      onStateChange: (newState) => {
        setConnectionState(newState);

        if (newState === 'CONNECTED') {
          // Play discreet connect sound if enabled
          playConnectSuccess(settings.soundEffectsEnabled);
          showToast('Tunnel SHANKS connecté');
        } else if (newState === 'ERROR') {
          // Play discreet failure sound if enabled
          playConnectFailure(settings.soundEffectsEnabled);
          showToast('Échec de connexion du tunnel');
        }
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onLog: (entry) => {
        setLogs(prev => [entry, ...prev].slice(0, 100));
      },
    });

    return () => removeListener();
  }, [settings.soundEffectsEnabled]);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || null;

  // Connect Handler with Expiration check & sound trigger
  const handleConnect = async () => {
    if (!selectedProfile) {
      showToast('Veuillez sélectionner un profil VPN');
      return;
    }

    // STRICT EXPIRATION CHECK: Block connection if expired!
    if (isProfileExpired(selectedProfile)) {
      playConnectFailure(settings.soundEffectsEnabled);
      showToast('Profil expiré : Impossible d\'établir la connexion. Veuillez le renouveler.');
      return;
    }

    activeSessionRef.current = {
      startTime: Date.now(),
      profile: selectedProfile,
    };

    const success = await vpnBridge.connect(selectedProfile);
    if (!success) {
      playConnectFailure(settings.soundEffectsEnabled);
    }
  };

  const handleDisconnect = () => {
    if (activeSessionRef.current) {
      const duration = Math.max(1, Math.round((Date.now() - activeSessionRef.current.startTime) / 1000));
      const sessionRecord: ConnectionSession = {
        id: 'sess_' + Date.now(),
        profileId: activeSessionRef.current.profile.id,
        profileName: activeSessionRef.current.profile.name,
        protocol: activeSessionRef.current.profile.protocol,
        startTime: activeSessionRef.current.startTime,
        endTime: Date.now(),
        duration,
        totalUpload: stats.totalUpload,
        totalDownload: stats.totalDownload,
        server: activeSessionRef.current.profile.server,
        status: 'COMPLETED',
      };
      addStoredSession(sessionRecord);
      setSessions(getStoredHistory());
      activeSessionRef.current = null;
    }

    vpnBridge.disconnect();
    showToast('Tunnel déconnecté');
  };

  // Profile Management
  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    saveStoredSelectedId(id);
    const p = profiles.find(item => item.id === id);
    if (p) {
      showToast(`Profil sélectionné : ${p.name}`);
    }
  };

  const handleAddProfile = (newProfile: VpnProfile) => {
    const updated = [newProfile, ...profiles];
    setProfiles(updated);
    saveStoredProfiles(updated);
    setSelectedProfileId(newProfile.id);
    saveStoredSelectedId(newProfile.id);
  };

  const handleBatchAddProfiles = (newProfiles: VpnProfile[]) => {
    const updated = [...newProfiles, ...profiles];
    setProfiles(updated);
    saveStoredProfiles(updated);
    if (newProfiles.length > 0) {
      setSelectedProfileId(newProfiles[0].id);
      saveStoredSelectedId(newProfiles[0].id);
    }
  };

  const handleUpdateProfile = (updatedProfile: VpnProfile) => {
    const updated = profiles.map(p => (p.id === updatedProfile.id ? updatedProfile : p));
    setProfiles(updated);
    saveStoredProfiles(updated);
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    saveStoredProfiles(updated);
    if (selectedProfileId === id && updated.length > 0) {
      setSelectedProfileId(updated[0].id);
      saveStoredSelectedId(updated[0].id);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Find active landscape wallpaper
  const activeWallpaper = LANDSCAPE_WALLPAPERS.find(w => w.id === settings.wallpaper.wallpaperId) || LANDSCAPE_WALLPAPERS[0];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Background wallpaper layer */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: activeWallpaper.cssBackground,
          opacity: settings.themeMode === 'light' ? 0.08 : 0.95,
        }}
      />

      {/* Android Mobile Shell Wrapper (Framed on large screens, native full-screen on mobile) */}
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col bg-slate-50/90 dark:bg-slate-950/90 shadow-2xl overflow-hidden border-x border-slate-200/60 dark:border-slate-800/60">
        
        {/* Top Status Bar & Branding */}
        <AndroidStatusBar
          connectionState={connectionState}
          onOpenTransparencyModal={() => setShowTransparencyModal(true)}
        />

        {/* Tab View Container */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <DashboardTab
              selectedProfile={selectedProfile}
              connectionState={connectionState}
              stats={stats}
              settings={settings}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onNavigateToServers={() => setActiveTab('servers')}
              onNavigateToImport={() => setActiveTab('import')}
            />
          )}

          {activeTab === 'import' && (
            <ImportTab
              onProfileAdded={handleAddProfile}
              onProfilesBatchAdded={handleBatchAddProfiles}
              onToast={showToast}
            />
          )}

          {activeTab === 'servers' && (
            <ServersTab
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelectProfile={handleSelectProfile}
              onUpdateProfile={handleUpdateProfile}
              onDeleteProfile={handleDeleteProfile}
              onToast={showToast}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              sessions={sessions}
              logs={logs}
              onClearHistory={() => {
                clearStoredHistory();
                setSessions([]);
              }}
              onClearLogs={() => setLogs([])}
              onToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onToast={showToast}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isConnected={connectionState === 'CONNECTED'}
          profilesCount={profiles.length}
        />
      </div>

      {/* Transparency & Android VpnService Modal */}
      {showTransparencyModal && (
        <VpnStatusModal
          onClose={() => setShowTransparencyModal(false)}
          onToast={showToast}
        />
      )}

      {/* Floating Toast Pill */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700 shadow-2xl text-xs font-semibold backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 text-center max-w-xs">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

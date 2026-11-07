/**
 * SHANKS VPN - Settings Tab
 * 
 * Includes:
 * 1. « Statistiques et identification » (New section requested):
 *    - Real measured consumption: Download (MB & GB), Upload (MB & GB), Total Consumed
 *    - Daily & Monthly breakdown with consumption chart (Recharts)
 *    - Reset statistics button with modal confirmation
 *    - Hardware ID (Device installation UUID, privacy-first: no IMEI/MAC/serial)
 *    - Copy ID & Reset ID with confirmation
 * 2. Theme: MODE CLAIR (white background, black text, electric blue accents) vs MODE SOMBRE
 * 3. Sound Effects: Toggle discreet audio for connection success and failure
 * 4. Landscape Wallpapers: Midnight Aurora, Alpine Mountains, Cyber Lake, Celestial Forest
 * 5. Security & Network: Kill Switch, DNS DoH, MTU, Split Tunneling
 */

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Fingerprint, 
  BarChart3, 
  RotateCcw, 
  Copy, 
  Check, 
  ShieldAlert, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  HardDrive, 
  Sliders, 
  Globe2, 
  Image as ImageIcon,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { AppSettings, CumulativeTrafficStats, DeviceIdentity } from '../../types/vpn';
import { 
  getStoredTrafficStats, 
  resetTrafficStats, 
  getStoredDeviceIdentity, 
  resetDeviceIdentity 
} from '../../services/storage/vpnStorage';
import { LANDSCAPE_WALLPAPERS } from '../../services/wallpaper/wallpaperList';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onToast: (msg: string) => void;
}

export function SettingsTab({ settings, onUpdateSettings, onToast }: SettingsTabProps) {
  // Real measured traffic stats from storage
  const [trafficStats, setTrafficStats] = useState<CumulativeTrafficStats>(getStoredTrafficStats());
  const [deviceIdentity, setDeviceIdentity] = useState<DeviceIdentity>(getStoredDeviceIdentity());

  // Chart view mode: Daily or Monthly
  const [chartMode, setChartMode] = useState<'daily' | 'monthly'>('daily');

  // Confirmation modals
  const [showResetTrafficConfirm, setShowResetTrafficConfirm] = useState(false);
  const [showResetIdConfirm, setShowResetIdConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Sync traffic stats on mount or interval
  useEffect(() => {
    const sync = () => {
      setTrafficStats(getStoredTrafficStats());
    };
    sync();
    const interval = setInterval(sync, 1500);
    return () => clearInterval(interval);
  }, []);

  // Format helpers for MB & GB
  const formatMB = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
  };

  const formatGB = (bytes: number): string => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(3) + ' Go';
  };

  const totalBytes = trafficStats.totalDownloadBytes + trafficStats.totalUploadBytes;

  // Prepare chart data for Daily or Monthly
  const getChartData = () => {
    if (chartMode === 'daily') {
      const keys = Object.keys(trafficStats.dailyStats).sort();
      // If empty or few, provide recent days
      if (keys.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0].substring(5);
        return [{ name: todayStr, downloadMB: 0, uploadMB: 0 }];
      }
      return keys.slice(-7).map((dateKey) => {
        const item = trafficStats.dailyStats[dateKey];
        // Shorten label to MM-DD
        const shortDate = dateKey.substring(5);
        return {
          name: shortDate,
          downloadMB: parseFloat((item.downloadBytes / (1024 * 1024)).toFixed(1)),
          uploadMB: parseFloat((item.uploadBytes / (1024 * 1024)).toFixed(1)),
        };
      });
    } else {
      const keys = Object.keys(trafficStats.monthlyStats).sort();
      if (keys.length === 0) {
        const thisMonth = new Date().toISOString().substring(0, 7);
        return [{ name: thisMonth, downloadMB: 0, uploadMB: 0 }];
      }
      return keys.slice(-6).map((monthKey) => {
        const item = trafficStats.monthlyStats[monthKey];
        return {
          name: monthKey,
          downloadMB: parseFloat((item.downloadBytes / (1024 * 1024)).toFixed(1)),
          uploadMB: parseFloat((item.uploadBytes / (1024 * 1024)).toFixed(1)),
        };
      });
    }
  };

  const chartData = getChartData();

  // Reset Traffic
  const handleConfirmResetTraffic = () => {
    const fresh = resetTrafficStats();
    setTrafficStats(fresh);
    setShowResetTrafficConfirm(false);
    onToast('Statistiques de consommation remises à zéro');
  };

  // Copy Hardware ID
  const handleCopyId = () => {
    try {
      navigator.clipboard.writeText(deviceIdentity.installationId);
      setCopiedId(true);
      onToast('ID matériel copié dans le presse-papiers');
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      onToast('Erreur lors de la copie');
    }
  };

  // Reset Hardware ID
  const handleConfirmResetId = () => {
    const fresh = resetDeviceIdentity();
    setDeviceIdentity(fresh);
    setShowResetIdConfirm(false);
    onToast('Nouvel ID matériel généré');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 max-w-md mx-auto w-full select-none">
      {/* ========================================================================= */}
      {/* 1. NOUVELLE RUBRIQUE : STATISTIQUES ET IDENTIFICATION                      */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-xl bg-blue-500/15 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Statistiques et identification
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Mesures réelles du trafic et empreinte d'installation
            </p>
          </div>
        </div>

        {/* Total Consumed Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 text-white border border-blue-400/30 dark:border-cyan-500/30 shadow-xl shadow-blue-500/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 dark:text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-300" />
              Volume Total Consommé
            </span>
            <button
              onClick={() => setShowResetTrafficConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-white transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Remise à zéro</span>
            </button>
          </div>

          <div>
            <div className="text-2xl font-mono font-black tracking-tight">
              {formatGB(totalBytes)}
            </div>
            <div className="text-xs font-mono text-cyan-200 dark:text-cyan-400">
              Soit {formatMB(totalBytes)}
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 dark:border-slate-800 text-[10px] text-blue-100 dark:text-slate-400 flex items-center justify-between">
            <span>Depuis le : {new Date(trafficStats.lastResetTimestamp).toLocaleDateString()}</span>
            <span>Trafic réel mesuré</span>
          </div>
        </div>

        {/* Download & Upload Modern Split Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Download Card */}
          <div className="p-3.5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 text-xs font-bold">
              <ArrowDownCircle className="w-4 h-4" />
              <span>Téléchargement</span>
            </div>
            <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
              {formatMB(trafficStats.totalDownloadBytes)}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {formatGB(trafficStats.totalDownloadBytes)}
            </div>
          </div>

          {/* Upload Card */}
          <div className="p-3.5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <ArrowUpCircle className="w-4 h-4" />
              <span>Envoi (Upload)</span>
            </div>
            <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
              {formatMB(trafficStats.totalUploadBytes)}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {formatGB(trafficStats.totalUploadBytes)}
            </div>
          </div>
        </div>

        {/* Modern Consumption Chart (Daily / Monthly) */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Historique de Consommation</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setChartMode('daily')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  chartMode === 'daily'
                    ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Quotidien
              </button>
              <button
                onClick={() => setChartMode('monthly')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  chartMode === 'monthly'
                    ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Mensuel
              </button>
            </div>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} unit="M" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-[10px] font-mono text-white space-y-0.5">
                          <div className="text-cyan-300">DL: {payload[0]?.value} Mo</div>
                          <div className="text-emerald-300">UL: {payload[1]?.value} Mo</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="downloadMB" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="uploadMB" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-500"></span> Download (Mo)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Upload (Mo)
            </span>
          </div>
        </div>

        {/* IDENTIFICATION DE L'APPAREIL (ID Matériel) */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">ID matériel</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Identifiant unique d'installation</p>
              </div>
            </div>

            <button
              onClick={() => setShowResetIdConfirm(true)}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {/* ID string with copy button */}
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={deviceIdentity.installationId}
              className="w-full p-2.5 pr-20 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-800 dark:text-cyan-400 select-all"
            />
            <button
              onClick={handleCopyId}
              className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-blue-600 dark:bg-cyan-500 hover:opacity-90 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'Copié' : 'Copier'}</span>
            </button>
          </div>

          {/* Privacy badge confirming NO IMEI / MAC collection */}
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Confidentialité garantie :</strong> Cet identifiant est généré de manière aléatoire localement. Aucun IMEI, numéro de série ou adresse MAC n'est collecté.
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THÈME (MODE CLAIR VS MODE SOMBRE)                                      */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white px-1 uppercase tracking-wider">
          Apparence & Thème
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* MODE CLAIR (fond blanc, texte noir, accents bleu électrique) */}
          <button
            onClick={() => onUpdateSettings({ ...settings, themeMode: 'light' })}
            className={`p-3.5 rounded-3xl border text-left transition-all relative overflow-hidden ${
              settings.themeMode === 'light'
                ? 'bg-white text-slate-950 border-blue-600 ring-2 ring-blue-500/30 shadow-lg'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Sun className="w-4 h-4" />
              </div>
              {settings.themeMode === 'light' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="font-bold text-xs text-slate-950">Mode Clair</div>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              Fond blanc, texte noir, accents bleu électrique
            </p>
          </button>

          {/* MODE SOMBRE */}
          <button
            onClick={() => onUpdateSettings({ ...settings, themeMode: 'dark' })}
            className={`p-3.5 rounded-3xl border text-left transition-all relative overflow-hidden ${
              settings.themeMode === 'dark'
                ? 'bg-slate-900 text-white border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center border border-slate-700">
                <Moon className="w-4 h-4" />
              </div>
              {settings.themeMode === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="font-bold text-xs text-white">Mode Sombre</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              Bleu nuit profond, accents cyan électriques
            </p>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SONS DE CONNEXION                                                      */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white px-1 uppercase tracking-wider">
          Effets Sonores
        </h2>

        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
              {settings.soundEffectsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Sons de connexion
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Bip discret à l'établissement du tunnel ou en cas d'échec
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundEffectsEnabled}
              onChange={(e) => {
                onUpdateSettings({ ...settings, soundEffectsEnabled: e.target.checked });
                onToast(e.target.checked ? 'Sons activés' : 'Sons désactivés');
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600 dark:peer-checked:bg-cyan-500"></div>
          </label>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FONDS D'ÉCRAN PAYSAGES                                                  */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white px-1 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Fonds Paysages</span>
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {LANDSCAPE_WALLPAPERS.map((wp) => {
            const isSelected = settings.wallpaper.wallpaperId === wp.id;
            return (
              <button
                key={wp.id}
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    wallpaper: { ...settings.wallpaper, wallpaperId: wp.id },
                  });
                  onToast(`Fond sélectionné : ${wp.name}`);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 dark:border-cyan-400 ring-2 ring-blue-500/30 dark:ring-cyan-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300'
                }`}
              >
                <div 
                  className="w-full h-12 rounded-xl mb-2 border border-slate-700/50 relative overflow-hidden"
                  style={{ background: wp.previewGradient }}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                  {wp.name}
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                  {wp.category}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. RÉSEAU & SÉCURITÉ                                                       */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white px-1 uppercase tracking-wider">
          Sécurité & Tunneling
        </h2>

        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-4">
          {/* Kill Switch */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Kill Switch Android</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Coupe le trafic si le tunnel VPN est interrompu</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.killSwitch}
                onChange={(e) => onUpdateSettings({ ...settings, killSwitch: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600 dark:peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* DNS Provider */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Résolveur DNS Sécurisé</span>
              <span className="font-mono text-[11px] text-blue-600 dark:text-cyan-400">{settings.customDns}</span>
            </div>
            <select
              value={settings.dnsType}
              onChange={(e: any) => {
                const type = e.target.value;
                let dns = '1.1.1.1';
                if (type === 'Google') dns = '8.8.8.8';
                if (type === 'AdGuard') dns = '94.140.14.14';
                if (type === 'Quad9') dns = '9.9.9.9';
                onUpdateSettings({ ...settings, dnsType: type, customDns: dns });
              }}
              className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="Cloudflare">Cloudflare (1.1.1.1)</option>
              <option value="Google">Google Public DNS (8.8.8.8)</option>
              <option value="AdGuard">AdGuard Bloqueur de Pubs (94.140.14.14)</option>
              <option value="Quad9">Quad9 Protection Malware (9.9.9.9)</option>
            </select>
          </div>
        </div>
      </section>

      {/* CONFIRMATION MODAL: RESET TRAFFIC */}
      {showResetTrafficConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Réinitialiser les Statistiques ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Les compteurs totaux, quotidiens et mensuels seront remis à 0 Mo. Cette action est irréversible.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowResetTrafficConfirm(false)}
                className="py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmResetTraffic}
                className="py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET ID */}
      {showResetIdConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Régénérer l'ID Matériel ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Un nouvel identifiant anonyme d'installation sera généré pour votre appareil.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowResetIdConfirm(false)}
                className="py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmResetId}
                className="py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              >
                Régénérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Required Signature: « Créé par FANKANI..SHANKS » */}
      <footer className="pt-4 pb-2 text-center select-none">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
          Créé par <span className="font-bold text-blue-600 dark:text-cyan-400">FANKANI..SHANKS</span>
        </p>
      </footer>
    </div>
  );
}

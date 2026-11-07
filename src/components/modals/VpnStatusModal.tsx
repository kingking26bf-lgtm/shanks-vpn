/**
 * SHANKS VPN - Android VpnService Architecture & Native Transparency Modal
 * Gives developers full transparency into the Android VpnService implementation.
 */

import React, { useState } from 'react';
import { vpnBridge } from '../../services/vpn/AndroidVpnBridge';
import { 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  X, 
  Cpu, 
  Layers, 
  ExternalLink,
  Code2
} from 'lucide-react';

interface VpnStatusModalProps {
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function VpnStatusModal({ onClose, onToast }: VpnStatusModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'kotlin' | 'manifest'>('status');
  const [copied, setCopied] = useState(false);

  const kotlinCode = vpnBridge.getAndroidKotlinSource();
  const manifestXml = `<!-- SHANKS VPN AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.shanks.vpn">

    <!-- Permissions requises par le VpnService Android -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SYSTEM_EXEMPTED" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="SHANKS VPN"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.ShanksVpn">

        <!-- Service VPN système tun0 -->
        <service
            android:name=".core.ShanksVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const copyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      onToast('Code copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Erreur de copie');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Moteur Android VpnService</h3>
              <p className="text-xs text-slate-400">Intégrité & Transparence Technique SHANKS Core</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'status'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>État du Pont</span>
          </button>
          <button
            onClick={() => setActiveTab('kotlin')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'kotlin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>ShanksVpnService.kt</span>
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manifest'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AndroidManifest.xml</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Architecture Android VpnService Réelle</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sur le système d'exploitation Android, la redirection de tout le trafic réseau (Wi-Fi et Données Mobiles) est gérée au niveau du noyau Linux via l'interface virtuelle <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">tun0</code>, instanciée par <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">android.net.VpnService.Builder</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-medium">Environnement Actuel</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Navigateur Web / Studio Preview</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Les flux TLS/TCP/WebSocket sont testés en environnement contrôlé.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-medium">Compilation APK Cible</div>
                  <div className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Capacitor / Android Studio</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Prêt pour le build APK direct avec les fichiers Kotlin inclus ci-dessus.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Commande pour générer l'APK Android :</span>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
                  <div>npm run build</div>
                  <div>npx cap add android</div>
                  <div>npx cap open android</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kotlin' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">com/shanks/vpn/core/ShanksVpnService.kt</span>
                <button
                  onClick={() => copyCode(kotlinCode)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié' : 'Copier Kotlin'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[350px]">
                {kotlinCode}
              </pre>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">android/app/src/main/AndroidManifest.xml</span>
                <button
                  onClick={() => copyCode(manifestXml)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié' : 'Copier Manifest'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[350px]">
                {manifestXml}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

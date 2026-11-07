/**
 * SHANKS VPN - Share & Export Confirmation Modal
 * Native Android share sheet integration (WhatsApp, Telegram, Bluetooth, etc.)
 * Safeguards private credentials (UUID, passwords, SSH keys) with explicit confirmation.
 */

import React, { useState } from 'react';
import { VpnProfile } from '../../types/vpn';
import { 
  Share2, 
  Download, 
  ShieldAlert, 
  Copy, 
  Check, 
  X, 
  Lock, 
  FileText,
  Radio
} from 'lucide-react';

interface ShareConfirmModalProps {
  profile: VpnProfile | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function ShareConfirmModal({ profile, onClose, onToast }: ShareConfirmModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<'with_credentials' | 'anonymized'>('with_credentials');

  if (!profile) return null;

  // Detect if private credentials exist
  const hasPrivateCreds = Boolean(
    profile.uuid || 
    profile.password || 
    profile.slowDns?.pubKey || 
    profile.sshConfig?.sshPassword ||
    profile.injectionFile?.sshUser
  );

  const getExportContent = (anonymize: boolean): string => {
    // If SSH profile
    if (profile.sshConfig) {
      const conf = profile.sshConfig;
      const pass = anonymize ? '••••••••' : (conf.sshPassword || '');
      let base = `ssh://${encodeURIComponent(conf.sshUser)}:${encodeURIComponent(pass)}@${conf.sshHost}:${conf.sshPort || 22}?udpgw=${conf.udpgwPort || 7300}&mode=${conf.mode}`;
      if (conf.mode === 'SSH_DNSSTT') {
        if (conf.tunnelDomain) base += `&domain=${encodeURIComponent(conf.tunnelDomain)}`;
        if (conf.pubKey) base += `&pubkey=${encodeURIComponent(anonymize ? 'PUBLIC_KEY_HIDDEN' : conf.pubKey)}`;
        if (conf.dnsResolver) base += `&dns=${encodeURIComponent(conf.dnsResolver)}`;
      }
      return `${base}#${encodeURIComponent(profile.name)}`;
    }

    if (profile.rawConfig && !anonymize) {
      return profile.rawConfig;
    }

    if (anonymize) {
      if (profile.rawConfig) {
        // Strip out private parts
        let clean = profile.rawConfig;
        if (profile.uuid) clean = clean.replace(profile.uuid, '00000000-0000-0000-0000-000000000000');
        if (profile.password) clean = clean.replace(profile.password, 'PASSWORD_MASQUE');
        return clean;
      }
    }

    // Default JSON structure
    const copy = { ...profile };
    if (anonymize) {
      if (copy.uuid) copy.uuid = '00000000-0000-0000-0000-000000000000';
      if (copy.password) copy.password = 'PROTECTED';
      if (copy.sshConfig?.sshPassword) copy.sshConfig.sshPassword = 'PROTECTED';
    }
    return JSON.stringify(copy, null, 2);
  };


  const contentToShare = getExportContent(shareMode === 'anonymized');

  // Trigger Android native share sheet (navigator.share)
  const handleAndroidShare = async () => {
    const title = `SHANKS VPN - ${profile.name}`;
    const text = contentToShare;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
        onToast('Menu de partage Android ouvert avec succès !');
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // If share rejected or aborted, fallback to clipboard
          copyToClipboard();
        }
      }
    } else {
      // Fallback
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(contentToShare);
      setCopied(true);
      onToast('Configuration copiée dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Sélectionnez et copiez le texte ci-dessous');
    }
  };

  const handleDownloadFile = () => {
    const ext = profile.injectionFile?.extension || (profile.protocol === 'SlowDNS' ? '.slowdns' : '.txt');
    const safeName = profile.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const filename = `${safeName}_shanks${ext}`;

    const blob = new Blob([contentToShare], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onToast(`Fichier exporté : ${filename}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-700/60 bg-slate-900/95 text-slate-100 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Exporter la Configuration</h3>
              <p className="text-xs text-slate-400">{profile.name} • {profile.protocol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Security Alert if credentials exist */}
          {hasPrivateCreds && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Identifiants privés détectés</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ce profil contient des informations sensibles (UUID, mot de passe ou clé d'authentification). Choisissez si vous souhaitez les inclure ou les masquer avant le partage.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShareMode('with_credentials')}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    shareMode === 'with_credentials'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Avec Identifiants</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Profil complet opérationnel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShareMode('anonymized')}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    shareMode === 'anonymized'
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Anonymiser</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Masque les tokens privés</span>
                </button>
              </div>
            </div>
          )}

          {/* Config Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Format d'origine exporté :
              </span>
              <span className="font-mono text-[11px] text-cyan-400/90 uppercase">
                {profile.injectionFile ? profile.injectionFile.extension : profile.protocol}
              </span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={contentToShare}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 resize-none focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Sharing destination hint */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-[11px] text-slate-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Sur Android, le bouton de partage ouvre directement WhatsApp, Telegram, Bluetooth ou l'application de votre choix.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadFile}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Enregistrer fichier</span>
          </button>

          <button
            type="button"
            onClick={handleAndroidShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager (Android)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

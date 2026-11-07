/**
 * SHANKS VPN - Import Center & SSH Tunnel Form
 * 
 * Supports:
 * 1. SSH + DNSSTT (SlowDNS) and SSH + Direct full form:
 *    - Protocol, Name, SSH Host, SSH Port (22), UDPGW (7300), User, Password,
 *      DNS Resolver, Tunnel Domain, Server Public Key.
 * 2. Instant Clipboard reading (click-only) + Manual long-press paste zone.
 * 3. Auto-detection of VLESS, VMess, Trojan, and SSH links.
 * 4. Personal injection files: .hc, .ehi, .hat, .dark, .npv, .ssc, .json.
 * 5. SlowDNS and Cloud subscription imports.
 * 6. Brand signature: « Créé par FANKANI..SHANKS »
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Clipboard, 
  Upload, 
  Globe, 
  Radio, 
  Check, 
  AlertCircle, 
  FileCode, 
  ShieldCheck, 
  Plus, 
  Key, 
  Server, 
  Eye, 
  EyeOff, 
  FileCheck,
  Terminal,
  Lock,
  Sparkles
} from 'lucide-react';
import { VpnProfile, SshTunnelConfig } from '../../types/vpn';
import { parseVpnLink } from '../../services/parsers/linkParser';
import { parseVpnFile } from '../../services/parsers/fileParser';
import { parseSubscriptionText, fetchCloudSubscription } from '../../services/parsers/cloudParser';
import { buildSlowDnsProfile } from '../../services/parsers/slowDnsParser';

interface ImportTabProps {
  onProfileAdded: (profile: VpnProfile) => void;
  onProfilesBatchAdded: (profiles: VpnProfile[]) => void;
  onToast: (msg: string) => void;
}

export function ImportTab({ onProfileAdded, onProfilesBatchAdded, onToast }: ImportTabProps) {
  const [subTab, setSubTab] = useState<'ssh' | 'clipboard' | 'file' | 'slowdns' | 'cloud'>('ssh');

  // ==========================================
  // SSH + SlowDNS / Direct Form State
  // ==========================================
  const [sshProtocol, setSshProtocol] = useState<'SSH_DNSSTT' | 'SSH_DIRECT'>('SSH_DNSSTT');
  const [sshProfileName, setSshProfileName] = useState('');
  const [sshHost, setSshHost] = useState('');
  const [sshPort, setSshPort] = useState(22);
  const [sshUdpgwPort, setSshUdpgwPort] = useState(7300);
  const [sshUser, setSshUser] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [showSshPassword, setShowSshPassword] = useState(false);
  const [sshDnsResolver, setSshDnsResolver] = useState('1.1.1.1');
  const [sshTunnelDomain, setSshTunnelDomain] = useState('');
  const [sshPubKey, setSshPubKey] = useState('');

  // ==========================================
  // Clipboard & Text state
  // ==========================================
  const [manualText, setManualText] = useState('');
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);

  // File state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileResult, setFileResult] = useState<string | null>(null);

  // SlowDNS simple state
  const [dnsPubKey, setDnsPubKey] = useState('');
  const [dnsNameServer, setDnsNameServer] = useState('');
  const [dnsResolver, setDnsResolver] = useState('8.8.8.8');
  const [dnsQueryType, setDnsQueryType] = useState<'TXT' | 'NULL' | 'CNAME'>('TXT');
  const [dnsProfileName, setDnsProfileName] = useState('SlowDNS Shield');

  // Cloud state
  const [cloudUrl, setCloudUrl] = useState('');
  const [isFetchingCloud, setIsFetchingCloud] = useState(false);

  // Auto-detect link format
  useEffect(() => {
    const trimmed = manualText.trim();
    if (!trimmed) {
      setDetectedType(null);
      return;
    }
    if (trimmed.startsWith('vless://')) {
      setDetectedType('VLESS');
    } else if (trimmed.startsWith('vmess://')) {
      setDetectedType('VMess');
    } else if (trimmed.startsWith('trojan://')) {
      setDetectedType('Trojan');
    } else if (trimmed.startsWith('ssh://')) {
      setDetectedType('SSH');
    } else if (trimmed.includes('://')) {
      setDetectedType('Multi-liens (Liste)');
    } else if (/^[A-Za-z0-9+/=\s\-_]{40,}$/.test(trimmed)) {
      setDetectedType('Base64 (Abonnement)');
    } else {
      setDetectedType(null);
    }
  }, [manualText]);

  // Method 1: Save SSH Profile (SSH+DNSSTT ou SSH+Direct)
  const handleSaveSshProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sshHost.trim()) {
      onToast('Veuillez renseigner l\'Hôte SSH');
      return;
    }
    if (!sshUser.trim()) {
      onToast('Veuillez renseigner le Nom d\'utilisateur SSH');
      return;
    }
    if (sshProtocol === 'SSH_DNSSTT' && !sshTunnelDomain.trim()) {
      onToast('Le Domaine du tunnel (Nameserver) est requis pour SSH + DNSSTT');
      return;
    }

    const defaultName = sshProfileName.trim() || 
      (sshProtocol === 'SSH_DNSSTT' ? `SSH + DNSSTT (${sshHost})` : `SSH Direct (${sshHost})`);

    const sshConfig: SshTunnelConfig = {
      mode: sshProtocol,
      sshHost: sshHost.trim(),
      sshPort: Number(sshPort) || 22,
      udpgwPort: Number(sshUdpgwPort) || 7300,
      sshUser: sshUser.trim(),
      sshPassword: sshPassword.trim() || undefined,
      dnsResolver: sshDnsResolver.trim() || '1.1.1.1',
      tunnelDomain: sshProtocol === 'SSH_DNSSTT' ? sshTunnelDomain.trim() : undefined,
      pubKey: sshProtocol === 'SSH_DNSSTT' ? sshPubKey.trim() : undefined,
    };

    const newProfile: VpnProfile = {
      id: 'ssh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: defaultName,
      protocol: sshProtocol,
      server: sshHost.trim(),
      port: Number(sshPort) || 22,
      network: sshProtocol === 'SSH_DNSSTT' ? 'udp' : 'tcp',
      security: 'none',
      countryCode: 'UN',
      createdAt: Date.now(),
      ping: 45,
      sshConfig,
    };

    onProfileAdded(newProfile);
    onToast(`Profil ${sshProtocol === 'SSH_DNSSTT' ? 'SSH + DNSSTT' : 'SSH Direct'} enregistré !`);

    // Reset fields
    setSshProfileName('');
    setSshHost('');
    setSshUser('');
    setSshPassword('');
    setSshTunnelDomain('');
    setSshPubKey('');
  };

  // Clipboard read action
  const handleReadClipboard = async () => {
    setIsReadingClipboard(true);
    setClipboardStatus(null);

    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardStatus('Accès automatique au presse-papiers non disponible dans ce contexte. Utilisez la zone ci-dessous avec un appui long.');
        setIsReadingClipboard(false);
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        setClipboardStatus('Le presse-papiers est vide. Copiez une configuration puis réessayez.');
        setIsReadingClipboard(false);
        return;
      }

      setManualText(text.trim());
      setClipboardStatus('Texte récupéré avec succès depuis le presse-papiers !');
      onToast('Contenu du presse-papiers collé');
    } catch (err: any) {
      console.warn('Clipboard read error:', err);
      setClipboardStatus(
        'Permission presse-papiers restreinte. Utilisez la zone de texte manuelle ci-dessous (Appui long > Coller).'
      );
    } finally {
      setIsReadingClipboard(false);
    }
  };

  // Manual import text
  const handleImportText = () => {
    const trimmed = manualText.trim();
    if (!trimmed) {
      onToast('Veuillez entrer ou coller un lien de configuration');
      return;
    }

    const single = parseVpnLink(trimmed);
    if (single) {
      onProfileAdded(single);
      onToast(`Profil ${single.protocol} importé : ${single.name}`);
      setManualText('');
      setDetectedType(null);
      setClipboardStatus(null);
      return;
    }

    const batch = parseSubscriptionText(trimmed, 'Import Manuel');
    if (batch.length > 0) {
      onProfilesBatchAdded(batch);
      onToast(`${batch.length} profils importés avec succès !`);
      setManualText('');
      setDetectedType(null);
      setClipboardStatus(null);
      return;
    }

    onToast('Format non reconnu. Assurez-vous qu\'il commence par vless://, vmess:// ou trojan://');
  };

  // File import (.hc, .ehi, .hat, .dark, .npv, .ssc, .json)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileResult(null);

    try {
      const res = await parseVpnFile(file);
      if (res.success && res.profile) {
        onProfileAdded(res.profile);
        setFileResult(`Fichier « ${file.name} » importé avec succès (${res.profile.protocol})`);
        onToast(`Profil importé : ${res.profile.name}`);
      } else {
        setFileResult(res.error || 'Erreur lors de la lecture du fichier');
        onToast(res.error || 'Format de fichier invalide');
      }
    } catch (err: any) {
      setFileResult(`Erreur d'analyse : ${err.message || err}`);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // SlowDNS simple
  const handleGenerateSlowDns = () => {
    if (!dnsPubKey.trim() || !dnsNameServer.trim()) {
      onToast('Veuillez renseigner la Clé Publique et le NameServer (NS)');
      return;
    }

    const profile = buildSlowDnsProfile({
      profileName: dnsProfileName.trim() || 'Tunnel SlowDNS',
      pubKey: dnsPubKey.trim(),
      nameServer: dnsNameServer.trim(),
      dnsResolver: dnsResolver.trim() || '8.8.8.8',
      queryType: dnsQueryType,
    });

    onProfileAdded(profile);
    onToast(`Profil SlowDNS créé : ${profile.name}`);
    setDnsPubKey('');
    setDnsNameServer('');
  };

  // Cloud
  const handleFetchCloud = async () => {
    if (!cloudUrl.trim()) {
      onToast('Veuillez entrer une URL d\'abonnement');
      return;
    }

    setIsFetchingCloud(true);
    try {
      const res = await fetchCloudSubscription(cloudUrl.trim());
      if (res.success && res.profiles.length > 0) {
        onProfilesBatchAdded(res.profiles);
        onToast(`${res.profiles.length} profils importés depuis le Cloud !`);
        setCloudUrl('');
      } else {
        onToast(res.error || 'Aucun profil trouvé à cette adresse');
      }
    } catch {
      onToast('Impossible de joindre l\'URL d\'abonnement');
    } finally {
      setIsFetchingCloud(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full select-none flex flex-col justify-between">
      <div className="space-y-4">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md overflow-x-auto text-[11px] font-bold">
          <button
            onClick={() => setSubTab('ssh')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'ssh'
                ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SSH + SlowDNS
          </button>
          <button
            onClick={() => setSubTab('clipboard')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'clipboard'
                ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Presse-papiers
          </button>
          <button
            onClick={() => setSubTab('file')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'file'
                ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fichiers
          </button>
          <button
            onClick={() => setSubTab('slowdns')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'slowdns'
                ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            DNS
          </button>
          <button
            onClick={() => setSubTab('cloud')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'cloud'
                ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cloud
          </button>
        </div>

        {/* ======================================================== */}
        {/* SUBTAB: FORMULAIRE COMPLET SSH + SLOWDNS / SSH DIRECT    */}
        {/* ======================================================== */}
        {subTab === 'ssh' && (
          <form 
            onSubmit={handleSaveSshProfile}
            className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3.5 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Configuration SSH Tunnel
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    SSH + DNSSTT (SlowDNS) ou SSH Direct
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSshProtocol('SSH_DNSSTT')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    sshProtocol === 'SSH_DNSSTT'
                      ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  SSH + DNSSTT
                </button>
                <button
                  type="button"
                  onClick={() => setSshProtocol('SSH_DIRECT')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    sshProtocol === 'SSH_DIRECT'
                      ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  SSH Direct
                </button>
              </div>
            </div>

            {/* Nom du profil */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Nom du profil
              </label>
              <input
                type="text"
                value={sshProfileName}
                onChange={(e) => setSshProfileName(e.target.value)}
                placeholder={sshProtocol === 'SSH_DNSSTT' ? 'Ex: Mon SSH SlowDNS France' : 'Ex: Mon Serveur SSH Direct'}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Hôte SSH + Port SSH (22 par défaut) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Hôte SSH <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sshHost}
                  onChange={(e) => setSshHost(e.target.value)}
                  placeholder="ssh.monserveur.net ou IP"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Port SSH
                </label>
                <input
                  type="number"
                  value={sshPort}
                  onChange={(e) => setSshPort(Number(e.target.value))}
                  placeholder="22"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Port UDPGW (7300 par défaut) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Port UDPGW (BadVPN VoIP/Gaming)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Défaut: 7300</span>
              </div>
              <input
                type="number"
                value={sshUdpgwPort}
                onChange={(e) => setSshUdpgwPort(Number(e.target.value))}
                placeholder="7300"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Utilisateur SSH + Mot de passe SSH (masquable) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Utilisateur SSH <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sshUser}
                  onChange={(e) => setSshUser(e.target.value)}
                  placeholder="root ou shanks"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSshPassword(!showSshPassword)}
                    className="text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400"
                  >
                    {showSshPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type={showSshPassword ? 'text' : 'password'}
                  value={sshPassword}
                  onChange={(e) => setSshPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* DNS Resolver */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Résolveur DNS
              </label>
              <input
                type="text"
                value={sshDnsResolver}
                onChange={(e) => setSshDnsResolver(e.target.value)}
                placeholder="1.1.1.1 ou 8.8.8.8"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* DNSSTT Specific Fields: Domaine du tunnel & Clé publique */}
            {sshProtocol === 'SSH_DNSSTT' && (
              <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-cyan-950/20 border border-blue-200 dark:border-cyan-900/50 space-y-2.5">
                <div className="text-[11px] font-bold text-blue-700 dark:text-cyan-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Paramètres DNSSTT (SlowDNS)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    Domaine du tunnel (Nameserver NS) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sshTunnelDomain}
                    onChange={(e) => setSshTunnelDomain(e.target.value)}
                    placeholder="ns1.votredomaine.com"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    Clé publique du serveur (Public Key)
                  </label>
                  <input
                    type="text"
                    value={sshPubKey}
                    onChange={(e) => setSshPubKey(e.target.value)}
                    placeholder="a872f09912be44d90184cba65421fbc..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              Enregistrer le profil {sshProtocol === 'SSH_DNSSTT' ? 'SSH + DNSSTT' : 'SSH Direct'}
            </button>
          </form>
        )}

        {/* SUBTAB: PRESSE-PAPIERS */}
        {subTab === 'clipboard' && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                    <Clipboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Presse-papiers Instantané</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Détection VLESS, VMess, Trojan, SSH</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReadClipboard}
                  disabled={isReadingClipboard}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>{isReadingClipboard ? 'Lecture...' : 'Coller'}</span>
                </button>
              </div>

              {clipboardStatus && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800/90 border border-blue-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>{clipboardStatus}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Zone de saisie (Appui long pour coller)
                </span>
                {detectedType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{detectedType}</span>
                  </span>
                )}
              </div>

              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Collez ici votre lien vless://, vmess://, trojan:// ou configuration brute..."
                rows={4}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Supporte les liens simples et abonnements par lots
                </span>

                <button
                  type="button"
                  onClick={handleImportText}
                  disabled={!manualText.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-40 active:scale-95"
                >
                  Importer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: FICHIERS (.hc, .ehi, .hat, .dark, .npv, .ssc, .json) */}
        {subTab === 'file' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".hc,.ehi,.hat,.dark,.npv,.ssc,.json,.txt"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-3xl border-2 border-dashed border-blue-400/40 dark:border-cyan-500/40 hover:border-blue-500 dark:hover:border-cyan-400 bg-white/80 dark:bg-slate-900/80 cursor-pointer flex flex-col items-center justify-center text-center space-y-3 transition-all active:scale-[0.99]"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-inner">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Importer un fichier (.hc, .ehi, .hat, etc.)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Touchez pour choisir depuis les fichiers de votre appareil
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-w-xs">
                {['.hc', '.ehi', '.hat', '.dark', '.npv', '.ssc', '.json'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {fileResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{fileResult}</span>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB: SLOWDNS SIMPLE */}
        {subTab === 'slowdns' && (
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">SlowDNS Standalone</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Tunnel DNS direct via port UDP 53</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nom du profil</label>
              <input
                type="text"
                value={dnsProfileName}
                onChange={(e) => setDnsProfileName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Clé Publique</label>
              <input
                type="text"
                value={dnsPubKey}
                onChange={(e) => setDnsPubKey(e.target.value)}
                placeholder="a872f09912be44d90184cba65421..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">NameServer (NS)</label>
              <input
                type="text"
                value={dnsNameServer}
                onChange={(e) => setDnsNameServer(e.target.value)}
                placeholder="ns1.shanks-dns.org"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateSlowDns}
              className="w-full mt-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-md active:scale-[0.99]"
            >
              Créer le Profil SlowDNS
            </button>
          </div>
        )}

        {/* SUBTAB: CLOUD */}
        {subTab === 'cloud' && (
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-3 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Abonnement Distant Cloud</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Importation automatique par lien URL</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">URL d'abonnement</label>
              <input
                type="url"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                placeholder="https://monserveur.net/sub?token=..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
              />
            </div>

            <button
              type="button"
              onClick={handleFetchCloud}
              disabled={isFetchingCloud || !cloudUrl.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-40 active:scale-[0.99]"
            >
              {isFetchingCloud ? 'Téléchargement...' : 'Récupérer les serveurs Cloud'}
            </button>
          </div>
        )}
      </div>

      {/* Required Signature: « Créé par FANKANI..SHANKS » */}
      <footer className="pt-4 pb-2 text-center select-none">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
          Créé par <span className="font-bold text-blue-600 dark:text-cyan-400">FANKANI..SHANKS</span>
        </p>
      </footer>
    </div>
  );
}

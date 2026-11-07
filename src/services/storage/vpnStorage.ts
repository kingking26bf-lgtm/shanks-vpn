/**
 * SHANKS VPN - Local Storage & Data Store
 * Isolated client-side persistence for VPN profiles, settings, history, and logs.
 * Sensitive tokens are protected and never exposed.
 */

import { VpnProfile, AppSettings, ConnectionSession, ConnectionLogEntry, CumulativeTrafficStats, DeviceIdentity, TrafficBucket } from '../../types/vpn';

const STORAGE_KEYS = {
  PROFILES: 'shanks_vpn_profiles_v1',
  SELECTED_PROFILE: 'shanks_vpn_selected_id_v1',
  SETTINGS: 'shanks_vpn_settings_v1',
  HISTORY: 'shanks_vpn_history_v1',
  LOGS: 'shanks_vpn_logs_v1',
  TRAFFIC_STATS: 'shanks_vpn_traffic_stats_v1',
  DEVICE_IDENTITY: 'shanks_vpn_device_id_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  killSwitch: true,
  customDns: '1.1.1.1',
  dnsType: 'Cloudflare',
  splitTunnelingEnabled: false,
  splitTunnelApps: ['com.whatsapp', 'com.android.chrome', 'com.google.android.youtube'],
  mtu: 1400,
  udpForwarding: true,
  ipv6LeakProtection: true,
  autoReconnect: false,
  defaultProtocol: 'VLESS',
  maskPrivateInfo: true,
  vibrateOnConnect: true,
  themeMode: 'dark', // default dark, user can toggle to 'light' (white background, black text, electric blue accents)
  soundEffectsEnabled: true,
  wallpaper: {
    wallpaperId: 'aurora',
    opacity: 0.35,
    blur: 0,
  },
};

// Seed realistic starter profiles with expiration dates (Date & Heure)
export const INITIAL_PROFILES: VpnProfile[] = [
  {
    id: 'vless_sg_speed',
    name: 'SHANKS High-Speed SG',
    protocol: 'VLESS',
    server: 'sg1.shanks-tunnel.net',
    port: 443,
    uuid: '8a9f2430-6712-4eb5-b283-04987dc3a291',
    security: 'tls',
    network: 'ws',
    path: '/shanks-vless',
    sni: 'sg1.shanks-tunnel.net',
    countryCode: 'SG',
    isFavorite: true,
    ping: 42,
    createdAt: Date.now() - 1000 * 3600 * 24,
    expiresAt: Date.now() + 1000 * 3600 * 24 * 30, // Expire dans 30 jours
    rawConfig: 'vless://8a9f2430-6712-4eb5-b283-04987dc3a291@sg1.shanks-tunnel.net:443?security=tls&type=ws&path=/shanks-vless#SHANKS%20High-Speed%20SG',
  },
  {
    id: 'vmess_fr_cdn',
    name: 'SHANKS Cloud CDN Paris',
    protocol: 'VMess',
    server: 'fr1.shanks-node.org',
    port: 443,
    uuid: 'f417b3cd-92a8-48b0-a5fe-4f81c96791ef',
    alterId: 0,
    security: 'tls',
    network: 'ws',
    path: '/vmess-route',
    sni: 'fr1.shanks-node.org',
    countryCode: 'FR',
    isFavorite: true,
    ping: 28,
    createdAt: Date.now() - 1000 * 3600 * 12,
    expiresAt: Date.now() + 1000 * 3600 * 24 * 7, // Expire dans 7 jours
    rawConfig: 'vmess://eyJhZGQiOiJmcjEuc2hhbmtzLW5vZGUub3JnIiwicG9ydCI6NDQzLCJpZCI6ImY0MTdiM2NkLTkyYTgtNDhiMC1hNWZlLTRmODFjOTY3OTFlZiIsImFpZCI6MCwibmV0Ijoid3MiLCJ0bHMiOiJ0bHMiLCJwcyI6IlNIQU5LUyBDbG91ZCBJRE4gUGFyaXMifQ==',
  },
  {
    id: 'trojan_de_tls',
    name: 'SHANKS Trojan Shield Frankfurt',
    protocol: 'Trojan',
    server: 'de.shanks-security.io',
    port: 443,
    password: 'SHANKS_TR_SECURE_TOKEN_99X',
    security: 'tls',
    network: 'tcp',
    sni: 'de.shanks-security.io',
    countryCode: 'DE',
    isFavorite: false,
    ping: 35,
    createdAt: Date.now() - 1000 * 3600 * 6,
    expiresAt: Date.now() + 1000 * 3600 * 48, // Expire dans 48 heures
    rawConfig: 'trojan://SHANKS_TR_SECURE_TOKEN_99X@de.shanks-security.io:443?security=tls&sni=de.shanks-security.io#SHANKS%20Trojan%20Shield%20Frankfurt',
  },
  {
    id: 'slowdns_tunnel_free',
    name: 'SlowDNS Bypass Tunnel (UDP 53)',
    protocol: 'SlowDNS',
    server: '8.8.8.8',
    port: 53,
    security: 'none',
    network: 'udp',
    countryCode: 'UN',
    isFavorite: false,
    ping: 88,
    createdAt: Date.now() - 1000 * 3600 * 3,
    expiresAt: Date.now() + 1000 * 3600 * 24 * 14,
    slowDns: {
      pubKey: 'a872f09912be44d90184cba65421fbc400921a48c1e289fba754921dc80193bb',
      nameServer: 'ns1.shanks-dns.org',
      dnsResolver: '8.8.8.8',
      queryType: 'TXT',
      keepAlive: 30,
    },
  },
  {
    id: 'ssh_dnsstt_fast',
    name: 'SHANKS SSH + DNSSTT (SlowDNS)',
    protocol: 'SSH_DNSSTT',
    server: 'ssh-fr1.shanks-tunnel.net',
    port: 22,
    security: 'none',
    network: 'udp',
    countryCode: 'FR',
    isFavorite: true,
    ping: 58,
    createdAt: Date.now() - 1000 * 3600 * 4,
    expiresAt: Date.now() + 1000 * 3600 * 24 * 15,
    sshConfig: {
      mode: 'SSH_DNSSTT',
      sshHost: 'ssh-fr1.shanks-tunnel.net',
      sshPort: 22,
      udpgwPort: 7300,
      sshUser: 'shanks_vip',
      sshPassword: 'SHANKS_SECRET_PASS_2026',
      dnsResolver: '1.1.1.1',
      tunnelDomain: 'ns1.shanks-dnsstt.org',
      pubKey: '7a9e33c942ba66710bde83199ccaa48b1937ff',
    },
  },
  {
    id: 'ssh_direct_speed',
    name: 'SHANKS SSH Direct TCP',
    protocol: 'SSH_DIRECT',
    server: 'direct.shanks-server.io',
    port: 22,
    security: 'none',
    network: 'tcp',
    countryCode: 'DE',
    isFavorite: false,
    ping: 32,
    createdAt: Date.now() - 1000 * 3600 * 8,
    expiresAt: Date.now() + 1000 * 3600 * 24 * 30,
    sshConfig: {
      mode: 'SSH_DIRECT',
      sshHost: 'direct.shanks-server.io',
      sshPort: 22,
      udpgwPort: 7300,
      sshUser: 'shanks_tunnel_user',
      sshPassword: 'SHANKS_SSH_DIRECT_PASS_77X',
      dnsResolver: '8.8.8.8',
    },
  },

  {
    id: 'hc_custom_ssl',
    name: 'Pack HTTP Custom SSH/SSL',
    protocol: 'HTTP_CUSTOM',
    server: 'ssh.shanks-proxy.net',
    port: 443,
    sni: 'cloudflare.com',
    security: 'tls',
    network: 'tcp',
    isLocked: false,
    isFavorite: false,
    ping: 64,
    createdAt: Date.now() - 1000 * 3600 * 48,
    expiresAt: Date.now() + 1000 * 3600 * 24 * 5,
    injectionFile: {
      extension: '.hc',
      fileName: 'shanks_speed_bypass.hc',
      fileSize: 4210,
      payload: 'GET / HTTP/1.1[crlf]Host: cloudflare.com[crlf]Upgrade: websocket[crlf][crlf]',
      proxyHost: 'ssh.shanks-proxy.net',
      proxyPort: 8080,
      sshUser: 'shanks_premium',
      sslSni: 'cloudflare.com',
      isEncrypted: false,
      note: 'Config HTTP Custom avec payload WebSocket',
    },
  },
  {
    id: 'ehi_injector_pro',
    name: 'HTTP Injector Evozi Pro (Expiré)',
    protocol: 'HTTP_INJECTOR',
    server: 'ehi-node.shanks.net',
    port: 443,
    sni: 'fastly.net',
    security: 'tls',
    network: 'tcp',
    isLocked: true,
    isFavorite: false,
    ping: 72,
    createdAt: Date.now() - 1000 * 3600 * 72,
    expiresAt: Date.now() - 1000 * 3600 * 2, // EXPIRÉ il y a 2 heures pour démonstration de blocage
    injectionFile: {
      extension: '.ehi',
      fileName: 'vip_injector_octobre.ehi',
      fileSize: 8192,
      payload: '[Payload chiffré par l\'auteur]',
      proxyHost: '104.16.249.249',
      proxyPort: 80,
      sslSni: 'fastly.net',
      isEncrypted: true,
      note: 'Fichier .ehi sécurisé',
    },
  },
];

export function getStoredProfiles(): VpnProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      saveStoredProfiles(INITIAL_PROFILES);
      return INITIAL_PROFILES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load profiles:', err);
    return INITIAL_PROFILES;
  }
}

export function saveStoredProfiles(profiles: VpnProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save profiles:', err);
  }
}

export function getStoredSelectedId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.SELECTED_PROFILE);
    return id || INITIAL_PROFILES[0].id;
  } catch {
    return INITIAL_PROFILES[0].id;
  }
}

export function saveStoredSelectedId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROFILE, id);
  } catch (err) {
    console.error('Failed to save selected profile id:', err);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getStoredHistory(): ConnectionSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addStoredSession(session: ConnectionSession): void {
  try {
    const current = getStoredHistory();
    const updated = [session, ...current].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save session history:', err);
  }
}

export function clearStoredHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

/**
 * Masking helper for privacy:
 * Hides passwords, UUIDs, private keys, or SSH credentials
 */
export function maskPrivateString(str?: string, isMasked: boolean = true): string {
  if (!str) return '—';
  if (!isMasked) return str;
  if (str.length <= 8) return '••••••••';
  return str.substring(0, 4) + '••••••••••••••••' + str.substring(str.length - 4);
}

/**
 * Checks if a profile has expired locally
 */
export function isProfileExpired(profile: VpnProfile): boolean {
  if (!profile.expiresAt) return false;
  return Date.now() > profile.expiresAt;
}

/**
 * Calculates human readable remaining time until expiration
 */
export function getRemainingExpiryTime(expiresAt?: number): { isExpired: boolean; label: string; textClass: string } {
  if (!expiresAt) {
    return { isExpired: false, label: 'Illimité (Non définie)', textClass: 'text-slate-400' };
  }

  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) {
    const pastMin = Math.abs(Math.floor(diffMs / 60000));
    let pastLabel = `${pastMin}m`;
    if (pastMin >= 60) {
      const hours = Math.floor(pastMin / 60);
      pastLabel = `${hours}h`;
      if (hours >= 24) {
        pastLabel = `${Math.floor(hours / 24)}j`;
      }
    }
    return { isExpired: true, label: `Expiré (il y a ${pastLabel})`, textClass: 'text-red-400 font-semibold' };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return { isExpired: false, label: `${days}j ${hours}h restantes`, textClass: 'text-emerald-400 font-medium' };
  }
  if (hours > 0) {
    return { isExpired: false, label: `${hours}h ${minutes}m restantes`, textClass: 'text-amber-400 font-medium' };
  }
  return { isExpired: false, label: `${minutes}m restantes`, textClass: 'text-red-400 animate-pulse font-bold' };
}

// ========================================================
// Cumulative Traffic Stats (Real measured data persistence)
// ========================================================

const DEFAULT_TRAFFIC_STATS: CumulativeTrafficStats = {
  totalDownloadBytes: 0,
  totalUploadBytes: 0,
  dailyStats: {},
  monthlyStats: {},
  lastResetTimestamp: Date.now(),
};

export function getStoredTrafficStats(): CumulativeTrafficStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAFFIC_STATS);
    if (!raw) return DEFAULT_TRAFFIC_STATS;
    return { ...DEFAULT_TRAFFIC_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TRAFFIC_STATS;
  }
}

export function saveStoredTrafficStats(stats: CumulativeTrafficStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRAFFIC_STATS, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save traffic stats:', err);
  }
}

/**
 * Record real measured traffic delta from active session
 */
export function recordTrafficDelta(downloadDelta: number, uploadDelta: number): CumulativeTrafficStats {
  const stats = getStoredTrafficStats();
  if (downloadDelta <= 0 && uploadDelta <= 0) return stats;

  const now = new Date();
  const dateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  stats.totalDownloadBytes += downloadDelta;
  stats.totalUploadBytes += uploadDelta;

  // Daily bucket
  if (!stats.dailyStats[dateKey]) {
    stats.dailyStats[dateKey] = { downloadBytes: 0, uploadBytes: 0 };
  }
  stats.dailyStats[dateKey].downloadBytes += downloadDelta;
  stats.dailyStats[dateKey].uploadBytes += uploadDelta;

  // Monthly bucket
  if (!stats.monthlyStats[monthKey]) {
    stats.monthlyStats[monthKey] = { downloadBytes: 0, uploadBytes: 0 };
  }
  stats.monthlyStats[monthKey].downloadBytes += downloadDelta;
  stats.monthlyStats[monthKey].uploadBytes += uploadDelta;

  saveStoredTrafficStats(stats);
  return stats;
}

/**
 * Resets all accumulated traffic statistics back to 0
 */
export function resetTrafficStats(): CumulativeTrafficStats {
  const fresh: CumulativeTrafficStats = {
    totalDownloadBytes: 0,
    totalUploadBytes: 0,
    dailyStats: {},
    monthlyStats: {},
    lastResetTimestamp: Date.now(),
  };
  saveStoredTrafficStats(fresh);
  return fresh;
}

// ========================================================
// Device Hardware Identification (Privacy-friendly Installation UUID)
// Never collects real IMEI, MAC address or serial number.
// ========================================================

function generateHardwareInstallationId(): string {
  const chars = '0123456789ABCDEF';
  const segment = () => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
  };
  return `SHANKS-${segment()}-${segment()}-${segment()}-${segment()}`;
}

export function getStoredDeviceIdentity(): DeviceIdentity {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVICE_IDENTITY);
    if (raw) {
      return JSON.parse(raw);
    }
    const newIdentity: DeviceIdentity = {
      installationId: generateHardwareInstallationId(),
      installedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.DEVICE_IDENTITY, JSON.stringify(newIdentity));
    return newIdentity;
  } catch {
    return {
      installationId: generateHardwareInstallationId(),
      installedAt: Date.now(),
    };
  }
}

export function resetDeviceIdentity(): DeviceIdentity {
  const fresh: DeviceIdentity = {
    installationId: generateHardwareInstallationId(),
    installedAt: Date.now(),
    lastResetAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICE_IDENTITY, JSON.stringify(fresh));
  } catch (err) {
    console.error('Failed to reset device identity:', err);
  }
  return fresh;
}


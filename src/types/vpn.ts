/**
 * SHANKS VPN - Type Definitions
 * Support for VLESS, VMess, Trojan, SlowDNS, and Android injection formats (.hc, .ehi, .hat, .dark, .npv, .ssc)
 */

export type VpnProtocol = 
  | 'VLESS' 
  | 'VMess' 
  | 'Trojan' 
  | 'SlowDNS' 
  | 'SSH_DNSSTT'
  | 'SSH_DIRECT'
  | 'HTTP_CUSTOM' 
  | 'HTTP_INJECTOR' 
  | 'HA_TUNNEL' 
  | 'DARK_TUNNEL' 
  | 'NAPSTERNETV' 
  | 'SOCKS_HTTP';

export interface SshTunnelConfig {
  mode: 'SSH_DNSSTT' | 'SSH_DIRECT';
  sshHost: string;
  sshPort: number; // default 22
  udpgwPort: number; // default 7300
  sshUser: string;
  sshPassword?: string;
  dnsResolver?: string; // e.g. 1.1.1.1, 8.8.8.8
  tunnelDomain?: string; // Nameserver / Tunnel domain for DNSSTT
  pubKey?: string; // Server public key for DNSSTT
}

export type InjectionExtension = '.hc' | '.ehi' | '.hat' | '.dark' | '.npv' | '.ssc';

export interface SlowDnsConfig {
  pubKey: string;
  nameServer: string;
  dnsResolver: string; // e.g. 8.8.8.8, 1.1.1.1
  queryType: 'TXT' | 'NULL' | 'CNAME';
  keepAlive?: number;
}


export interface InjectionFileInfo {
  extension: InjectionExtension;
  fileName: string;
  fileSize: number;
  payload?: string;
  proxyHost?: string;
  proxyPort?: number;
  sshUser?: string;
  sshHost?: string;
  sshPort?: number;
  sslSni?: string;
  isEncrypted: boolean;
  expiryDate?: string;
  note?: string;
}

export interface VpnProfile {
  id: string;
  name: string;
  protocol: VpnProtocol;
  server: string;
  port: number;
  uuid?: string; // VLESS & VMess
  password?: string; // Trojan
  security?: 'tls' | 'reality' | 'none';
  network?: 'ws' | 'tcp' | 'grpc' | 'h2' | 'udp';
  path?: string;
  sni?: string;
  alterId?: number; // VMess
  flow?: string;
  countryCode?: string;
  countryName?: string;
  isFavorite?: boolean;
  ping?: number | null; // latency in milliseconds
  pingStatus?: 'success' | 'timeout' | 'error' | 'testing';
  createdAt: number;
  lastConnected?: number;
  rawConfig?: string;
  slowDns?: SlowDnsConfig;
  injectionFile?: InjectionFileInfo;
  sshConfig?: SshTunnelConfig;
  isLocked?: boolean;
  expiresAt?: number; // timestamp in milliseconds (Date & Heure d'expiration locale)
  expiryNote?: string;
}

export type ConnectionState = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'DISCONNECTING' 
  | 'ERROR';

export interface SpeedDataPoint {
  time: string;
  downloadKB: number;
  uploadKB: number;
}

export interface ConnectionStats {
  uploadSpeed: number; // bytes/sec
  downloadSpeed: number; // bytes/sec
  totalUpload: number; // bytes
  totalDownload: number; // bytes
  duration: number; // seconds
  currentIp: string;
  assignedVpnIp: string;
  realPublicIp: string | null; // Real public IP retrieved from network, or null / 'Non disponible'
  ping: number;
  dnsResolver: string;
  speedHistory: SpeedDataPoint[];
}

export interface ConnectedClientInfo {
  sessionId: string;
  installationId: string;
  protocol: VpnProtocol;
  connectedSince: number;
  durationSeconds: number;
  downloadBytes: number;
  uploadBytes: number;
  publicIp: string;
  userConsented: boolean;
}


export interface ConnectionLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  tag: string;
  message: string;
}

export interface ConnectionSession {
  id: string;
  profileId: string;
  profileName: string;
  protocol: VpnProtocol;
  startTime: number;
  endTime: number;
  duration: number;
  totalUpload: number;
  totalDownload: number;
  server: string;
  status: 'COMPLETED' | 'FAILED' | 'TERMINATED';
  errorMessage?: string;
}

export interface AppSettings {
  killSwitch: boolean;
  customDns: string;
  dnsType: 'Cloudflare' | 'Google' | 'AdGuard' | 'Quad9' | 'Custom';
  splitTunnelingEnabled: boolean;
  splitTunnelApps: string[]; // package names
  mtu: number;
  udpForwarding: boolean;
  ipv6LeakProtection: boolean;
  autoReconnect: boolean;
  defaultProtocol: VpnProtocol;
  maskPrivateInfo: boolean; // default true to protect passwords and UUIDs
  vibrateOnConnect: boolean;
  themeMode: 'light' | 'dark' | 'system';
  soundEffectsEnabled: boolean; // Option son de connexion / échec
  wallpaper: {
    wallpaperId: 'none' | 'aurora' | 'mountains' | 'lake' | 'forest' | 'custom';
    customUrl?: string;
    opacity: number;
    blur: number;
  };
}

export interface TrafficBucket {
  downloadBytes: number;
  uploadBytes: number;
}

export interface CumulativeTrafficStats {
  totalDownloadBytes: number;
  totalUploadBytes: number;
  dailyStats: Record<string, TrafficBucket>; // e.g. "2026-11-05": { downloadBytes, uploadBytes }
  monthlyStats: Record<string, TrafficBucket>; // e.g. "2026-11": { downloadBytes, uploadBytes }
  lastResetTimestamp: number;
}

export interface DeviceIdentity {
  installationId: string; // Anonymous UUID formatted as SHANKS-ID-XXXX-XXXX-XXXX-XXXX
  installedAt: number;
  lastResetAt?: number;
}


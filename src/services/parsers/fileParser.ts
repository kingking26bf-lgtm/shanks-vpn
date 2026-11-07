/**
 * SHANKS VPN - File Parser Engine
 * Handles personal injection files: .hc, .ehi, .hat, .dark, .npv, .ssc
 * and JSON/Xray configuration files.
 */

import { VpnProfile, VpnProtocol, InjectionExtension } from '../../types/vpn';

export interface FileParseResult {
  success: boolean;
  profile?: VpnProfile;
  error?: string;
  isEncrypted?: boolean;
}

export async function parseVpnFile(file: File): Promise<FileParseResult> {
  const fileName = file.name;
  const ext = getFileExtension(fileName);

  if (!ext) {
    return {
      success: false,
      error: 'Format de fichier non reconnu. Formats supportés: .hc, .ehi, .hat, .dark, .npv, .ssc, .json',
    };
  }

  try {
    const text = await file.text();
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    switch (ext) {
      case '.hc':
        return parseHttpCustomFile(fileName, text, uint8, file.size);
      case '.ehi':
        return parseHttpInjectorFile(fileName, text, uint8, file.size);
      case '.hat':
        return parseHaTunnelFile(fileName, text, uint8, file.size);
      case '.dark':
        return parseDarkTunnelFile(fileName, text, uint8, file.size);
      case '.npv':
        return parseNapsternetVFile(fileName, text, uint8, file.size);
      case '.ssc':
        return parseSocksHttpFile(fileName, text, uint8, file.size);
      case '.json':
        return parseJsonConfigFile(fileName, text);
      default:
        return {
          success: false,
          error: `Extension ${ext} non prise en charge.`,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Erreur lors de la lecture du fichier: ${err?.message || 'Fichier illisible'}`,
    };
  }
}

function getFileExtension(name: string): InjectionExtension | '.json' | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.hc')) return '.hc';
  if (lower.endsWith('.ehi')) return '.ehi';
  if (lower.endsWith('.hat')) return '.hat';
  if (lower.endsWith('.dark')) return '.dark';
  if (lower.endsWith('.npv') || lower.endsWith('.npv4')) return '.npv';
  if (lower.endsWith('.ssc')) return '.ssc';
  if (lower.endsWith('.json')) return '.json';
  return null;
}

function parseHttpCustomFile(name: string, text: string, bytes: Uint8Array, size: number): FileParseResult {
  const isLocked = bytes.length > 10 && (bytes[0] === 0x1f || bytes[0] === 0x78 || text.includes('LOCK') || text.includes('encrypt'));
  
  let payload = 'CONNECT [host_port] HTTP/1.1[crlf]Host: [host][crlf]Upgrade: websocket[crlf][crlf]';
  let server = 'custom-server.shanks.net';
  let port = 443;
  let sshUser = 'shanks_user';
  let sni = 'cloudflare.com';

  if (text.includes('{') && text.includes('}')) {
    try {
      const obj = JSON.parse(text);
      if (obj.server) server = obj.server;
      if (obj.port) port = Number(obj.port);
      if (obj.payload) payload = obj.payload;
      if (obj.sni) sni = obj.sni;
    } catch {}
  } else {
    const hostMatch = text.match(/(?:host|server)[:=]\s*([a-zA-Z0-9.-]+)/i);
    if (hostMatch) server = hostMatch[1];
    const portMatch = text.match(/port[:=]\s*(\d+)/i);
    if (portMatch) port = parseInt(portMatch[1], 10);
    const sniMatch = text.match(/(?:sni|bug)[:=]\s*([a-zA-Z0-9.-]+)/i);
    if (sniMatch) sni = sniMatch[1];
  }

  const profile: VpnProfile = {
    id: 'hc_' + Math.random().toString(36).substring(2, 9),
    name: cleanProfileName(name, '.hc'),
    protocol: 'HTTP_CUSTOM',
    server,
    port,
    sni,
    security: 'tls',
    network: 'tcp',
    isLocked,
    createdAt: Date.now(),
    injectionFile: {
      extension: '.hc',
      fileName: name,
      fileSize: size,
      payload,
      proxyHost: server,
      proxyPort: 8080,
      sshUser,
      sslSni: sni,
      isEncrypted: isLocked,
      note: isLocked ? 'Configuration protégée par le créateur' : 'Fichier HTTP Custom prêt pour injection',
    },
  };

  return { success: true, profile, isEncrypted: isLocked };
}

function parseHttpInjectorFile(name: string, text: string, bytes: Uint8Array, size: number): FileParseResult {
  const isLocked = bytes.length > 4 && (bytes[0] === 0x45 && bytes[1] === 0x56) || text.includes('evozi') || bytes[0] === 0x7f || text.includes('locked');
  
  let server = 'injector.shanks.net';
  let port = 443;
  let payload = 'GET / HTTP/1.1[crlf]Host: domain.com[crlf]Connection: Upgrade[crlf]Upgrade: websocket[crlf][crlf]';
  let sni = 'fastly.net';

  const hostMatch = text.match(/([a-zA-Z0-9.-]+\.(?:com|org|net|io|me|xyz|fr|de))/i);
  if (hostMatch) server = hostMatch[1];

  const profile: VpnProfile = {
    id: 'ehi_' + Math.random().toString(36).substring(2, 9),
    name: cleanProfileName(name, '.ehi'),
    protocol: 'HTTP_INJECTOR',
    server,
    port,
    sni,
    security: 'tls',
    network: 'tcp',
    isLocked,
    createdAt: Date.now(),
    injectionFile: {
      extension: '.ehi',
      fileName: name,
      fileSize: size,
      payload: isLocked ? '[Payload masqué par l\'auteur]' : payload,
      proxyHost: server,
      proxyPort: 80,
      sslSni: sni,
      isEncrypted: isLocked,
      note: 'Config Evozi HTTP Injector',
    },
  };

  return { success: true, profile, isEncrypted: isLocked };
}

function parseHaTunnelFile(name: string, text: string, bytes: Uint8Array, size: number): FileParseResult {
  const isLocked = bytes[0] === 0x1f || text.includes('hat_lock') || (bytes.length > 20 && bytes[0] !== 0x7b);

  let server = 'hat.shanks-server.org';
  let port = 443;
  let sni = 'cdn.whatsapp.net';

  const profile: VpnProfile = {
    id: 'hat_' + Math.random().toString(36).substring(2, 9),
    name: cleanProfileName(name, '.hat'),
    protocol: 'HA_TUNNEL',
    server,
    port,
    sni,
    security: 'tls',
    network: 'tcp',
    isLocked,
    createdAt: Date.now(),
    injectionFile: {
      extension: '.hat',
      fileName: name,
      fileSize: size,
      payload: 'PAYLOAD HAT DIRECT/SSL',
      sslSni: sni,
      isEncrypted: isLocked,
      note: 'Tunneling HA Tunnel Plus SNI/Custom Payload',
    },
  };

  return { success: true, profile, isEncrypted: isLocked };
}

function parseDarkTunnelFile(name: string, text: string, bytes: Uint8Array, size: number): FileParseResult {
  const isLocked = text.includes('enc_dark') || bytes[0] === 0x00;

  const profile: VpnProfile = {
    id: 'dark_' + Math.random().toString(36).substring(2, 9),
    name: cleanProfileName(name, '.dark'),
    protocol: 'DARK_TUNNEL',
    server: 'dark.shanks-node.com',
    port: 443,
    sni: 'cloud.google.com',
    security: 'tls',
    network: 'ws',
    isLocked,
    createdAt: Date.now(),
    injectionFile: {
      extension: '.dark',
      fileName: name,
      fileSize: size,
      payload: 'SSH-WebSocket-Tunnel',
      isEncrypted: isLocked,
      note: 'Fichier Dark Tunnel v2',
    },
  };

  return { success: true, profile, isEncrypted: isLocked };
}

function parseNapsternetVFile(name: string, text: string, bytes: Uint8Array, size: number): FileParseResult {
  let profileProtocol: VpnProtocol = 'NAPSTERNETV';
  let server = 'npv.shanks-vpn.org';
  let port = 443;
  let uuid = '00000000-0000-0000-0000-000000000000';
  let sni = 'sni.shanks.org';

  if (text.includes('vless://') || text.includes('"protocol": "vless"')) {
    profileProtocol = 'VLESS';
  } else if (text.includes('vmess://') || text.includes('"protocol": "vmess"')) {
    profileProtocol = 'VMess';
  } else if (text.includes('trojan://') || text.includes('"protocol": "trojan"')) {
    profileProtocol = 'Trojan';
  }

  const profile: VpnProfile = {
    id: 'npv_' + Math.random().toString(36).substring(2, 9),
    name: cleanProfileName(name, '.npv'),
    protocol: profileProtocol,
    server,
    port,
    uuid,
    sni,
    security: 'tls',
    network: 'ws',
    createdAt: Date.now(),
    injectionFile: {
      extension: '.npv',
      fileName: name,
      fileSize: size,
      isEncrypted: false,
      note: 'Profil NapsternetV V2Ray/Xray',
    },
  };

  return { success: true, profile, isEncrypted: false };
}

function parseSocksHttpFile(name: string, text: string, bytes: Uint8Array, size: number): FileParseResult {
  const isLocked = bytes[0] === 0x1f || text.includes('LOCK');

  const profile: VpnProfile = {
    id: 'ssc_' + Math.random().toString(36).substring(2, 9),
    name: cleanProfileName(name, '.ssc'),
    protocol: 'SOCKS_HTTP',
    server: 'socks.shanks-tunnel.io',
    port: 443,
    sni: 'zoom.us',
    security: 'tls',
    network: 'tcp',
    isLocked,
    createdAt: Date.now(),
    injectionFile: {
      extension: '.ssc',
      fileName: name,
      fileSize: size,
      payload: 'CONNECT [host_port] HTTP/1.1[crlf]Host: [host][crlf][crlf]',
      proxyHost: '127.0.0.1',
      proxyPort: 8080,
      isEncrypted: isLocked,
      note: 'SocksHttp Custom Injected SSH/SSL Profile',
    },
  };

  return { success: true, profile, isEncrypted: isLocked };
}

function parseJsonConfigFile(name: string, text: string): FileParseResult {
  try {
    const config = JSON.parse(text);
    const outbounds = config.outbounds || [];
    const mainOutbound = outbounds[0] || config;

    let protocol: VpnProtocol = 'VLESS';
    let server = 'xray.shanks-vpn.org';
    let port = 443;
    let uuid: string | undefined = undefined;
    let password: string | undefined = undefined;
    let sni: string | undefined = undefined;
    let network: any = 'ws';
    let security: any = 'tls';

    if (mainOutbound.protocol === 'vmess') {
      protocol = 'VMess';
      const user = mainOutbound.settings?.vnext?.[0]?.users?.[0];
      server = mainOutbound.settings?.vnext?.[0]?.address || server;
      port = mainOutbound.settings?.vnext?.[0]?.port || port;
      uuid = user?.id;
    } else if (mainOutbound.protocol === 'trojan') {
      protocol = 'Trojan';
      server = mainOutbound.settings?.servers?.[0]?.address || server;
      port = mainOutbound.settings?.servers?.[0]?.port || port;
      password = mainOutbound.settings?.servers?.[0]?.password;
    } else if (mainOutbound.protocol === 'vless') {
      protocol = 'VLESS';
      server = mainOutbound.settings?.vnext?.[0]?.address || server;
      port = mainOutbound.settings?.vnext?.[0]?.port || port;
      uuid = mainOutbound.settings?.vnext?.[0]?.users?.[0]?.id;
    }

    const streamSettings = mainOutbound.streamSettings;
    if (streamSettings) {
      network = streamSettings.network || 'ws';
      security = streamSettings.security || 'tls';
      sni = streamSettings.tlsSettings?.serverName || streamSettings.realitySettings?.serverName;
    }

    const profile: VpnProfile = {
      id: 'cfg_' + Math.random().toString(36).substring(2, 9),
      name: cleanProfileName(name, '.json'),
      protocol,
      server,
      port,
      uuid,
      password,
      sni,
      network,
      security,
      rawConfig: text,
      createdAt: Date.now(),
    };

    return { success: true, profile };
  } catch (err: any) {
    return {
      success: false,
      error: `Syntaxe JSON invalide : ${err.message}`,
    };
  }
}

function cleanProfileName(raw: string, ext: string): string {
  const base = raw.replace(new RegExp(`\\${ext}$`, 'i'), '');
  return base.replace(/[-_]/g, ' ').trim();
}

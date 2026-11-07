/**
 * SHANKS VPN - VLESS, VMess, and Trojan Link Parsers
 * Robust RFC compliant parsers with query decoding and base64 handling
 */

import { VpnProfile } from '../../types/vpn';

export function parseVpnLink(link: string): VpnProfile | null {
  const trimmed = link.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('vless://')) {
      return parseVlessLink(trimmed);
    } else if (trimmed.startsWith('vmess://')) {
      return parseVmessLink(trimmed);
    } else if (trimmed.startsWith('trojan://')) {
      return parseTrojanLink(trimmed);
    }
  } catch (error) {
    console.error('Failed to parse VPN link:', error);
  }

  return null;
}

/**
 * Parses vless://uuid@host:port?type=ws&security=tls&path=%2Fws&sni=host.com#ProfileName
 */
export function parseVlessLink(link: string): VpnProfile | null {
  try {
    const raw = link.replace(/^vless:\/\//i, '');
    const hashIndex = raw.indexOf('#');
    let configPart = raw;
    let remark = 'VLESS Tunnel';

    if (hashIndex !== -1) {
      configPart = raw.substring(0, hashIndex);
      try {
        remark = decodeURIComponent(raw.substring(hashIndex + 1));
      } catch {
        remark = raw.substring(hashIndex + 1);
      }
    }

    const atIndex = configPart.indexOf('@');
    if (atIndex === -1) return null;

    const uuid = configPart.substring(0, atIndex);
    const remainder = configPart.substring(atIndex + 1);

    const questionIndex = remainder.indexOf('?');
    let hostPort = remainder;
    let queryString = '';

    if (questionIndex !== -1) {
      hostPort = remainder.substring(0, questionIndex);
      queryString = remainder.substring(questionIndex + 1);
    }

    const [server, portStr] = hostPort.split(':');
    if (!server) return null;
    const port = parseInt(portStr, 10) || 443;

    const params = new URLSearchParams(queryString);
    const security = (params.get('security') as any) || (port === 443 ? 'tls' : 'none');
    const network = (params.get('type') as any) || 'ws';
    const path = params.get('path') ? decodeURIComponent(params.get('path')!) : '/';
    const sni = params.get('sni') || params.get('host') || server;
    const flow = params.get('flow') || undefined;

    return {
      id: 'vless_' + Math.random().toString(36).substring(2, 9),
      name: remark || `VLESS - ${server}`,
      protocol: 'VLESS',
      server,
      port,
      uuid,
      security,
      network,
      path,
      sni,
      flow,
      countryCode: detectCountryCode(server),
      createdAt: Date.now(),
      rawConfig: link,
      isFavorite: false,
    };
  } catch (err) {
    console.error('Error parsing VLESS link:', err);
    return null;
  }
}

/**
 * Parses vmess://<base64_encoded_json>
 */
export function parseVmessLink(link: string): VpnProfile | null {
  try {
    const b64 = link.replace(/^vmess:\/\//i, '').trim();
    let jsonStr = '';

    try {
      jsonStr = atob(b64);
    } catch {
      // Try URL-safe base64
      const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
      const pad = normalized.length % 4;
      const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
      jsonStr = atob(padded);
    }

    const data = JSON.parse(jsonStr);

    const server = data.add || data.host || '';
    if (!server) return null;

    const port = typeof data.port === 'number' ? data.port : parseInt(data.port, 10) || 443;
    const uuid = data.id || '';
    const alterId = typeof data.aid === 'number' ? data.aid : parseInt(data.aid, 10) || 0;
    const network = (data.net || 'ws').toLowerCase();
    const security = data.tls === 'tls' || port === 443 ? 'tls' : 'none';
    const path = data.path || '/';
    const sni = data.sni || data.host || server;
    const remark = data.ps || `VMess - ${server}`;

    return {
      id: 'vmess_' + Math.random().toString(36).substring(2, 9),
      name: remark,
      protocol: 'VMess',
      server,
      port,
      uuid,
      alterId,
      security: security as any,
      network: network as any,
      path,
      sni,
      countryCode: detectCountryCode(server),
      createdAt: Date.now(),
      rawConfig: link,
      isFavorite: false,
    };
  } catch (err) {
    console.error('Error parsing VMess link:', err);
    return null;
  }
}

/**
 * Parses trojan://password@host:port?security=tls&sni=host.com#ProfileName
 */
export function parseTrojanLink(link: string): VpnProfile | null {
  try {
    const raw = link.replace(/^trojan:\/\//i, '');
    const hashIndex = raw.indexOf('#');
    let configPart = raw;
    let remark = 'Trojan Tunnel';

    if (hashIndex !== -1) {
      configPart = raw.substring(0, hashIndex);
      try {
        remark = decodeURIComponent(raw.substring(hashIndex + 1));
      } catch {
        remark = raw.substring(hashIndex + 1);
      }
    }

    const atIndex = configPart.indexOf('@');
    if (atIndex === -1) return null;

    const password = configPart.substring(0, atIndex);
    const remainder = configPart.substring(atIndex + 1);

    const questionIndex = remainder.indexOf('?');
    let hostPort = remainder;
    let queryString = '';

    if (questionIndex !== -1) {
      hostPort = remainder.substring(0, questionIndex);
      queryString = remainder.substring(questionIndex + 1);
    }

    const [server, portStr] = hostPort.split(':');
    if (!server) return null;
    const port = parseInt(portStr, 10) || 443;

    const params = new URLSearchParams(queryString);
    const security = (params.get('security') as any) || 'tls';
    const network = (params.get('type') as any) || 'tcp';
    const sni = params.get('sni') || server;

    return {
      id: 'trojan_' + Math.random().toString(36).substring(2, 9),
      name: remark || `Trojan - ${server}`,
      protocol: 'Trojan',
      server,
      port,
      password,
      security,
      network,
      sni,
      countryCode: detectCountryCode(server),
      createdAt: Date.now(),
      rawConfig: link,
      isFavorite: false,
    };
  } catch (err) {
    console.error('Error parsing Trojan link:', err);
    return null;
  }
}

function detectCountryCode(server: string): string {
  const lower = server.toLowerCase();
  if (lower.includes('.fr') || lower.includes('paris') || lower.includes('france')) return 'FR';
  if (lower.includes('.de') || lower.includes('frankfurt') || lower.includes('germany')) return 'DE';
  if (lower.includes('.sg') || lower.includes('singapore')) return 'SG';
  if (lower.includes('.us') || lower.includes('usa') || lower.includes('america')) return 'US';
  if (lower.includes('.nl') || lower.includes('amsterdam') || lower.includes('netherlands')) return 'NL';
  if (lower.includes('.uk') || lower.includes('london') || lower.includes('gb')) return 'GB';
  if (lower.includes('.ca') || lower.includes('canada')) return 'CA';
  if (lower.includes('.jp') || lower.includes('tokyo') || lower.includes('japan')) return 'JP';
  if (lower.includes('.br') || lower.includes('brazil')) return 'BR';
  return 'UN';
}

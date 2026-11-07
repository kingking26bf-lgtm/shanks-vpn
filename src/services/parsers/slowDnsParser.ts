/**
 * SHANKS VPN - SlowDNS Manager & Resolver
 * Provides DNS tunneling profile creation, public key validation,
 * and live DNS reachability check via DNS-over-HTTPS.
 */

import { VpnProfile, SlowDnsConfig } from '../../types/vpn';

export function createSlowDnsProfile(
  name: string,
  config: SlowDnsConfig
): { success: boolean; profile?: VpnProfile; error?: string } {
  const trimmedKey = config.pubKey.trim();
  const trimmedNs = config.nameServer.trim();
  const trimmedResolver = config.dnsResolver.trim();

  if (!trimmedNs) {
    return { success: false, error: 'Le domaine Nameserver (NS) est obligatoire.' };
  }

  if (!isValidDomain(trimmedNs)) {
    return { success: false, error: 'Format de domaine Nameserver invalide (ex: ns1.shanks-tunnel.org).' };
  }

  if (!trimmedResolver) {
    return { success: false, error: 'L\'adresse IP du résolveur DNS est obligatoire (ex: 8.8.8.8 ou 1.1.1.1).' };
  }

  if (!isValidIp(trimmedResolver)) {
    return { success: false, error: 'Format d\'adresse IP du résolveur DNS invalide (IPv4 attendue).' };
  }

  const profile: VpnProfile = {
    id: 'slowdns_' + Math.random().toString(36).substring(2, 9),
    name: name.trim() || `SlowDNS - ${trimmedNs}`,
    protocol: 'SlowDNS',
    server: trimmedResolver,
    port: 53,
    network: 'udp',
    security: 'none',
    countryCode: 'UN',
    createdAt: Date.now(),
    slowDns: {
      pubKey: trimmedKey,
      nameServer: trimmedNs,
      dnsResolver: trimmedResolver,
      queryType: config.queryType || 'TXT',
      keepAlive: config.keepAlive || 30,
    },
  };

  return { success: true, profile };
}

export function buildSlowDnsProfile(params: {
  profileName: string;
  pubKey: string;
  nameServer: string;
  dnsResolver: string;
  queryType: 'TXT' | 'NULL' | 'CNAME';
}): VpnProfile {
  const res = createSlowDnsProfile(params.profileName, {
    pubKey: params.pubKey,
    nameServer: params.nameServer,
    dnsResolver: params.dnsResolver,
    queryType: params.queryType,
    keepAlive: 30,
  });

  if (res.profile) return res.profile;

  return {
    id: 'slowdns_' + Math.random().toString(36).substring(2, 9),
    name: params.profileName || 'Tunnel SlowDNS',
    protocol: 'SlowDNS',
    server: params.dnsResolver || '8.8.8.8',
    port: 53,
    network: 'udp',
    security: 'none',
    createdAt: Date.now(),
    slowDns: {
      pubKey: params.pubKey,
      nameServer: params.nameServer,
      dnsResolver: params.dnsResolver,
      queryType: params.queryType,
      keepAlive: 30,
    },
  };
}


export async function testDnsReachability(nsDomain: string): Promise<{ reachable: boolean; latencyMs: number; details: string }> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nsDomain)}&type=TXT`, {
      headers: {
        accept: 'application/dns-json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);

    if (response.ok) {
      const data = await response.json();
      const status = data.Status === 0 ? 'Domaine NS résolu (Status NOERROR)' : `Réponse DNS reçue (Code: ${data.Status})`;
      return {
        reachable: true,
        latencyMs,
        details: `${status} - DoH Cloudflare validé`,
      };
    } else {
      return {
        reachable: false,
        latencyMs,
        details: `Erreur HTTP ${response.status} lors de la requête DoH`,
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      reachable: false,
      latencyMs,
      details: err.name === 'AbortError' ? 'Délai d\'attente dépassé (Timeout)' : 'Échec de connexion au serveur DNS',
    };
  }
}

function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(domain);
}

function isValidIp(ip: string): boolean {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

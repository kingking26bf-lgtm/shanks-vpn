/**
 * SHANKS VPN - Cloud & Clipboard Subscription Parser
 * Fetches remote Cloud subscriptions (Base64 lists, JSON outbounds)
 * and extracts batch VPN profiles from clipboard strings.
 */

import { VpnProfile } from '../../types/vpn';
import { parseVpnLink } from './linkParser';

export interface CloudSubscriptionResult {
  success: boolean;
  profiles: VpnProfile[];
  sourceUrl?: string;
  count: number;
  error?: string;
}

export function parseSubscriptionText(rawText: string, defaultSource: string = 'Presse-papiers'): VpnProfile[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  let contentToProcess = trimmed;

  // Check if entire text is a single Base64 encoded block containing multiple lines
  if (!trimmed.includes('://') && /^[A-Za-z0-9+/=\s\-_]+$/.test(trimmed)) {
    try {
      const cleanB64 = trimmed.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
      const pad = cleanB64.length % 4;
      const padded = pad ? cleanB64 + '='.repeat(4 - pad) : cleanB64;
      const decoded = atob(padded);
      if (decoded.includes('://') || decoded.includes('{')) {
        contentToProcess = decoded;
      }
    } catch {}
  }

  const lines = contentToProcess.split(/\r?\n/);
  const profiles: VpnProfile[] = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith('#') || l.startsWith('//')) continue;

    if (l.startsWith('vless://') || l.startsWith('vmess://') || l.startsWith('trojan://')) {
      const parsed = parseVpnLink(l);
      if (parsed) {
        profiles.push(parsed);
      }
    }
  }

  if (profiles.length === 0) {
    const single = parseVpnLink(trimmed);
    if (single) profiles.push(single);
  }

  return profiles;
}

export async function fetchCloudSubscription(url: string): Promise<CloudSubscriptionResult> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return {
      success: false,
      profiles: [],
      count: 0,
      error: 'L\'URL doit commencer par http:// ou https://',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let responseText = '';
    try {
      const res = await fetch(trimmedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'v2rayNG/1.8.16 (Android; SHANKS-VPN)',
          'Accept': 'text/plain, application/json, */*',
        },
      });
      if (res.ok) {
        responseText = await res.text();
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`;
      const proxyRes = await fetch(proxyUrl, { signal: controller.signal });
      if (proxyRes.ok) {
        responseText = await proxyRes.text();
      } else {
        throw new Error('Impossible d\'accéder à l\'URL d\'abonnement');
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!responseText) {
      return {
        success: false,
        profiles: [],
        count: 0,
        error: 'Réponse vide du serveur Cloud',
      };
    }

    if (responseText.trim().startsWith('{')) {
      try {
        const json = JSON.parse(responseText);
        if (json.outbounds && Array.isArray(json.outbounds)) {
          const profiles: VpnProfile[] = [];
          for (const ob of json.outbounds) {
            if (['vless', 'vmess', 'trojan'].includes(ob.protocol)) {
              profiles.push({
                id: 'cloud_' + Math.random().toString(36).substring(2, 9),
                name: ob.tag || `Cloud ${ob.protocol.toUpperCase()}`,
                protocol: ob.protocol.toUpperCase() as any,
                server: ob.settings?.vnext?.[0]?.address || ob.settings?.servers?.[0]?.address || 'cloud.shanks-server.net',
                port: ob.settings?.vnext?.[0]?.port || ob.settings?.servers?.[0]?.port || 443,
                uuid: ob.settings?.vnext?.[0]?.users?.[0]?.id,
                password: ob.settings?.servers?.[0]?.password,
                security: 'tls',
                network: 'ws',
                createdAt: Date.now(),
              });
            }
          }
          if (profiles.length > 0) {
            return {
              success: true,
              profiles,
              sourceUrl: trimmedUrl,
              count: profiles.length,
            };
          }
        }
      } catch {}
    }

    const profiles = parseSubscriptionText(responseText, 'Abonnement Cloud');
    if (profiles.length === 0) {
      return {
        success: false,
        profiles: [],
        count: 0,
        error: 'Aucune configuration VPN valide (VLESS, VMess, Trojan) trouvée dans l\'abonnement Cloud.',
      };
    }

    return {
      success: true,
      profiles,
      sourceUrl: trimmedUrl,
      count: profiles.length,
    };
  } catch (err: any) {
    return {
      success: false,
      profiles: [],
      count: 0,
      error: `Erreur Cloud: ${err.message || 'Délai d\'attente dépassé'}`,
    };
  }
}

export const OFFICIAL_CLOUD_PRESETS = [
  {
    name: 'Pack Cloud Haute Vitesse Europe (VLESS / VMess)',
    url: 'https://raw.githubusercontent.com/shanks-vpn/configs/main/eu-cluster.txt',
    nodesCount: 6,
    region: 'Europe (FR, DE, NL)',
    type: 'VLESS + VMess CDN',
  },
  {
    name: 'Pack Cloud Asie & Océanie (Faible Latence)',
    url: 'https://raw.githubusercontent.com/shanks-vpn/configs/main/asia-speed.txt',
    nodesCount: 5,
    region: 'Asie (SG, JP)',
    type: 'VLESS Reality 0-RTT',
  },
  {
    name: 'Pack Anti-Censure & Bug Host SNI',
    url: 'https://raw.githubusercontent.com/shanks-vpn/configs/main/stealth-nodes.txt',
    nodesCount: 4,
    region: 'Global Multi-Hop',
    type: 'Trojan + SlowDNS',
  },
];

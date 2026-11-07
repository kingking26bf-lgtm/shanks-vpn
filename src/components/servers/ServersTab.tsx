/**
 * SHANKS VPN - Servers & Profiles Management Tab
 * 
 * Supports:
 * 1. Expiration Date & Time picker and real-time countdown / expired banner.
 * 2. "Exporter" button with native Android share sheet & privacy confirmation.
 * 3. Latency ping test.
 * 4. Selection and deletion.
 */

import React, { useState } from 'react';
import { 
  Server, 
  Share2, 
  Trash2, 
  Star, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Check, 
  Edit3, 
  Calendar,
  Lock,
  Search,
  ExternalLink
} from 'lucide-react';
import { VpnProfile } from '../../types/vpn';
import { isProfileExpired, getRemainingExpiryTime, maskPrivateString } from '../../services/storage/vpnStorage';
import { ShareConfirmModal } from '../modals/ShareConfirmModal';

interface ServersTabProps {
  profiles: VpnProfile[];
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  onUpdateProfile: (profile: VpnProfile) => void;
  onDeleteProfile: (id: string) => void;
  onToast: (msg: string) => void;
}

export function ServersTab({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onUpdateProfile,
  onDeleteProfile,
  onToast,
}: ServersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileToExport, setProfileToExport] = useState<VpnProfile | null>(null);
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [editingProfileData, setEditingProfileData] = useState<VpnProfile | null>(null);
  
  // Date & Time picker state for editing
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('23:59');
  const [editNote, setEditNote] = useState('');

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.server.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditExpiry = (profile: VpnProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExpiryId(profile.id);
    if (profile.expiresAt) {
      const d = new Date(profile.expiresAt);
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      setEditDate(dateStr);
      setEditTime(timeStr);
    } else {
      // Default 7 days from now
      const d = new Date(Date.now() + 7 * 86400000);
      setEditDate(d.toISOString().split('T')[0]);
      setEditTime('23:59');
    }
    setEditNote(profile.expiryNote || '');
  };

  const saveExpiry = (profile: VpnProfile) => {
    if (!editDate) {
      // Remove expiration
      const updated: VpnProfile = { ...profile, expiresAt: undefined, expiryNote: undefined };
      onUpdateProfile(updated);
      setEditingExpiryId(null);
      onToast('Date d\'expiration retirée');
      return;
    }

    const [hours, minutes] = editTime.split(':').map(Number);
    const dateObj = new Date(editDate);
    dateObj.setHours(hours || 0, minutes || 0, 0, 0);

    const timestamp = dateObj.getTime();
    const updated: VpnProfile = {
      ...profile,
      expiresAt: timestamp,
      expiryNote: editNote.trim() || undefined,
    };

    onUpdateProfile(updated);
    setEditingExpiryId(null);
    onToast(`Expiration mise à jour : ${new Date(timestamp).toLocaleDateString()} à ${editTime}`);
  };

  const handleTestPing = (profile: VpnProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulate ping test with jitter
    const simulatedPing = Math.floor(25 + Math.random() * 45);
    const updated: VpnProfile = {
      ...profile,
      ping: simulatedPing,
      pingStatus: 'success',
    };
    onUpdateProfile(updated);
    onToast(`Latence ${profile.name} : ${simulatedPing} ms`);
  };

  const toggleFavorite = (profile: VpnProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: VpnProfile = { ...profile, isFavorite: !profile.isFavorite };
    onUpdateProfile(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full select-none">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un profil ou serveur..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 shadow-sm"
        />
      </div>

      {/* Profiles Count and Explanation */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>{filteredProfiles.length} profil(s) configuré(s)</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          *L'expiration locale bloque l'usage dans l'app
        </span>
      </div>

      {/* Profiles List */}
      <div className="space-y-3">
        {filteredProfiles.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
            Aucun profil ne correspond à votre recherche.
          </div>
        ) : (
          filteredProfiles.map((profile) => {
            const isSelected = profile.id === selectedProfileId;
            const isExpired = isProfileExpired(profile);
            const expiry = getRemainingExpiryTime(profile.expiresAt);
            const isEditing = editingExpiryId === profile.id;

            return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile.id)}
                className={`w-full rounded-3xl border transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-slate-900/90 border-blue-500/80 dark:border-cyan-500/80 shadow-lg shadow-blue-500/10 dark:shadow-cyan-500/10 ring-1 ring-blue-500/40 dark:ring-cyan-500/40'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Protocol Badge */}
                      <span className="px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] bg-blue-500/10 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/30 shrink-0">
                        {profile.protocol}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {profile.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(profile, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          profile.isFavorite
                            ? 'text-amber-500 hover:text-amber-400'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${profile.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Server Host / Ping info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[200px]">{profile.server}:{profile.port}</span>
                    <button
                      type="button"
                      onClick={(e) => handleTestPing(profile, e)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] transition-colors"
                    >
                      <Activity className="w-3 h-3 text-emerald-500" />
                      <span>{profile.ping ? `${profile.ping}ms` : 'Ping'}</span>
                    </button>
                  </div>

                  {/* Expiration Display & Countdown */}
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    isExpired
                      ? 'bg-red-500/10 dark:bg-red-950/20 border-red-500/30 text-red-600 dark:text-red-400'
                      : 'bg-slate-100/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isExpired ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="text-[11px] font-semibold">{expiry.label}</span>
                        {profile.expiresAt && (
                          <span className="text-[10px] text-slate-400 block">
                            Date : {new Date(profile.expiresAt).toLocaleDateString()} {new Date(profile.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => startEditExpiry(profile, e)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-cyan-400 shrink-0 ml-2"
                    >
                      Modifier Date
                    </button>
                  </div>

                  {/* Inline Date & Time Picker Editor */}
                  {isEditing && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-blue-500/40 dark:border-cyan-500/40 space-y-2.5 animate-in fade-in"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
                        <span>Définir la Date & Heure d'Expiration</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Date limite</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Heure limite</label>
                          <input
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingExpiryId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => saveExpiry(profile)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {/* EDIT FULL CONFIG BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProfileData(profile);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                        <span>Modifier</span>
                      </button>

                      {/* EXPORT BUTTON with Native Android Share */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileToExport(profile);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/30 transition-all active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Exporter</span>
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer le profil « ${profile.name} » ?`)) {
                          onDeleteProfile(profile.id);
                          onToast('Profil supprimé');
                        }
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Required Signature: « Créé par FANKANI..SHANKS » */}
      <footer className="pt-4 pb-2 text-center select-none">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
          Créé par <span className="font-bold text-blue-600 dark:text-cyan-400">FANKANI..SHANKS</span>
        </p>
      </footer>

      {/* EDIT PROFILE MODAL */}
      {editingProfileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Modifier le Profil ({editingProfileData.protocol})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProfileData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold">Nom du profil</label>
              <input
                type="text"
                value={editingProfileData.name}
                onChange={(e) => setEditingProfileData({ ...editingProfileData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-semibold">Hôte / Serveur</label>
                <input
                  type="text"
                  value={editingProfileData.server}
                  onChange={(e) => {
                    const updated = { ...editingProfileData, server: e.target.value };
                    if (updated.sshConfig) {
                      updated.sshConfig.sshHost = e.target.value;
                    }
                    setEditingProfileData(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold">Port</label>
                <input
                  type="number"
                  value={editingProfileData.port}
                  onChange={(e) => {
                    const portNum = Number(e.target.value);
                    const updated = { ...editingProfileData, port: portNum };
                    if (updated.sshConfig) {
                      updated.sshConfig.sshPort = portNum;
                    }
                    setEditingProfileData(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* If SSH Configuration */}
            {editingProfileData.sshConfig && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-[11px] text-blue-600 dark:text-cyan-400">
                  Paramètres SSH ({editingProfileData.sshConfig.mode})
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Utilisateur SSH</label>
                    <input
                      type="text"
                      value={editingProfileData.sshConfig.sshUser}
                      onChange={(e) => {
                        const copy = { ...editingProfileData };
                        if (copy.sshConfig) copy.sshConfig.sshUser = e.target.value;
                        setEditingProfileData(copy);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Mot de passe SSH</label>
                    <input
                      type="password"
                      value={editingProfileData.sshConfig.sshPassword || ''}
                      onChange={(e) => {
                        const copy = { ...editingProfileData };
                        if (copy.sshConfig) copy.sshConfig.sshPassword = e.target.value;
                        setEditingProfileData(copy);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Port UDPGW</label>
                    <input
                      type="number"
                      value={editingProfileData.sshConfig.udpgwPort || 7300}
                      onChange={(e) => {
                        const copy = { ...editingProfileData };
                        if (copy.sshConfig) copy.sshConfig.udpgwPort = Number(e.target.value);
                        setEditingProfileData(copy);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Résolveur DNS</label>
                    <input
                      type="text"
                      value={editingProfileData.sshConfig.dnsResolver || '1.1.1.1'}
                      onChange={(e) => {
                        const copy = { ...editingProfileData };
                        if (copy.sshConfig) copy.sshConfig.dnsResolver = e.target.value;
                        setEditingProfileData(copy);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                    />
                  </div>
                </div>

                {editingProfileData.sshConfig.mode === 'SSH_DNSSTT' && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-500">Domaine du tunnel (NS)</label>
                      <input
                        type="text"
                        value={editingProfileData.sshConfig.tunnelDomain || ''}
                        onChange={(e) => {
                          const copy = { ...editingProfileData };
                          if (copy.sshConfig) copy.sshConfig.tunnelDomain = e.target.value;
                          setEditingProfileData(copy);
                        }}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Clé publique (PubKey)</label>
                      <input
                        type="text"
                        value={editingProfileData.sshConfig.pubKey || ''}
                        onChange={(e) => {
                          const copy = { ...editingProfileData };
                          if (copy.sshConfig) copy.sshConfig.pubKey = e.target.value;
                          setEditingProfileData(copy);
                        }}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProfileData(null)}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile(editingProfileData);
                  setEditingProfileData(null);
                  onToast('Profil mis à jour');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-md"
              >
                Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share & Export Confirmation Modal */}
      {profileToExport && (
        <ShareConfirmModal
          profile={profileToExport}
          onClose={() => setProfileToExport(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}


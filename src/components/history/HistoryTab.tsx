/**
 * SHANKS VPN - History & Terminal Logs Tab
 * Tracks VPN connection sessions and displays the real-time VpnService engine logs.
 */

import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Terminal, 
  Trash2, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { ConnectionSession, ConnectionLogEntry } from '../../types/vpn';

interface HistoryTabProps {
  sessions: ConnectionSession[];
  logs: ConnectionLogEntry[];
  onClearHistory: () => void;
  onClearLogs: () => void;
  onToast: (msg: string) => void;
}

export function HistoryTab({
  sessions,
  logs,
  onClearHistory,
  onClearLogs,
  onToast,
}: HistoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'logs'>('sessions');
  const [copied, setCopied] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const copyLogs = () => {
    const raw = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level}] [${l.tag}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    onToast('Logs copiés');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full select-none">
      {/* Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'sessions'
              ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'logs'
              ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Journal Noyau ({logs.length})</span>
        </button>
      </div>

      {/* SESSIONS VIEW */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Historique des tunnels établis</span>
            {sessions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Effacer tout l\'historique des sessions ?')) {
                    onClearHistory();
                    onToast('Historique effacé');
                  }
                }}
                className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
              Aucune session enregistrée pour le moment.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] bg-blue-500/10 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/30">
                      {session.protocol}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {session.profileName}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDownCircle className="w-3 h-3 text-cyan-500" />
                    <span>{formatBytes(session.totalDownload)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUpCircle className="w-3 h-3 text-emerald-500" />
                    <span>{formatBytes(session.totalUpload)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LOGS VIEW */}
      {activeSubTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Événements VpnService en temps réel</span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLogs}
                className="text-blue-600 dark:text-cyan-400 hover:opacity-80 font-medium flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
              <button
                onClick={onClearLogs}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-3xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5 max-h-[420px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-4">
                En attente d'événements du moteur VPN...
              </div>
            ) : (
              logs.map((log) => {
                let badgeClass = 'text-cyan-400';
                if (log.level === 'SUCCESS') badgeClass = 'text-emerald-400 font-bold';
                if (log.level === 'WARN') badgeClass = 'text-amber-400';
                if (log.level === 'ERROR') badgeClass = 'text-red-400 font-bold';

                return (
                  <div key={log.id} className="leading-snug flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`shrink-0 ${badgeClass}`}>
                      [{log.tag}]
                    </span>
                    <span className="text-slate-300 break-all">
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Required Signature: « Créé par FANKANI..SHANKS » */}
      <footer className="pt-4 pb-2 text-center select-none">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
          Créé par <span className="font-bold text-blue-600 dark:text-cyan-400">FANKANI..SHANKS</span>
        </p>
      </footer>
    </div>
  );
}

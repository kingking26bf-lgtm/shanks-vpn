/**
 * SHANKS VPN - Android Touch Bottom Navigation Bar
 * Ergonomic navigation optimized for one-handed mobile touch use
 */

import React from 'react';
import { 
  Zap, 
  FileDown, 
  Server, 
  History, 
  Settings 
} from 'lucide-react';

export type NavTabId = 'dashboard' | 'import' | 'servers' | 'history' | 'settings';

interface BottomTabBarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  isConnected: boolean;
  profilesCount: number;
}

export function BottomTabBar({ activeTab, onTabChange, isConnected, profilesCount }: BottomTabBarProps) {
  const tabs: { id: NavTabId; label: string; icon: React.ComponentType<any>; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Accueil', icon: Zap },
    { id: 'import', label: 'Importer', icon: FileDown },
    { id: 'servers', label: 'Serveurs', icon: Server, badge: profilesCount },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  return (
    <nav className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-2 py-1.5 select-none z-30 transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Highlight pill behind active icon */}
              {isActive && (
                <span className="absolute inset-0 bg-blue-50 dark:bg-cyan-500/10 rounded-2xl -z-10 border border-blue-500/20 dark:border-cyan-500/30" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.id === 'dashboard' && isConnected && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                )}
                {tab.badge !== undefined && typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

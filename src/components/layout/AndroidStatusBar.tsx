/**
 * SHANKS VPN - Android Status Bar Header
 * Native Android status bar with clock, battery, Wi-Fi / LTE, and key VPN status
 */

import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Shield, Zap, Info } from 'lucide-react';
import { ConnectionState } from '../../types/vpn';

interface AndroidStatusBarProps {
  connectionState: ConnectionState;
  onOpenTransparencyModal: () => void;
}

export function AndroidStatusBar({ connectionState, onOpenTransparencyModal }: AndroidStatusBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = connectionState === 'CONNECTED';
  const isConnecting = connectionState === 'CONNECTING';

  return (
    <header className="w-full select-none z-30 transition-colors duration-200">
      {/* Android Top Pill Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[12px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600">
        <span className="font-mono tracking-tight text-slate-800 dark:text-slate-200">
          {currentTime || '12:00'}
        </span>

        {/* Center notch / Android punch-hole cam imitation */}
        <div className="w-4 h-4 rounded-full bg-slate-900/90 dark:bg-slate-950 border border-slate-700/50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
        </div>

        {/* Status icons: WiFi, 5G, Battery */}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {isConnected && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/30">
              <Shield className="w-2.5 h-2.5" />
              <span>VPN</span>
            </div>
          )}
          <span className="text-[10px] font-bold tracking-tighter">5G</span>
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>

      {/* App Branding Top Nav */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-sm">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-wider bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 dark:from-white dark:via-cyan-200 dark:to-cyan-400 bg-clip-text text-transparent">
                SHANKS VPN
              </h1>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 font-bold border border-blue-500/20 dark:border-cyan-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              VpnService Android Core
            </p>
          </div>
        </div>

        {/* Transparency & Core Spec Button */}
        <button
          onClick={onOpenTransparencyModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700/80 transition-all active:scale-95"
          title="Architecture Android VpnService & Code Kotlin"
        >
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
          <span className="hidden xs:inline">Noyau</span>
        </button>
      </div>

      {/* Engine Status Banner */}
      {isConnecting && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Négociation TLS et Poignée de main tun0...</span>
        </div>
      )}
    </header>
  );
}

/**
 * SHANKS VPN - Real-time Bandwidth Speed Chart
 * Uses Recharts AreaChart for live upload and download speed telemetry
 */

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { SpeedDataPoint } from '../../types/vpn';

interface RealtimeSpeedChartProps {
  data: SpeedDataPoint[];
  downloadSpeed: number; // bytes/sec
  uploadSpeed: number; // bytes/sec
  isConnected: boolean;
}

export function RealtimeSpeedChart({
  data,
  downloadSpeed,
  uploadSpeed,
  isConnected,
}: RealtimeSpeedChartProps) {
  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec <= 0) return '0.0 KB/s';
    if (bytesPerSec < 1024 * 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  // Provide starter placeholder points if data is empty or disconnected
  const chartData = data.length > 0 ? data : [
    { time: '0s', downloadKB: 0, uploadKB: 0 },
    { time: '1s', downloadKB: 0, uploadKB: 0 },
  ];

  return (
    <div className="w-full rounded-3xl p-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-md transition-colors">
      {/* Speeds header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
            <ArrowDownCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Descente (DL)
            </span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-cyan-300">
              {isConnected ? formatSpeed(downloadSpeed) : '0.0 KB/s'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Montée (UL)
            </span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-emerald-400">
              {isConnected ? formatSpeed(uploadSpeed) : '0.0 KB/s'}
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 9, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 9, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              unit="k"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-[11px] font-mono text-white space-y-1">
                      <div className="text-cyan-300">
                        DL: {payload[0]?.value} KB/s
                      </div>
                      <div className="text-emerald-300">
                        UL: {payload[1]?.value} KB/s
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="downloadKB"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#downloadGrad)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="uploadKB"
              stroke="#10b981"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#uploadGrad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Débit Descendant
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Débit Ascendant
        </span>
      </div>
    </div>
  );
}

import React from "react";
import { Wifi, WifiOff, RefreshCw, Layers } from "lucide-react";
import { SyncAction } from "../types";

interface OfflineSyncTerminalProps {
  isOffline: boolean;
  onToggleOffline: () => void;
  syncQueue: SyncAction[];
  onSync: () => void;
  isSyncing: boolean;
}

export default function OfflineSyncTerminal({
  isOffline,
  onToggleOffline,
  syncQueue,
  onSync,
  isSyncing,
}: OfflineSyncTerminalProps) {
  return (
    <div
      id="offline-sync-terminal"
      className={`border-b px-6 py-3 transition-colors duration-300 shrink-0 ${
        isOffline
          ? "bg-amber-50/50 border-amber-200 text-amber-950"
          : "bg-white border-[#E1E4E8] text-[#1A1C1E]"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isOffline ? (
              <div className="p-2 rounded bg-amber-100 text-amber-700 animate-pulse border border-amber-200">
                <WifiOff className="h-4 w-4" />
              </div>
            ) : (
              <div className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Wifi className="h-4 w-4" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold tracking-tight text-xs uppercase">
                {isOffline ? "Off-Grid Site Mode Enabled" : "HQ Cloud Connected"}
              </span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isOffline ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </div>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5">
              {isOffline
                ? "Active database is offline-first. Queueing outbound API audits and RFIs."
                : "Real-time synchronisation is online. Gemini-3.5-Flash active."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {syncQueue.length > 0 && (
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E1E4E8] px-3 py-1.5 rounded text-[10px] font-mono text-slate-700">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{syncQueue.length} Pending Actions Queued</span>
            </div>
          )}

          <button
            id="toggle-connectivity-btn"
            onClick={onToggleOffline}
            className={`px-3 py-1.5 rounded text-[10px] font-bold font-sans uppercase tracking-wider border transition-all cursor-pointer ${
              isOffline
                ? "bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
                : "bg-white border-[#E1E4E8] text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isOffline ? "🔌 Go Online (Sync)" : "🛰️ Simulate Off-Grid Remote Site"}
          </button>

          {syncQueue.length > 0 && (
            <button
              id="sync-now-btn"
              onClick={onSync}
              disabled={isSyncing || isOffline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold font-sans uppercase tracking-wider text-white transition-all cursor-pointer ${
                isOffline
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#0052CC] hover:bg-[#0041a3] shadow-xs"
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Push Sync Queue"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

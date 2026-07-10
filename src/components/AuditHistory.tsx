import React, { useState } from "react";
import { History, CheckCircle, XCircle, AlertCircle, ExternalLink, Trash2, Search, BarChart3, TrendingUp, ShieldAlert, Clock } from "lucide-react";
import { Bid } from "../types";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  bidId: string;
  subcontractor: string;
  trade: string;
  riskScore?: number;
  computedLeakagePercentage?: number;
  gapsCount: number;
  status: "Audited" | "Failed" | "Pending";
  error?: string;
}

interface AuditHistoryProps {
  logs: AuditLogEntry[];
  onSelectBid: (bidId: string) => void;
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
}

export default function AuditHistory({
  logs,
  onSelectBid,
  onClearLogs,
  onDeleteLog,
}: AuditHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(
    (log) =>
      log.subcontractor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalAudited = logs.filter((l) => l.status === "Audited").length;
  const avgRiskScore = totalAudited > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.riskScore || 0), 0) / totalAudited)
    : 0;
  const totalGaps = logs.reduce((sum, l) => sum + l.gapsCount, 0);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " " + date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="audit-history-component" className="bg-white border border-[#E1E4E8] rounded-xl shadow-xs overflow-hidden">
      {/* HEADER BAR */}
      <div className="border-b border-[#E1E4E8] bg-slate-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-sm uppercase tracking-wider">
              Compliance Audit Logs
            </h3>
            <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">
              Review and navigate through completed and past background audit jobs
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded transition-all cursor-pointer shadow-3xs sm:self-center self-start"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* STATS SUMMARY BANNER */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E1E4E8] bg-[#F8FAFC]/50 divide-y md:divide-y-0 md:divide-x divide-[#E1E4E8]">
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-widest font-bold text-[#64748B]">Total Audit Jobs</span>
              <span className="font-mono font-bold text-lg text-slate-800">{logs.length}</span>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-widest font-bold text-[#64748B]">Average Compliance Risk</span>
              <span className="font-mono font-bold text-lg text-rose-600">{avgRiskScore}/100</span>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-widest font-bold text-[#64748B]">Total Scope Gaps Identified</span>
              <span className="font-mono font-bold text-lg text-amber-600">{totalGaps}</span>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS AND LIST */}
      <div className="p-5">
        {logs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#E1E4E8] rounded-xl bg-slate-50/50">
            <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide">
              No audit jobs processed yet
            </h4>
            <p className="font-sans text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Whenever a background compliance job is queued and completed, its summary metadata will appear here for audit tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SEARCH */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit jobs by subcontractor, trade, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#E1E4E8] rounded-lg pl-9 pr-4 py-2 text-xs font-sans focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            {/* LOGS TABLE */}
            <div className="overflow-x-auto border border-[#E1E4E8] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E1E4E8] text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-sans">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Subcontractor / Trade</th>
                    <th className="px-4 py-3">Audit Result Summary</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E4E8] text-xs">
                  {filteredLogs.map((log) => {
                    const isHighRisk = log.riskScore !== undefined && log.riskScore > 70;
                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isHighRisk ? "bg-rose-50/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="font-bold text-[#1A1C1E]">{log.subcontractor}</span>
                            <span className="block text-[9px] text-[#64748B] uppercase tracking-tight mt-0.5">
                              {log.trade}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {log.status === "Audited" ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold font-mono ${isHighRisk ? "text-rose-600" : "text-emerald-700"}`}>
                                  Risk: {log.riskScore}/100
                                </span>
                                {log.computedLeakagePercentage !== undefined && (
                                  <span className="text-[10px] font-bold font-mono text-slate-600">
                                    Leakage: {log.computedLeakagePercentage}%
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-500">
                                {log.gapsCount} compliance gap{log.gapsCount !== 1 ? "s" : ""} flagged
                              </span>
                            </div>
                          ) : log.status === "Failed" ? (
                            <span className="text-[10px] text-rose-500 font-medium">
                              Job crashed: {log.error || "Execution timeout"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-500 font-medium animate-pulse">
                              Pending background runner...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${
                              log.status === "Audited"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : log.status === "Failed"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onSelectBid(log.bidId)}
                              disabled={log.status === "Pending"}
                              className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all disabled:cursor-not-allowed shadow-3xs"
                              title="Navigate to compliance view for this bid"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-all cursor-pointer"
                              title="Delete log entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

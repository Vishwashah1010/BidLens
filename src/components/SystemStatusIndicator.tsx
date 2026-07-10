import React, { useState, useEffect, useRef } from "react";
import { Activity, Server, Cpu, Key, AlertTriangle, CheckCircle2, XCircle, ChevronDown, Layers, RefreshCw } from "lucide-react";
import { checkGeminiStatus } from "../utils/apiHealth";

interface HealthData {
  status: "healthy" | "unhealthy" | "degraded";
  apiKeyConfigured: boolean;
  explanation: string;
  modelInUse: string;
  fallbackModel: string;
  systemLoads: {
    cpu: number;
    memory: string;
    queueSize: number;
  };
}

export default function SystemStatusIndicator() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isHighDemand, setIsHighDemand] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      // 1. Query the dedicated Gemini API health status service layer
      const statusData = await checkGeminiStatus();
      setIsHighDemand(statusData.isHighDemand);
      
      // Persist state globally in localStorage so other views can inspect and disable auditing
      localStorage.setItem("kaya_gemini_high_demand", statusData.isHighDemand ? "true" : "false");
      localStorage.setItem("kaya_gemini_unreachable", (!statusData.isHealthy) ? "true" : "false");
      (window as any).isGeminiHighDemand = statusData.isHighDemand;
      (window as any).isGeminiUnreachable = !statusData.isHealthy;
      
      // Dispatch custom window event so other components (e.g. GapMatrix, BidSpecUploader) react instantly
      window.dispatchEvent(new Event("gemini-status-updated"));

      // 2. Fetch the general health check telemetry
      const res = await fetch("/api/health-check");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        throw new Error("Health check non-ok response");
      }
    } catch (err) {
      console.warn("Unable to fetch system health status, using offline/fallback state:", err);
      // Construct a safe offline / unavailable state
      setHealth({
        status: "unhealthy",
        apiKeyConfigured: false,
        explanation: "API service is unreachable or in high demand. The application is running in local-only offline mode.",
        modelInUse: "N/A",
        fallbackModel: "N/A",
        systemLoads: {
          cpu: 0,
          memory: "0MB / 0MB",
          queueSize: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchHealth();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Poll API health every 15 seconds
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => {
      if (!isOffline) {
        fetchHealth();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isOffline]);

  // Click outside listener to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Determine current status & style
  let statusText = "Syncing";
  let dotColor = "bg-slate-400";
  let textColor = "text-slate-600";
  let statusBg = "bg-slate-50 border-slate-200";

  if (isOffline) {
    statusText = "Offline";
    dotColor = "bg-slate-400 animate-pulse";
    textColor = "text-slate-500";
    statusBg = "bg-slate-50 border-slate-200";
  } else if (isHighDemand) {
    statusText = "High Demand (Warning)";
    dotColor = "bg-amber-500 animate-pulse";
    textColor = "text-amber-700";
    statusBg = "bg-amber-50/70 border-amber-150 animate-pulse";
  } else if (health) {
    if (!health.apiKeyConfigured) {
      statusText = "Local Emulated";
      dotColor = "bg-indigo-500";
      textColor = "text-indigo-700";
      statusBg = "bg-indigo-50/70 border-indigo-150";
    } else if (health.status === "healthy") {
      statusText = "API Active";
      dotColor = "bg-emerald-500";
      textColor = "text-emerald-700";
      statusBg = "bg-emerald-50/70 border-emerald-150";
    } else if (health.status === "degraded") {
      statusText = "API Degraded";
      dotColor = "bg-amber-500 animate-pulse";
      textColor = "text-amber-700";
      statusBg = "bg-amber-50/70 border-amber-150";
    } else {
      statusText = "API Unreachable";
      dotColor = "bg-rose-500 animate-pulse";
      textColor = "text-rose-700";
      statusBg = "bg-rose-50/70 border-rose-150";
    }
  }

  return (
    <div className="relative font-sans" ref={popoverRef} id="system-status-container">
      <button
        id="system-status-header-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all hover:bg-slate-50 select-none ${statusBg} ${textColor}`}
      >
        <span className="relative flex h-2 w-2">
          {(health?.status !== "healthy" || isHighDemand) && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span className="tracking-wide uppercase text-[10px]">{statusText}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover health details panel */}
      {isOpen && (
        <div 
          id="system-status-popover" 
          className="absolute right-0 mt-2 w-80 bg-white border border-[#E1E4E8] rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Popover Header */}
          <div className="bg-slate-950 px-4 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-400" />
              <div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider">System Status Summary</h4>
                <p className="text-[9px] text-slate-400 font-mono">Real-time API Telemetry Monitor</p>
              </div>
            </div>
            <button 
              id="system-status-manual-refresh"
              onClick={fetchHealth} 
              disabled={isLoading}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-40"
              title="Force Refresh Telemetry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Popover Content */}
          <div className="p-4 space-y-4 text-slate-700">
            {/* Health explanation message */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
              {isOffline ? (
                <div className="flex gap-2 text-slate-500 font-medium">
                  <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Your browser appears to be offline. Local client actions are enabled, but server integrations will fallback gracefully.</span>
                </div>
              ) : isHighDemand ? (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-0.5 flex-1 text-left">
                    <span className="font-bold text-slate-900 block text-amber-700 uppercase tracking-tight text-[10px]">
                      High Demand / Quota Warning
                    </span>
                    <span className="text-slate-600 font-sans block text-[10.5px]">
                      The Gemini compliance engine is experiencing heavy load. Heavy compliance audits are temporarily restricted to prevent rate limits. Please use localized offline rules or retry shortly.
                    </span>
                  </div>
                </div>
              ) : health ? (
                <div className="flex gap-2">
                  {health.status === "healthy" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : health.status === "degraded" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-slate-900 block">
                      {health.status === "healthy" && "Fully Operational"}
                      {health.status === "degraded" && "Degraded Service"}
                      {health.status === "unhealthy" && "API Unavailable"}
                    </span>
                    <span className="text-slate-500 font-sans">{health.explanation}</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 font-mono text-[10px] animate-pulse">Retrieving telemetry packets...</span>
              )}
            </div>

            {/* Grid properties */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              {/* Credentials state */}
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Credential State</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Key className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{health?.apiKeyConfigured ? "Configured" : "Missing"}</span>
                </span>
              </div>

              {/* Server host state */}
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Container Environment</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Server className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cloud Run</span>
                </span>
              </div>

              {/* Active Model */}
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Model</span>
                <span className="font-bold text-slate-800 truncate block">
                  {health?.modelInUse || "N/A"}
                </span>
              </div>

              {/* Queue load */}
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Queue Size</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Layers className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{health?.systemLoads.queueSize ?? 0} jobs</span>
                </span>
              </div>
            </div>

            {/* System loads bar */}
            {health && (
              <div className="space-y-2 border-t border-[#E1E4E8] pt-3 text-[11px] font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-slate-400" />
                    <span>Emulated Host CPU</span>
                  </span>
                  <span className="font-bold text-slate-700">{health.systemLoads.cpu}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      health.systemLoads.cpu > 70 
                        ? "bg-rose-500" 
                        : health.systemLoads.cpu > 40 
                          ? "bg-amber-500" 
                          : "bg-indigo-500"
                    }`} 
                    style={{ width: `${health.systemLoads.cpu}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

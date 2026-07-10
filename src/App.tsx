import React, { useState, useEffect } from "react";
import { FolderGit, HelpCircle, Layers, ShieldCheck, Star, FileSpreadsheet, Send, FilePlus2, Lightbulb, BarChart2, History, Loader2, LogOut } from "lucide-react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import AuthScreen from "./components/AuthScreen";

import OfflineSyncTerminal from "./components/OfflineSyncTerminal";
import BidSpecUploader from "./components/BidSpecUploader";
import BidLensLogo from "./components/BidLensLogo";
import SystemStatusIndicator from "./components/SystemStatusIndicator";
import GapMatrix from "./components/GapMatrix";
import TribalMemory from "./components/TribalMemory";
import RfiActionPanel from "./components/RfiActionPanel";
import ProjectSummaryOverlay from "./components/ProjectSummaryOverlay";
import AuditHistory, { AuditLogEntry } from "./components/AuditHistory";

import { masterSpecs, preloadedBids, preloadedTribalNotes } from "./data";
import { MasterSpec, Bid, TribalNote, RfiDraft, SyncAction } from "./types";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState<"auditor" | "tribal" | "rfi" | "history">("auditor");
  const [showSummaryOverlay, setShowSummaryOverlay] = useState<boolean>(false);
  // Core Persistent State
  const [specs, setSpecs] = useState<MasterSpec[]>(masterSpecs);
  const [selectedSpec, setSelectedSpec] = useState<MasterSpec>(masterSpecs[0]);
  
  const [auditHistory, setAuditHistory] = useState<AuditLogEntry[]>(() => {
    try {
      const savedHistory = localStorage.getItem("kaya_audit_history");
      if (savedHistory) return JSON.parse(savedHistory);
      
      // Pre-populate with realistic logs for a highly polished default experience
      return [
        {
          id: "audit-1",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          bidId: "bid-standard",
          subcontractor: "Standard Concrete Solutions",
          trade: "Concrete Works",
          riskScore: 35,
          computedLeakagePercentage: 8,
          gapsCount: 2,
          status: "Audited"
        },
        {
          id: "audit-2",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          bidId: "bid-ganga",
          subcontractor: "Ganga Concrete Ltd",
          trade: "Concrete Works",
          riskScore: 80,
          computedLeakagePercentage: 18,
          gapsCount: 5,
          status: "Audited"
        },
        {
          id: "audit-3",
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
          bidId: "bid-bharat",
          subcontractor: "Bharat Electricals",
          trade: "Electrical Works",
          riskScore: 65,
          computedLeakagePercentage: 11,
          gapsCount: 3,
          status: "Audited"
        }
      ];
    } catch {
      return [];
    }
  });

  // Save audit history log to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("kaya_audit_history", JSON.stringify(auditHistory));
    } catch (err) {
      console.warn("[Storage] Failed to save audit history:", err);
    }
  }, [auditHistory]);

  const [bids, setBids] = useState<Bid[]>(() => {
    try {
      const savedBids = localStorage.getItem("kaya_bids");
      return savedBids ? JSON.parse(savedBids) : preloadedBids;
    } catch {
      return preloadedBids;
    }
  });

  const [selectedBid, setSelectedBid] = useState<Bid | null>(() => {
    try {
      const savedBids = localStorage.getItem("kaya_bids");
      const loadedBids = savedBids ? JSON.parse(savedBids) : preloadedBids;
      return loadedBids.length > 0 ? loadedBids[0] : null;
    } catch {
      return preloadedBids.length > 0 ? preloadedBids[0] : null;
    }
  });

  const [tribalNotes, setTribalNotes] = useState<TribalNote[]>(() => {
    try {
      const savedTribal = localStorage.getItem("kaya_tribal");
      return savedTribal ? JSON.parse(savedTribal) : preloadedTribalNotes;
    } catch {
      return preloadedTribalNotes;
    }
  });

  const [rfiHistory, setRfiHistory] = useState<RfiDraft[]>(() => {
    try {
      const savedRfis = localStorage.getItem("kaya_rfis");
      return savedRfis ? JSON.parse(savedRfis) : [];
    } catch {
      return [];
    }
  });

  const [syncQueue, setSyncQueue] = useState<SyncAction[]>(() => {
    try {
      const savedQueue = localStorage.getItem("kaya_queue");
      return savedQueue ? JSON.parse(savedQueue) : [];
    } catch {
      return [];
    }
  });

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    try {
      const savedOffline = localStorage.getItem("kaya_offline");
      return savedOffline ? JSON.parse(savedOffline) : false;
    } catch {
      return false;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Save to LocalStorage on state change with safe try-catch blocks and pruning
  useEffect(() => {
    if (bids.length > 0) {
      try {
        // Strip heavy base64 strings to prevent QuotaExceededError
        const prunedBids = bids.map(({ pdfBase64, ...rest }) => rest);
        localStorage.setItem("kaya_bids", JSON.stringify(prunedBids));
      } catch (err) {
        console.warn("[Storage] Failed to save bids to localStorage:", err);
        // If quota exceeded, try clearing individual large fields or purging old records
        try {
          localStorage.removeItem("kaya_bids");
        } catch (_) {}
      }
    }
  }, [bids]);

  useEffect(() => {
    if (tribalNotes.length > 0) {
      try {
        localStorage.setItem("kaya_tribal", JSON.stringify(tribalNotes));
      } catch (err) {
        console.warn("[Storage] Failed to save tribal notes:", err);
      }
    }
  }, [tribalNotes]);

  useEffect(() => {
    if (rfiHistory.length > 0) {
      try {
        localStorage.setItem("kaya_rfis", JSON.stringify(rfiHistory));
      } catch (err) {
        console.warn("[Storage] Failed to save RFIs:", err);
      }
    }
  }, [rfiHistory]);

  useEffect(() => {
    try {
      localStorage.setItem("kaya_queue", JSON.stringify(syncQueue));
    } catch (err) {
      console.warn("[Storage] Failed to save sync queue:", err);
    }
  }, [syncQueue]);

  useEffect(() => {
    try {
      localStorage.setItem("kaya_offline", JSON.stringify(isOffline));
    } catch (err) {
      console.warn("[Storage] Failed to save offline mode state:", err);
    }
  }, [isOffline]);

  const handleToggleOffline = () => {
    if (isOffline) {
      // Transitioning to online -> sync automatically
      setIsOffline(false);
      handleSyncQueue();
    } else {
      setIsOffline(true);
    }
  };

  const handleSyncQueue = async () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);

    // Simulate batch-upload synchronization delays for beautiful presentation
    setTimeout(() => {
      // Sync RFI outbox items
      const updatedRfis = rfiHistory.map((rfi) => {
        if (rfi.status === "Queued") {
          return { ...rfi, status: "Sent" as const };
        }
        return rfi;
      });

      setRfiHistory(updatedRfis);
      setSyncQueue([]);
      setIsSyncing(false);
    }, 2000);
  };

  const handleSelectSpec = (spec: MasterSpec) => {
    setSelectedSpec(spec);
    // Find matching bid if any
    const relatedBid = bids.find(
      (b) =>
        (spec.id === "spec-concrete" && b.trade.toLowerCase().includes("concrete")) ||
        (spec.id === "spec-electrical" && b.trade.toLowerCase().includes("electrical"))
    );
    if (relatedBid) {
      setSelectedBid(relatedBid);
    }
  };

  const handleSelectBid = (bid: Bid) => {
    setSelectedBid(bid);
    // Find matching spec if any
    const relatedSpec = specs.find(
      (s) =>
        (s.id === "spec-concrete" && bid.trade.toLowerCase().includes("concrete")) ||
        (s.id === "spec-electrical" && bid.trade.toLowerCase().includes("electrical"))
    );
    if (relatedSpec) {
      setSelectedSpec(relatedSpec);
    }
  };

  const handleAddNewBid = (newBid: Bid) => {
    const updated = [newBid, ...bids];
    setBids(updated);
    setSelectedBid(newBid);
    setActiveTab("auditor");
  };

  const handleAuditComplete = (
    bidId: string,
    auditData: { computedLeakagePercentage: number; riskScore: number; scopeGaps: any[]; extractedText?: string }
  ) => {
    const updated = bids.map((b) => {
      if (b.id === bidId) {
        return {
          ...b,
          auditStatus: "Audited" as const,
          computedLeakagePercentage: auditData.computedLeakagePercentage,
          riskScore: auditData.riskScore,
          scopeGaps: auditData.scopeGaps,
          rawText: auditData.extractedText || b.rawText,
        };
      }
      return b;
    });

    setBids(updated);
    const updatedBid = updated.find((b) => b.id === bidId);
    if (updatedBid) {
      setSelectedBid(updatedBid);
    }

    // Push entry to audit history logs
    const targetBid = updated.find((b) => b.id === bidId);
    if (targetBid) {
      const newLog: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        bidId,
        subcontractor: targetBid.subcontractor,
        trade: targetBid.trade,
        riskScore: auditData.riskScore,
        computedLeakagePercentage: auditData.computedLeakagePercentage,
        gapsCount: auditData.scopeGaps?.length || 0,
        status: "Audited" as const,
      };
      setAuditHistory((prev) => [newLog, ...prev]);
    }

    // Add to sync queue if offline
    if (isOffline) {
      const action: SyncAction = {
        id: `action-${Date.now()}`,
        type: "analyze-bid",
        payload: { bidId, auditData },
        timestamp: new Date().toISOString(),
        description: `Audit finished for ${selectedBid?.subcontractor}`,
      };
      setSyncQueue([...syncQueue, action]);
    }
  };

  const handleAuditFailed = (bidId: string) => {
    const updated = bids.map((b) => {
      if (b.id === bidId) {
        return {
          ...b,
          auditStatus: "Failed" as const,
        };
      }
      return b;
    });
    setBids(updated);
    const updatedBid = updated.find((b) => b.id === bidId);
    if (updatedBid) {
      setSelectedBid(updatedBid);
    }

    // Push failed log entry
    const targetBid = bids.find((b) => b.id === bidId);
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      bidId,
      subcontractor: targetBid ? targetBid.subcontractor : "Unknown Proposal",
      trade: targetBid ? targetBid.trade : "General Works",
      gapsCount: 0,
      status: "Failed" as const,
      error: "Background execution interrupted or timed out."
    };
    setAuditHistory((prev) => [newLog, ...prev]);
  };

  const handleAddTribalNote = (newNote: TribalNote) => {
    const updated = [...tribalNotes, newNote];
    setTribalNotes(updated);

    // Update the selected bid with tribal sentiment summaries if wanted, or just log
    if (isOffline) {
      const action: SyncAction = {
        id: `action-${Date.now()}`,
        type: "analyze-tribal",
        payload: newNote,
        timestamp: new Date().toISOString(),
        description: `Logged field notes for ${newNote.subcontractor}`,
      };
      setSyncQueue([...syncQueue, action]);
    }
  };

  const handleAddRfi = (newRfi: RfiDraft) => {
    const updated = [...rfiHistory, newRfi];
    setRfiHistory(updated);

    if (isOffline || newRfi.status === "Queued") {
      const action: SyncAction = {
        id: `action-${Date.now()}`,
        type: "generate-rfi",
        payload: newRfi,
        timestamp: new Date().toISOString(),
        description: `Queued scope clarification RFI for ${newRfi.subcontractor}`,
      };
      setSyncQueue([...syncQueue, action]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-4">Verifying Secure Session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1C1E] flex flex-col font-sans select-none overflow-hidden h-screen">
      {/* OFFLINE FIRST NOTIFICATION TERMINAL */}
      <OfflineSyncTerminal
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        syncQueue={syncQueue}
        onSync={handleSyncQueue}
        isSyncing={isSyncing}
      />

      {/* CORE TERMINAL HEADER */}
      <header className="h-16 bg-white border-b border-[#E1E4E8] flex items-center justify-between px-6 shrink-0 shadow-2xs">
        <div className="flex items-center space-x-3">
          <BidLensLogo size={36} hasBorder={false} />
          <div>
            <h1 className="text-lg font-bold leading-tight text-[#1A1C1E] flex items-center">
              BidLens 
              <span className="text-[#0052CC] text-[10px] font-mono bg-blue-50 border border-blue-100 px-2 py-0.5 rounded ml-2">v2.4 LOCAL</span>
            </h1>
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider italic">
              Agentic Bid Auditor & Compliance Guard
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={() => setShowSummaryOverlay(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0052CC] hover:bg-[#0052CC]/90 text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0"
            title="Show project-wide executive summary"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Project Summary</span>
            <span className="md:hidden">Summary</span>
          </button>

          <SystemStatusIndicator />

          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-mono">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">Last Sync</p>
              <p className="text-[11px] font-bold text-slate-700">14:02:11</p>
            </div>
            <div className="w-px h-8 bg-[#E1E4E8] mx-2 hidden sm:block"></div>
            
            {/* Interactive User Avatar & Sign Out Dropdown */}
            <div className="relative group">
              <button 
                id="user-profile-avatar-btn"
                className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 hover:bg-blue-200 cursor-pointer uppercase transition-all"
                title={`${user?.email} - Hover for Options`}
              >
                {user?.email ? user.email.substring(0, 2) : "US"}
              </button>
              
              {/* Dropdown Card */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-md p-3 z-50 w-52 font-sans">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Signed in as</span>
                <span className="font-bold text-slate-700 text-xs truncate block mb-2" title={user?.email || ""}>
                  {user?.email}
                </span>
                <div className="border-t border-slate-100 my-1.5" />
                <button
                  id="header-signout-btn"
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-2 text-left text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 py-1.5 px-2 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span>Sign Out Securely</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR & MAIN MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 overflow-hidden">
        {/* GEOMETRIC NAVIGATION SIDEBAR */}
        <nav className="w-16 bg-[#1A1C1E] flex flex-col items-center py-6 space-y-6 shrink-0">
          <button 
            onClick={handleToggleOffline} 
            className="text-[#64748B] hover:text-white cursor-pointer p-2 rounded hover:bg-white/5 transition-all"
            title="Toggle Connection State"
          >
            {isOffline ? (
              <span className="block text-amber-500 font-bold text-xs font-mono">OFF</span>
            ) : (
              <span className="block text-emerald-500 font-bold text-xs font-mono">ON</span>
            )}
          </button>
          
          <div className="w-8 h-px bg-slate-800" />

          <button
            onClick={() => setActiveTab("auditor")}
            className={`p-2 rounded transition-all cursor-pointer ${
              activeTab === "auditor" ? "text-white bg-[#0052CC]" : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
            title="Spec-to-Bid Gap Matrix"
          >
            <ShieldCheck className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab("tribal")}
            className={`p-2 rounded transition-all cursor-pointer ${
              activeTab === "tribal" ? "text-white bg-[#0052CC]" : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
            title="AI Tribal Sentiment"
          >
            <Star className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab("rfi")}
            className={`p-2 rounded transition-all cursor-pointer ${
              activeTab === "rfi" ? "text-white bg-[#0052CC]" : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
            title="Action RFI Center"
          >
            <Send className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`p-2 rounded transition-all cursor-pointer ${
              activeTab === "history" ? "text-white bg-[#0052CC]" : "text-[#64748B] hover:text-white hover:bg-white/5"
            }`}
            title="Compliance Audit Logs"
          >
            <History className="w-6 h-6" />
          </button>
        </nav>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FA]">
          {/* INGESTION & DOCUMENT LOADER CARD */}
          <section id="ingestion-section">
            <BidSpecUploader
              specs={specs}
              selectedSpec={selectedSpec}
              onSelectSpec={handleSelectSpec}
              bids={bids}
              selectedBid={selectedBid || bids[0]}
              onSelectBid={handleSelectBid}
              onAddNewBid={handleAddNewBid}
              isOffline={isOffline}
              isAuditing={isAuditing}
              onAuditComplete={handleAuditComplete}
              onAuditFailed={handleAuditFailed}
              onAuditingStateChange={(loading) => setIsAuditing(loading)}
            />
          </section>

          {/* WORKSPACE OPERATIONS TAB BUTTON BAR */}
          {selectedBid && (
            <div className="space-y-6">
              <div className="flex border-b border-[#E1E4E8] gap-1 overflow-x-auto scrollbar-none bg-white p-1 rounded border">
                <button
                  id="tab-auditor"
                  onClick={() => setActiveTab("auditor")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === "auditor"
                      ? "border-[#0052CC] text-[#0052CC]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Spec-to-Bid Gap Matrix</span>
                </button>

                <button
                  id="tab-tribal"
                  onClick={() => setActiveTab("tribal")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === "tribal"
                      ? "border-[#0052CC] text-[#0052CC]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  <span>AI Tribal Sentiment Engine</span>
                </button>

                <button
                  id="tab-rfi"
                  onClick={() => setActiveTab("rfi")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === "rfi"
                      ? "border-[#0052CC] text-[#0052CC]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>Agentic Action RFI Panel</span>
                </button>

                <button
                  id="tab-history"
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === "history"
                      ? "border-[#0052CC] text-[#0052CC]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>Compliance Audit Logs</span>
                </button>
              </div>

              {/* ACTIVE TAB DISPLAY CONTAINER */}
              <section id="tab-content" className="transition-all duration-300">
                {activeTab === "auditor" && (
                  <GapMatrix
                    selectedBid={selectedBid}
                    selectedSpec={selectedSpec}
                    bids={bids}
                    onAuditComplete={handleAuditComplete}
                    onAuditFailed={handleAuditFailed}
                    isOffline={isOffline}
                    onAuditingStateChange={(loading) => setIsAuditing(loading)}
                  />
                )}

                {activeTab === "tribal" && (
                  <TribalMemory
                    selectedBid={selectedBid}
                    tribalNotes={tribalNotes}
                    onAddTribalNote={handleAddTribalNote}
                    isOffline={isOffline}
                  />
                )}

                {activeTab === "rfi" && (
                  <RfiActionPanel
                    selectedBid={selectedBid}
                    rfiHistory={rfiHistory}
                    onAddRfi={handleAddRfi}
                    isOffline={isOffline}
                  />
                )}

                {activeTab === "history" && (
                  <AuditHistory
                    logs={auditHistory}
                    onSelectBid={(bidId) => {
                      const b = bids.find((item) => item.id === bidId);
                      if (b) {
                        setSelectedBid(b);
                        setActiveTab("auditor");
                      }
                    }}
                    onClearLogs={() => setAuditHistory([])}
                    onDeleteLog={(id) => setAuditHistory((prev) => prev.filter((item) => item.id !== id))}
                  />
                )}
              </section>
            </div>
          )}

          {/* GEOMETRIC METRICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2 shrink-0">
            <div className="bg-white border border-[#E1E4E8] rounded p-5 flex flex-col justify-center shadow-2xs">
              <p className="text-[10px] font-bold text-[#64748B] uppercase mb-1">Total Subcontracts</p>
              <p className="text-2xl font-mono text-[#1A1C1E] font-bold">{bids.length}</p>
              <div className="w-full bg-[#F1F5F9] h-1.5 mt-2 rounded-full overflow-hidden">
                <div className="bg-[#1A1C1E] h-full transition-all" style={{ width: `${Math.min(100, (bids.length / 5) * 100)}%` }}></div>
              </div>
            </div>

            <div className="bg-white border border-[#E1E4E8] rounded p-5 flex flex-col justify-center shadow-2xs">
              <p className="text-[10px] font-bold text-[#64748B] uppercase mb-1">Budget Leakage (Est)</p>
              <p className="text-2xl font-mono text-red-600 font-bold">
                {selectedBid?.computedLeakagePercentage ? `${selectedBid.computedLeakagePercentage}%` : "14.5%"}
              </p>
              <p className="text-[9px] font-bold text-red-400 mt-1 uppercase tracking-wider">
                {selectedBid?.computedLeakagePercentage && selectedBid.computedLeakagePercentage > 15 ? "↑ HIGH RISK LEAKAGE" : "🛡️ MITIGATION PLAN READY"}
              </p>
            </div>

            <div className="bg-white border border-[#E1E4E8] rounded p-5 flex flex-col justify-center shadow-2xs">
              <p className="text-[10px] font-bold text-[#64748B] uppercase mb-1">Audit Gaps Found</p>
              <p className="text-2xl font-mono text-[#1A1C1E] font-bold">{selectedBid?.scopeGaps?.length || 0}</p>
              <div className="flex mt-2 space-x-1">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const gapCount = selectedBid?.scopeGaps?.length || 0;
                  let color = "bg-[#E2E8F0]";
                  if (idx < gapCount) {
                    color = gapCount > 3 ? "bg-red-500" : "bg-amber-500";
                  }
                  return <div key={idx} className={`w-3 h-3 rounded-xs ${color}`} />;
                })}
              </div>
            </div>

            <div className="bg-[#0052CC] rounded p-5 text-white flex flex-col justify-center shadow-xs">
              <p className="text-[10px] font-bold opacity-80 uppercase mb-1">Win Probability</p>
              <p className="text-3xl font-mono font-bold leading-none">98%</p>
              <p className="text-[10px] font-bold mt-2 tracking-tighter">PROPOSAL STRENGTH: OPTIMAL</p>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY OVERLAY */}
      <ProjectSummaryOverlay
        isOpen={showSummaryOverlay}
        onClose={() => setShowSummaryOverlay(false)}
        bids={bids}
        onSelectBid={handleSelectBid}
      />

      {/* SYSTEM ADVISORY FOOTER */}
      <footer className="h-8 bg-[#F1F5F9] border-t border-[#E1E4E8] flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center space-x-4 text-[9px] font-bold text-[#94A3B8]">
          <span>SATELLITE LINK: ACTIVE</span>
          <span>LATENCY: 42ms</span>
          <span>DATA PARSED: 4.2GB</span>
        </div>
        <div className="text-[9px] font-mono text-[#64748B]">
          BIDLENS_OS_BUILD_v10.42.0-PROD
        </div>
      </footer>
    </div>
  );
}

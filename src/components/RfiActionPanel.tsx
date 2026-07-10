import React, { useState, useEffect } from "react";
import { Send, FileCheck, Layers, Clipboard, AlertCircle, RefreshCw, Sparkles, Calendar, Clock, AlertTriangle, Plus, Minus, Info } from "lucide-react";
import { Bid, RfiDraft } from "../types";

interface RfiActionPanelProps {
  selectedBid: Bid;
  rfiHistory: RfiDraft[];
  onAddRfi: (rfi: RfiDraft) => void;
  isOffline: boolean;
}

export default function RfiActionPanel({
  selectedBid,
  rfiHistory,
  onAddRfi,
  isOffline,
}: RfiActionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  // Scheduler state
  const [awardDate, setAwardDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days from now
    return d.toISOString().split("T")[0];
  });

  const getGapsSeverity = () => {
    const gaps = selectedBid.scopeGaps || [];
    if (gaps.length === 0) return { level: "Low", score: 0, responseDays: 7, followUpDays: 3 };
    
    let maxRisk = "Low";
    let score = 0;
    gaps.forEach((g) => {
      if (g.riskLevel === "Critical") {
        maxRisk = "Critical";
        score += 4;
      } else if (g.riskLevel === "High" && maxRisk !== "Critical") {
        maxRisk = "High";
        score += 3;
      } else if (g.riskLevel === "Medium" && maxRisk !== "Critical" && maxRisk !== "High") {
        maxRisk = "Medium";
        score += 2;
      } else if (maxRisk === "Low") {
        score += 1;
      }
    });

    if (maxRisk === "Critical" || maxRisk === "High") {
      return { level: maxRisk, score, responseDays: 3, followUpDays: 1 };
    } else if (maxRisk === "Medium") {
      return { level: "Medium", score, responseDays: 5, followUpDays: 2 };
    } else {
      return { level: "Low", score, responseDays: 7, followUpDays: 3 };
    }
  };

  const { level: severityLevel, score: severityScore, responseDays: defaultResponse, followUpDays: defaultFollowUp } = getGapsSeverity();
  
  const [responseDays, setResponseDays] = useState(defaultResponse);
  const [followUpDays, setFollowUpDays] = useState(defaultFollowUp);

  // Sync state if bid changes
  useEffect(() => {
    setResponseDays(defaultResponse);
    setFollowUpDays(defaultFollowUp);
  }, [selectedBid.id, defaultResponse, defaultFollowUp]);

  const today = new Date();
  
  const responseDeadline = new Date();
  responseDeadline.setDate(today.getDate() + responseDays);

  const followUpDate = new Date();
  followUpDate.setDate(responseDeadline.getDate() + followUpDays);

  const awardDateObj = new Date(awardDate);
  const isBufferTight = awardDateObj.getTime() - followUpDate.getTime() < 3 * 24 * 60 * 60 * 1000; // < 3 days buffer

  const formatDateString = (d: Date) => {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const injectTimelineToRfi = () => {
    const scheduleText = `\n\n---\n[SCHEDULED COMPLIANCE TIMELINE]\n• RFI Issued: ${formatDateString(today)}\n• Response Due Date: ${formatDateString(responseDeadline)} (Severity: ${severityLevel})\n• Optimal Follow-up Review: ${formatDateString(followUpDate)}\n• Target Contract Award: ${formatDateString(awardDateObj)}\n\nPlease submit all outstanding scope prices and details by the due date to ensure alignment with our contract award schedule.`;
    
    // Check if it already exists in the body to avoid duplicate injection
    if (body.includes("[SCHEDULED COMPLIANCE TIMELINE]")) {
      const cleaned = body.split("\n\n---\n[SCHEDULED COMPLIANCE TIMELINE]")[0];
      setBody(cleaned + scheduleText);
    } else {
      setBody(body + scheduleText);
    }
  };

  // Filter RFI drafts for current bid
  const filteredRfis = rfiHistory.filter((r) => r.bidId === selectedBid.id);

  const generateRfi = async () => {
    if (selectedBid.auditStatus !== "Audited") return;
    setLoading(true);

    try {
      const response = await fetch("/api/generate-rfi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcontractor: selectedBid.subcontractor,
          gaps: selectedBid.scopeGaps || [],
          isOfflineSimulated: isOffline,
        }),
      });

      const data = await response.json();
      if (data.rfi) {
        setSubject(data.rfi.subject);
        setBody(data.rfi.body);
      }
    } catch (err) {
      console.error("RFI Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = () => {
    if (!subject || !body) return;

    const newRfi: RfiDraft = {
      id: `rfi-custom-${Date.now()}`,
      bidId: selectedBid.id,
      subcontractor: selectedBid.subcontractor,
      subject,
      body,
      status: isOffline ? "Queued" : "Sent",
      timestamp: new Date().toISOString(),
    };

    onAddRfi(newRfi);
    setSubject("");
    setBody("");
  };

  const copyToClipboard = () => {
    const textToCopy = `Subject: ${subject}\n\n${body}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.warn("Clipboard API failed, trying fallback:", err);
          fallbackCopyText(textToCopy);
        });
    } else {
      fallbackCopyText(textToCopy);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Fallback copy failed.");
      }
    } catch (err) {
      console.error("Fallback copy error:", err);
    }
  };

  return (
    <div id="rfi-action-terminal" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMN 1 & 2: RFI CREATOR */}
      <div className="bg-white border border-[#E1E4E8] rounded p-5 shadow-xs lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E1E4E8] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#F8FAFC] text-[#1A1C1E] border border-[#E1E4E8] rounded">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wider">Agentic Action RFI Center</h3>
              <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">Draft formal scope clarification RFIs autonomously</p>
            </div>
          </div>

          {selectedBid.auditStatus === "Audited" && !subject && !loading && (
            <button
              id="draft-rfi-btn"
              onClick={generateRfi}
              className="flex items-center gap-1 bg-[#0052CC] hover:bg-[#0041a3] text-white text-xs font-sans font-bold uppercase tracking-wider px-3.5 py-1.5 rounded shadow-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Autogen Compliance RFI</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#0052CC] animate-spin mx-auto" />
            <p className="font-sans text-xs text-[#1A1C1E] font-medium animate-pulse">
              Compiling scope omissions & drafting formal prime-subcontractor RFI letter...
            </p>
          </div>
        ) : selectedBid.auditStatus !== "Audited" ? (
          <div className="border border-dashed border-[#E1E4E8] rounded p-8 text-center bg-[#F8FAFC]">
            <AlertCircle className="h-8 w-8 text-[#64748B] mx-auto mb-3" />
            <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wide">Audit Required First</h4>
            <p className="font-sans text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              You must run the Spec-to-Bid Compliance Audit on the previous tab before generating an RFI.
            </p>
          </div>
        ) : !subject ? (
          <div className="border border-dashed border-[#E1E4E8] rounded p-8 text-center bg-[#F8FAFC]">
            <FileCheck className="h-8 w-8 text-[#64748B] mx-auto mb-3" />
            <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wide">Draft Ready</h4>
            <p className="font-sans text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Compliance audit for {selectedBid.subcontractor} found {selectedBid.scopeGaps?.length || 0} scope gaps. Click below to compile the formal RFI automatically.
            </p>
            <button
              id="draft-rfi-fallback-btn"
              onClick={generateRfi}
              className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0041a3] text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all mx-auto shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Compile Official RFI</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider mb-1">RFI Subject Line</label>
              <input
                id="rfi-subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-[#E1E4E8] rounded px-3 py-2 text-xs font-sans font-bold focus:ring-1 focus:ring-[#0052CC] focus:outline-hidden text-[#1A1C1E]"
              />
            </div>

            {/* SMART RFI FOLLOW-UP SCHEDULER */}
            <div className="bg-slate-50 border border-[#E1E4E8] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E1E4E8] pb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#0052CC]" />
                  <span className="font-sans font-bold text-xs text-slate-800">Smart Timeline & Follow-Up Scheduler</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${
                  severityLevel === "Critical" || severityLevel === "High"
                    ? "bg-red-50 text-red-700 border-red-100 animate-pulse"
                    : severityLevel === "Medium"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-blue-50 text-blue-700 border-blue-100"
                }`}>
                  {severityLevel} Severity Gaps ({selectedBid.scopeGaps?.length || 0} gaps)
                </span>
              </div>

              {/* DYNAMIC SUGGESTIONS SUMMARY */}
              <div className="text-[11px] text-slate-600 leading-relaxed bg-white border border-[#E1E4E8] rounded p-2.5 flex items-start gap-2">
                <Info className="h-4 w-4 text-[#0052CC] shrink-0 mt-0.5" />
                <div>
                  Based on a <strong className="text-[#1A1C1E]">{severityLevel} severity</strong> gap profile, we recommend a <strong className="text-[#1A1C1E]">{defaultResponse}-day</strong> response deadline with a <strong className="text-[#1A1C1E]">{defaultFollowUp}-day</strong> follow-up buffer.
                </div>
              </div>

              {/* TIMELINE INPUT FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-sans font-bold text-[#64748B] uppercase tracking-wider mb-1">Target Award Date</label>
                  <input
                    type="date"
                    value={awardDate}
                    onChange={(e) => setAwardDate(e.target.value)}
                    className="w-full bg-white border border-[#E1E4E8] rounded px-2 py-1 text-xs font-sans text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-sans font-bold text-[#64748B] uppercase tracking-wider mb-1">RFI Due Window</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setResponseDays(Math.max(1, responseDays - 1))}
                      className="p-1 rounded bg-white border border-[#E1E4E8] hover:bg-slate-100 text-slate-700"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800">{responseDays}d</span>
                    <button
                      type="button"
                      onClick={() => setResponseDays(responseDays + 1)}
                      className="p-1 rounded bg-white border border-[#E1E4E8] hover:bg-slate-100 text-slate-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-sans font-bold text-[#64748B] uppercase tracking-wider mb-1">Follow-Up Delay</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFollowUpDays(Math.max(0, followUpDays - 1))}
                      className="p-1 rounded bg-white border border-[#E1E4E8] hover:bg-slate-100 text-slate-700"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800">{followUpDays}d</span>
                    <button
                      type="button"
                      onClick={() => setFollowUpDays(followUpDays + 1)}
                      className="p-1 rounded bg-white border border-[#E1E4E8] hover:bg-slate-100 text-slate-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* TIMELINE VISUAL TRACKER */}
              <div className="py-2.5 px-1 bg-white border border-[#E1E4E8] rounded-md space-y-1">
                <div className="relative flex items-center justify-between px-3">
                  {/* Line connecting states */}
                  <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
                  
                  {/* Milestone 1: Issue (Today) */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="h-4 w-4 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-[8px] font-bold">1</div>
                    <span className="text-[8px] font-bold text-slate-700 mt-1">Issue Today</span>
                    <span className="text-[7px] font-mono text-slate-400">{formatDateString(today)}</span>
                  </div>

                  {/* Milestone 2: Response Due */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">2</div>
                    <span className="text-[8px] font-bold text-slate-700 mt-1">Due Deadline</span>
                    <span className="text-[7px] font-mono text-slate-400">{formatDateString(responseDeadline)}</span>
                  </div>

                  {/* Milestone 3: Suggested Follow-up */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${
                      isBufferTight ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    }`}>3</div>
                    <span className="text-[8px] font-bold text-slate-700 mt-1">Follow-Up</span>
                    <span className="text-[7px] font-mono text-slate-400">{formatDateString(followUpDate)}</span>
                  </div>

                  {/* Milestone 4: Award Date */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="h-4 w-4 rounded-full bg-slate-700 flex items-center justify-center text-white text-[8px] font-bold">4</div>
                    <span className="text-[8px] font-bold text-slate-700 mt-1">Award Date</span>
                    <span className="text-[7px] font-mono text-slate-400">{formatDateString(awardDateObj)}</span>
                  </div>
                </div>
              </div>

              {/* WARNING & ACTION PANEL */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {isBufferTight ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                      <AlertTriangle className="h-3 w-3 animate-bounce shrink-0" />
                      <span>Warning: Response window leaves minimal prep time before Award.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Comfortable buffer of {Math.max(0, Math.round((awardDateObj.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24)))} days before Contract Award.</span>
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={injectTimelineToRfi}
                  className="px-2.5 py-1.5 bg-[#1A1C1E] text-white hover:bg-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  Inject Schedule into Letter
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">Formal Correspondence Body</label>
                <button
                  onClick={copyToClipboard}
                  className="text-[10px] text-[#0052CC] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard className="h-3 w-3" />
                  <span>{copied ? "Copied!" : "Copy correspondence text"}</span>
                </button>
              </div>
              <textarea
                id="rfi-body-input"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-white border border-[#E1E4E8] rounded p-4 text-xs font-sans focus:ring-1 focus:ring-[#0052CC] focus:outline-hidden leading-relaxed text-[#1A1C1E]"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E1E4E8] pt-3">
              <button
                id="dispatch-rfi-btn"
                onClick={handleDispatch}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1C1E] hover:bg-slate-850 text-white rounded text-xs font-sans font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-[#0052CC]" />
                <span>{isOffline ? "Queue in Outbox (Offline)" : "Dispatch Official RFI"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COLUMN 3: CORRESPONDENCE OUTBOX */}
      <div className="bg-white border border-[#E1E4E8] rounded p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E1E4E8] pb-3">
          <div className="p-1.5 bg-[#F8FAFC] text-[#1A1C1E] border border-[#E1E4E8] rounded">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wider">Site Outbox Queue</h3>
            <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">Track dispatched or pending site RFIs</p>
          </div>
        </div>

        {filteredRfis.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredRfis.slice().reverse().map((rfi) => (
              <div key={rfi.id} className="bg-[#F8FAFC] border border-[#E1E4E8] p-3.5 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${
                    rfi.status === "Sent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {rfi.status === "Sent" ? "Dispatched" : "Pending Sync"}
                  </span>
                  <span className="font-mono text-[9px] text-[#64748B]">
                    {new Date(rfi.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="font-sans font-bold text-[#1A1C1E] text-xs truncate">
                  {rfi.subject}
                </h4>
                <p className="font-sans text-[10px] text-slate-600 line-clamp-3 leading-relaxed">
                  {rfi.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#E1E4E8] rounded p-8 text-center bg-[#F8FAFC]">
            <Layers className="h-7 w-7 text-[#64748B] mx-auto mb-2.5" />
            <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wide">Outbox Empty</h4>
            <p className="font-sans text-[10px] text-[#64748B] mt-1 max-w-xs mx-auto">
              No RFIs generated for this subcontractor bid. Please trigger a Compliance Audit and draft an RFI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

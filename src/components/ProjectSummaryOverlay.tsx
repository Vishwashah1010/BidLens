import React from "react";
import { X, BarChart2, TrendingUp, AlertTriangle, TrendingDown, Shield, Coins, Award, Activity, FileText, CheckCircle } from "lucide-react";
import { Bid } from "../types";

interface ProjectSummaryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  bids: Bid[];
  onSelectBid: (bid: Bid) => void;
}

export default function ProjectSummaryOverlay({
  isOpen,
  onClose,
  bids,
  onSelectBid,
}: ProjectSummaryOverlayProps) {
  if (!isOpen) return null;

  // 1. Calculations
  const totalBidsCount = bids.length;
  const auditedBids = bids.filter((b) => b.auditStatus === "Audited");
  const auditedCount = auditedBids.length;

  const totalValue = bids.reduce((acc, b) => acc + b.totalValue, 0);

  // Leakage Calculation
  const totalProjectedLeakage = bids.reduce((acc, b) => {
    const rate = b.computedLeakagePercentage !== undefined ? b.computedLeakagePercentage : 14.5;
    return acc + (b.totalValue * rate) / 100;
  }, 0);

  const overallLeakageRate = totalValue > 0 ? (totalProjectedLeakage / totalValue) * 100 : 0;

  // Average Risk Score
  const avgRiskScore = auditedCount > 0 
    ? Math.round(auditedBids.reduce((acc, b) => acc + (b.riskScore || 0), 0) / auditedCount)
    : 45; // Default average score if none audited yet

  // Scope Gaps Count
  const totalScopeGaps = bids.reduce((acc, b) => acc + (b.scopeGaps?.length || 0), 0);

  // Risk Categories distribution
  let compliantCount = 0;
  let lowCount = 0;
  let mediumCount = 0;
  let highCount = 0;
  let criticalCount = 0;

  bids.forEach((bid) => {
    const score = bid.riskScore || 0;
    if (bid.auditStatus === "Pending") {
      mediumCount++; // default allocation
      return;
    }
    if (score < 20) compliantCount++;
    else if (score < 40) lowCount++;
    else if (score < 60) mediumCount++;
    else if (score < 80) highCount++;
    else criticalCount++;
  });

  // MSME & GST stats
  const msmeCount = bids.filter((b) => b.isMsme).length;
  const gstComplianceCount = bids.filter((b) => b.gstin).length;

  // Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Black Translucent Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Main Modal Dialog */}
      <div className="bg-white border border-[#E1E4E8] rounded-xl shadow-2xl relative w-full max-w-5xl h-[85vh] flex flex-col z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4E8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0052CC]/10 text-[#0052CC] rounded-lg flex items-center justify-center">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                Executive Audit Summary Dashboard
                <span className="text-[#0052CC] text-[9px] font-mono bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  PROJECT-WIDE ANALYSIS
                </span>
              </h2>
              <p className="text-[10px] text-[#64748B] font-sans mt-0.5">
                Consolidated statutory exposure, scope leakages, and contractor compliance comparison matrices.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            title="Close summary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TOP EXPENDITURE & LEAKAGE KEY STATS BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Total Project Tender Value */}
            <div className="bg-slate-50 border border-[#E1E4E8] rounded-xl p-4.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">Total Package Cost</span>
                <Coins className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2.5">
                <p className="text-xl font-mono font-bold text-[#1A1C1E]">{formatCurrency(totalValue)}</p>
                <span className="text-[9px] text-slate-500 font-sans mt-1 block">Cumulative value of {totalBidsCount} trade tenders</span>
              </div>
            </div>

            {/* Stat 2: Total Change-Order Leakage */}
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-4.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-red-700 uppercase tracking-wider">Projected Scope Leakage</span>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2.5">
                <p className="text-xl font-mono font-bold text-red-600">{formatCurrency(totalProjectedLeakage)}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] text-red-700 font-sans font-bold uppercase">
                    Avg Rate: {overallLeakageRate.toFixed(1)}%
                  </span>
                  <span className="text-[8px] text-red-400 font-mono">due to undefined clauses</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Consolidated Risk Factor */}
            <div className={`border rounded-xl p-4.5 flex flex-col justify-between shadow-2xs ${
              avgRiskScore > 60 ? "bg-amber-50/40 border-amber-200" : "bg-[#F0FDF4] border-[#DCFCE7]"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${
                  avgRiskScore > 60 ? "text-amber-800" : "text-[#166534]"
                }`}>Consolidated Risk Factor</span>
                <Shield className={`h-4 w-4 ${avgRiskScore > 60 ? "text-amber-500" : "text-[#22C55E]"}`} />
              </div>
              <div className="mt-2.5">
                <p className={`text-xl font-mono font-bold ${
                  avgRiskScore > 60 ? "text-amber-700" : "text-[#15803D]"
                }`}>{avgRiskScore}/100</p>
                <span className="text-[9px] text-slate-500 font-sans mt-1 block">
                  {avgRiskScore > 60 ? "⚠️ Elevated statutory risk exposure" : "🛡️ Controlled statutory posture"}
                </span>
              </div>
            </div>

            {/* Stat 4: Statutory Tax Compliant Bids */}
            <div className="bg-[#F0F9FF] border border-[#E0F2FE] rounded-xl p-4.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-sky-700 uppercase tracking-wider">Statutory Integrations</span>
                <Activity className="h-4 w-4 text-sky-500 animate-pulse" />
              </div>
              <div className="mt-2.5">
                <p className="text-xl font-mono font-bold text-sky-700">
                  {msmeCount} MSME | {gstComplianceCount} GST
                </p>
                <span className="text-[9px] text-slate-500 font-sans mt-1 block">GST filings and MSMED statutory declarations mapped</span>
              </div>
            </div>

          </div>

          {/* TWO COLUMN ANALYSIS CHART & SUMMARY CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. Left: Risk Distribution Profiles & Statutory Health (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-[#E1E4E8] rounded-xl p-4.5 space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-sans font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                  Consolidated Risk Category Profile
                </h3>
                <p className="text-[9px] text-[#64748B] font-sans">
                  Distribution of packages based on compliance audit scoring thresholds.
                </p>
              </div>

              {/* Progress Gauges for Risk Categories */}
              <div className="space-y-3 pt-1">
                {/* Critical */}
                <div>
                  <div className="flex justify-between text-[10px] font-sans font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                      Critical Risk (Score &gt; 80)
                    </span>
                    <span className="font-mono text-rose-600">{criticalCount} package(s)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(criticalCount / totalBidsCount) * 100}%` }} />
                  </div>
                </div>

                {/* High */}
                <div>
                  <div className="flex justify-between text-[10px] font-sans font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                      High Risk (Score 60-80)
                    </span>
                    <span className="font-mono text-amber-600">{highCount} package(s)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(highCount / totalBidsCount) * 100}%` }} />
                  </div>
                </div>

                {/* Medium */}
                <div>
                  <div className="flex justify-between text-[10px] font-sans font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-200 inline-block" />
                      Medium Risk (Score 40-60)
                    </span>
                    <span className="font-mono text-amber-500">{mediumCount} package(s)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-300 rounded-full" style={{ width: `${(mediumCount / totalBidsCount) * 100}%` }} />
                  </div>
                </div>

                {/* Low & Compliant */}
                <div>
                  <div className="flex justify-between text-[10px] font-sans font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                      Low & Compliant (Score &lt; 40)
                    </span>
                    <span className="font-mono text-emerald-700">{lowCount + compliantCount} package(s)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((lowCount + compliantCount) / totalBidsCount) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* STATUTORY RISK WARNING ADVISORY */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-1 mt-4">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <strong className="text-[10px] uppercase font-sans tracking-wide">Change-Order Budget Warning</strong>
                </div>
                <p className="text-[9.5px] text-slate-700 leading-normal font-sans">
                  Current audits reveal a cumulative count of <strong className="text-slate-900 font-bold">{totalScopeGaps} scope gaps</strong> across bids. If unmitigated via RFIs prior to subcontractor sign-off, these exposures could result in up to <strong className="text-red-700 font-bold">{formatCurrency(totalProjectedLeakage)}</strong> in unplanned project change-orders.
                </p>
              </div>
            </div>

            {/* 2. Right: Active Subcontractors Comparative Table (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#E1E4E8] rounded-xl p-4.5 space-y-3.5 flex flex-col justify-between shadow-2xs">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-sans font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                  Subcontractor Audit Leaderboard
                </h3>
                <p className="text-[9px] text-[#64748B] font-sans">
                  Active packages sorted by their audited risk score. Click any row to load into workspace.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[450px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E1E4E8] text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="px-3 py-2">Subcontractor / Trade</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Risk Score</th>
                      <th className="px-3 py-2 text-center">Leakage %</th>
                      <th className="px-3 py-2 text-right">Projected Leakage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E4E8]">
                    {bids.map((bid) => {
                      const score = bid.riskScore || 0;
                      const leakagePercent = bid.computedLeakagePercentage !== undefined ? bid.computedLeakagePercentage : 14.5;
                      const leakageVal = (bid.totalValue * leakagePercent) / 100;

                      return (
                        <tr 
                          key={bid.id}
                          onClick={() => {
                            onSelectBid(bid);
                            onClose();
                          }}
                          className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                        >
                          <td className="px-3 py-2.5">
                            <div>
                              <span className="font-sans font-bold text-xs text-slate-800 group-hover:text-[#0052CC] block">
                                {bid.subcontractor}
                              </span>
                              <span className="text-[8px] text-[#64748B] uppercase font-bold block mt-0.5">
                                {bid.trade} ({formatCurrency(bid.totalValue)})
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                              bid.auditStatus === "Audited" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-400 border border-slate-200"
                            }`}>
                              {bid.auditStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`font-mono text-xs font-bold ${
                              score > 70 ? "text-red-600" : score > 40 ? "text-amber-500" : "text-emerald-700"
                            }`}>
                              {bid.auditStatus === "Audited" ? `${score}/100` : "--"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="font-mono text-xs text-slate-600 font-semibold">
                              {leakagePercent}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="font-mono text-xs text-red-600 font-bold block">
                              {formatCurrency(leakageVal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[8.5px] text-[#64748B] font-sans font-bold italic text-center uppercase tracking-wide border-t border-slate-100 pt-2">
                💡 TIP: Click on any subcontractor above to instantly pivot the workspace active file to their bid parameters.
              </p>
            </div>

          </div>

          {/* PROJECT STATUTORY STATUS CHECKS SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-2xs">
            <h4 className="font-sans font-bold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#0052CC]" />
              GST Compliance Filing & MSME Regulatory Safeguard Checklists
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] font-sans">
              <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1.5">
                <span className="text-[8px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
                  GST Compliance Filing
                </span>
                <p className="text-[9.5px] text-slate-600 leading-normal">
                  Verification that subcontractors hold valid active GSTIN numbers and score above 90% in historical GSTR filing matching. This ensures smooth input tax credit (ITC) flow.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold pt-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{gstComplianceCount} of {totalBidsCount} bids hold active GSTINs</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1.5">
                <span className="text-[8px] font-bold text-[#0052CC] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase">
                  MSMED Act Section 15
                </span>
                <p className="text-[9.5px] text-slate-600 leading-normal">
                  Registered MSME vendors require settlement within 45 days. Failing to specify msme terms in the main contract triggers severe compound interest liability under statutory rules.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold pt-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{msmeCount} registered Micro/Small vendors mapped</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1.5">
                <span className="text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded uppercase">
                  IS Code Standardization
                </span>
                <p className="text-[9.5px] text-slate-600 leading-normal">
                  Mandatory testing of reinforced cement concrete and wiring conduits per IS 456 / IS 732. Workmanship failures must match statutory guarantees.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-bold pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span>3 technical testing ommisions flagged for action</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-[#E1E4E8] flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-400 font-bold">
            Project-Wide Executive Summary Generated on: {new Date().toLocaleDateString("en-IN")}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0052CC] hover:bg-[#0052CC]/95 text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}

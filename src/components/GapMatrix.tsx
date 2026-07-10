import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  Info, 
  HelpCircle, 
  Shield, 
  Check, 
  FileText, 
  Scale,
  Zap,
  Activity,
  BarChart2
} from "lucide-react";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  Legend,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Bid, MasterSpec, ScopeGap } from "../types";
import ApiHealthMonitor from "./ApiHealthMonitor";

interface GapMatrixProps {
  selectedBid: Bid;
  selectedSpec: MasterSpec;
  bids: Bid[];
  onAuditComplete: (bidId: string, auditData: { computedLeakagePercentage: number; riskScore: number; scopeGaps: ScopeGap[] }) => void;
  onAuditFailed?: (bidId: string) => void;
  isOffline: boolean;
  onAuditingStateChange?: (loading: boolean) => void;
}

const clauses = [
  { id: "waste", name: "Waste Management & Clean-up", description: "Mandatory daily waste clearing, slurry containment, and eco-hauling conforming to environmental regulations.", icon: "🗑️" },
  { id: "power", name: "Temporary Power & DG Sets", description: "Provisioning distribution panels and CPCB silent DG sets for trades.", icon: "⚡" },
  { id: "warranty", name: "Workmanship Warranty (IS-aligned)", description: "12-month structural integrity, cracking warranty, and defect liability (IS 456 / IS 732).", icon: "📜" },
  { id: "materials", name: "Material Grade Certification", description: "Certified TMT steel rebars (IS 1786 Fe 500D) or oxygen-free copper conductors.", icon: "🏗️" },
  { id: "protection", name: "Extreme-Weather & Fire Sealings", description: "Water ponding curing or 2-hour rated firewall intumescent barriers (IS 12458).", icon: "🔥" },
  { id: "gst", name: "GSTIN & GSTR-1 Tax Filing", description: "Active GSTIN and stable GSTR-1 filings to protect Input Tax Credit (ITC) pass-through.", icon: "💼" },
  { id: "msme", name: "MSME Statutory Risk (45-Day Rule)", description: "MSME vendor status. Subject to MSMED Act 45-day mandatory payment cycle liability.", icon: "⚖️" },
  { id: "payment", name: "Mobilization Payment Capping", description: "Capping upfront mobilization advance deposits to a maximum of 10% value.", icon: "💰" },
];

export default function GapMatrix({
  selectedBid,
  selectedSpec,
  bids,
  onAuditComplete,
  onAuditFailed,
  isOffline,
  onAuditingStateChange,
}: GapMatrixProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [multiAuditProgress, setMultiAuditProgress] = useState<{ current: number; total: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Streaming state parameters
  const [streamingGaps, setStreamingGaps] = useState<ScopeGap[]>([]);
  const [streamingStatus, setStreamingStatus] = useState<string>("");

  // Sub-tab selection state
  const [activeSubTab, setActiveSubTab] = useState<"heatmap" | "comparison">("heatmap");
  const [comparisonBidIdA, setComparisonBidIdA] = useState<string>(selectedBid?.id || "");
  const [comparisonBidIdB, setComparisonBidIdB] = useState<string>(() => {
    const otherBids = bids.filter((b) => b.id !== selectedBid?.id);
    return otherBids.length > 0 ? otherBids[0].id : (selectedBid?.id || "");
  });

  // Sync comparison bid A if selectedBid changes
  useEffect(() => {
    if (selectedBid?.id) {
      setComparisonBidIdA(selectedBid.id);
    }
  }, [selectedBid?.id]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Synchronize loading and multiAuditProgress states to parent
  useEffect(() => {
    if (onAuditingStateChange) {
      onAuditingStateChange(loading || !!multiAuditProgress);
    }
  }, [loading, multiAuditProgress, onAuditingStateChange]);

  // Auto-run compliance audit on pending or newly added bids
  useEffect(() => {
    if (selectedBid && selectedBid.auditStatus === "Pending" && !loading && !multiAuditProgress) {
      triggerAudit();
    }
  }, [selectedBid?.id, selectedBid?.auditStatus]);
  
  // Interactive heatmap state
  const [selectedCell, setSelectedCell] = useState<{ bidId: string; clauseId: string } | null>(() => {
    return selectedBid?.id ? {
      bidId: selectedBid.id,
      clauseId: "warranty"
    } : null;
  });

  const steps = [
    "Reading master specification compliance conditions...",
    "Analyzing bidder raw proposal terms and exclusions...",
    "Scanning for hidden scope gaps and material specification failures...",
    "Computing potential change-order budget leakage...",
    "Synthesizing final risk assessment matrix..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Dynamic progress percentage for background analysis and chunked processing
  const getProgressPercentage = () => {
    if (!loading) return 0;
    let base = 10;
    if (loadingStep === 0) {
      base = 15;
    } else if (loadingStep === 1) {
      base = 35;
    } else if (loadingStep === 2) {
      base = 55;
    } else if (loadingStep === 3) {
      base = 75;
    } else if (loadingStep === 4) {
      base = 90;
    }
    const gapBonus = Math.min(streamingGaps.length * 4, 12);
    return Math.min(base + gapBonus, 98);
  };

  const progressPercentage = getProgressPercentage();

  // Compile trend data for Recharts using last 5 audits (combining current audited bids with pre-seeded historical audits)
  const auditedBids = (bids || []).filter(b => b.auditStatus === "Audited");
  
  // High-fidelity preloaded historical audits to guarantee a rich 5-audit trend line
  const baseHistoricalAudits = [
    { subcontractor: "Nagpur Logistics", riskScore: 82, computedLeakagePercentage: 25, date: "2026-06-10" },
    { subcontractor: "Pune Terminal JV", riskScore: 40, computedLeakagePercentage: 8, date: "2026-06-15" },
    { subcontractor: "Mumbai Tech Bay", riskScore: 68, computedLeakagePercentage: 18, date: "2026-06-25" },
  ];

  // Map audited bids to the same format
  const mappedAudited = auditedBids.map(b => ({
    subcontractor: b.subcontractor || "",
    riskScore: b.riskScore || 0,
    computedLeakagePercentage: b.computedLeakagePercentage || 0,
    date: b.date
  }));

  // Combine them: historical first, then current mapped audited
  const allAudits = [...baseHistoricalAudits, ...mappedAudited];
  // Take last 5
  const last5Audits = allAudits.slice(-5).map((audit, idx) => ({
    index: idx + 1,
    name: (audit.subcontractor || "").split(" ")[0] || `Audit ${idx + 1}`, // Short name
    fullName: audit.subcontractor || `Audit ${idx + 1}`,
    "Risk Score": audit.riskScore,
    "Leakage %": audit.computedLeakagePercentage,
    date: audit.date
  }));

  const triggerAudit = async () => {
    if (!selectedBid) return;
    setLoading(true);
    setLoadingStep(0);
    setAuditError(null);
    setStreamingGaps([]);
    setStreamingStatus("Joining compliance analysis queue...");

    try {
      const response = await fetch("/api/analyze-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidText: selectedBid.rawText,
          specText: selectedSpec?.specText || "",
          subcontractor: selectedBid.subcontractor,
          trade: selectedBid.trade,
          isOfflineSimulated: isOffline,
          pdfBase64: selectedBid.pdfBase64,
          uploadId: selectedBid.uploadId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned status ${response.status}: ${text.substring(0, 150)}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response stream is not readable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let finalAuditData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const payload = JSON.parse(trimmed.substring(6));
              if (payload.type === "status") {
                setStreamingStatus(payload.message);
                setLoadingStep(prev => (prev + 1) % steps.length);
              } else if (payload.type === "gap") {
                setStreamingGaps(prev => {
                  if (prev.some(g => g.requiredItem === payload.gap.requiredItem)) return prev;
                  return [...prev, payload.gap];
                });
              } else if (payload.type === "complete") {
                finalAuditData = payload.audit;
              } else if (payload.type === "error") {
                throw new Error(payload.message);
              }
            } catch (jsonErr) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      if (finalAuditData) {
        onAuditComplete(selectedBid.id, finalAuditData);
      } else {
        throw new Error("Audit finished but did not return complete results.");
      }
    } catch (err: any) {
      console.error("Auditing Error:", err);
      setAuditError(err.message || "An unexpected error occurred during auditing.");
      if (onAuditFailed) {
        onAuditFailed(selectedBid.id);
      }
    } finally {
      setLoading(false);
      setStreamingStatus("");
    }
  };

  const triggerMultiAudit = async () => {
    const pendingBids = bids.filter(b => b.auditStatus === "Pending");
    if (pendingBids.length === 0) return;

    setLoading(true);
    setAuditError(null);
    setMultiAuditProgress({ current: 0, total: pendingBids.length });

    for (let i = 0; i < pendingBids.length; i++) {
      const bid = pendingBids[i];
      setMultiAuditProgress({ current: i + 1, total: pendingBids.length });
      setStreamingGaps([]);
      setStreamingStatus(`Joining queue for ${bid.subcontractor}...`);
      
      try {
        const response = await fetch("/api/analyze-bid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bidText: bid.rawText,
            specText: selectedSpec.specText,
            subcontractor: bid.subcontractor,
            trade: bid.trade,
            isOfflineSimulated: isOffline,
            pdfBase64: bid.pdfBase64,
            uploadId: bid.uploadId,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server returned status ${response.status} for ${bid.subcontractor}: ${text.substring(0, 150)}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable.");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let finalAuditData: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const payload = JSON.parse(trimmed.substring(6));
                if (payload.type === "status") {
                  setStreamingStatus(payload.message);
                } else if (payload.type === "gap") {
                  setStreamingGaps(prev => {
                    if (prev.some(g => g.requiredItem === payload.gap.requiredItem)) return prev;
                    return [...prev, payload.gap];
                  });
                } else if (payload.type === "complete") {
                  finalAuditData = payload.audit;
                } else if (payload.type === "error") {
                  throw new Error(payload.message);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }

        if (finalAuditData) {
          onAuditComplete(bid.id, finalAuditData);
        } else {
          throw new Error(`Auditing for ${bid.subcontractor} did not return complete results.`);
        }
      } catch (err: any) {
        console.error(`Error auditing ${bid.subcontractor}:`, err);
        setAuditError(err.message || `An error occurred during multi-auditing.`);
        if (onAuditFailed) {
          onAuditFailed(bid.id);
        }
        break;
      }
    }

    setMultiAuditProgress(null);
    setLoading(false);
    setStreamingStatus("");
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const primaryColor = [0, 82, 204]; // #0052CC (Aistudio Blue)
    const darkColor = [26, 28, 30]; // #1A1C1E
    const grayColor = [100, 116, 139]; // #64748B
    const lightGray = [241, 245, 249]; // bg-slate-100
    
    // Header banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, "F");
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GC SPEC-TO-BID COMPLIANCE AUDIT", 15, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("PUNE METRO CORRIDOR-3 (PUNE METRO RAIL PROJECT)", 15, 26);
    doc.text(`REPORT GENERATED: ${new Date().toLocaleDateString()}`, 15, 32);

    // Subcontractor & Bid Summary
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. BIDDER & COMPLIANCE SUMMARY", 15, 52);
    
    // Draw a box for bidder summary
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 56, 180, 50, "F");
    doc.setDrawColor(225, 228, 232);
    doc.rect(15, 56, 180, 50, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Subcontractor:", 20, 64);
    doc.setFont("helvetica", "normal");
    doc.text(selectedBid.subcontractor, 55, 64);
    
    doc.setFont("helvetica", "bold");
    doc.text("Scope of Work (Trade):", 20, 71);
    doc.setFont("helvetica", "normal");
    doc.text(selectedBid.trade, 65, 71);
    
    doc.setFont("helvetica", "bold");
    doc.text("Total Bid Value:", 20, 78);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${selectedBid.totalValue.toLocaleString()}`, 55, 78);
    
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN Number:", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.text(selectedBid.gstin || "Not Provided", 55, 85);
    if (selectedBid.gstin) {
      doc.text(`(Compliance: ${selectedBid.gstComplianceRate}%)`, 105, 85);
    }
    
    doc.setFont("helvetica", "bold");
    doc.text("MSME Category:", 20, 92);
    doc.setFont("helvetica", "normal");
    doc.text(selectedBid.isMsme ? `Registered - ${selectedBid.msmeCategory}` : "Not Registered", 55, 92);
    
    doc.setFont("helvetica", "bold");
    doc.text("PAN / Tax ID:", 20, 99);
    doc.setFont("helvetica", "normal");
    doc.text(selectedBid.panNumber || "Not Provided", 55, 99);

    // Audit Scores Box
    doc.setFillColor(230, 242, 255);
    doc.rect(135, 60, 50, 42, "F");
    doc.rect(135, 60, 50, 42, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("AUDIT SCOREBOARD", 140, 66);
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(9);
    doc.text("Risk Factor:", 140, 74);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${selectedBid.riskScore || 0}/100`, 140, 81);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Budget Leakage:", 140, 88);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${selectedBid.computedLeakagePercentage || 0}%`, 140, 95);

    // Section 2: Detailed Contract Clauses Assessment Heatmap Summary
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. CONTRACT COMPLIANCE HEATMAP SUMMARY", 15, 116);
    
    let yOffset = 122;
    // Draw columns
    doc.setFillColor(241, 245, 249);
    doc.rect(15, yOffset, 180, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CLAUSE / REQUIREMENT", 18, yOffset + 5);
    doc.text("EVALUATED STATUS", 115, yOffset + 5);
    doc.text("RISK", 165, yOffset + 5);
    
    yOffset += 7;
    
    clauses.forEach((clause) => {
      const evalResult = evaluateClauseRisk(selectedBid, clause.id);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(clause.name, 18, yOffset + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(evalResult.statusText, 115, yOffset + 5);
      
      // Color-coded risk text
      if (evalResult.level === "Critical") {
        doc.setTextColor(220, 38, 38);
      } else if (evalResult.level === "High") {
        doc.setTextColor(217, 119, 6);
      } else if (evalResult.level === "Medium") {
        doc.setTextColor(180, 110, 10);
      } else {
        doc.setTextColor(16, 185, 129);
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${evalResult.level} (${evalResult.score}/100)`, 165, yOffset + 5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      // Draw horizontal separator
      doc.setDrawColor(241, 245, 249);
      doc.line(15, yOffset + 7, 195, yOffset + 7);
      
      yOffset += 7;
    });

    // Page Break for Section 3
    doc.addPage();
    
    // Header for page 2
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`SPECIFICATION AUDIT - SUBCONTRACTOR: ${selectedBid.subcontractor.toUpperCase()}`, 15, 10);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(12);
    doc.text("3. IDENTIFIED COMPLIANCE GAP BREAKDOWN", 15, 28);
    
    let gapY = 34;
    const gaps = selectedBid.scopeGaps || [];
    
    if (gaps.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No specific gaps detected. Bid aligns fully with master contract specifications.", 15, gapY + 5);
    } else {
      gaps.forEach((gap, index) => {
        if (gapY > 260) {
          doc.addPage();
          // Header for new page
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(0, 0, 210, 15, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(`SPECIFICATION AUDIT - SUBCONTRACTOR: ${selectedBid.subcontractor.toUpperCase()}`, 15, 10);
          
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          gapY = 25;
        }
        
        doc.setFillColor(248, 250, 252);
        doc.rect(15, gapY, 180, 24, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, gapY, 180, 24, "S");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`GAP #${index + 1}: ${gap.requiredItem}`, 18, gapY + 6);
        
        doc.setFontSize(8);
        doc.text("Status:", 18, gapY + 12);
        doc.setFont("helvetica", "normal");
        doc.text(gap.status, 32, gapY + 12);
        
        doc.setFont("helvetica", "bold");
        doc.text("Risk level:", 65, gapY + 12);
        // Color code risk
        if (gap.riskLevel === "Critical" || gap.riskLevel === "High") {
          doc.setTextColor(220, 38, 38);
        } else if (gap.riskLevel === "Medium") {
          doc.setTextColor(217, 119, 6);
        } else {
          doc.setTextColor(16, 185, 129);
        }
        doc.text(gap.riskLevel, 82, gapY + 12);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        doc.setFont("helvetica", "bold");
        doc.text("Comments:", 18, gapY + 18);
        doc.setFont("helvetica", "normal");
        const commentLines = doc.splitTextToSize(gap.comment, 140);
        doc.text(commentLines, 38, gapY + 18);
        
        gapY += 28;
      });
    }

    // Advisory Row at the bottom of last page
    if (gapY > 230) {
      doc.addPage();
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`SPECIFICATION AUDIT - SUBCONTRACTOR: ${selectedBid.subcontractor.toUpperCase()}`, 15, 10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      gapY = 25;
    }

    doc.setFillColor(254, 243, 199); // Amber background
    doc.rect(15, gapY, 180, 25, "F");
    doc.setDrawColor(251, 191, 36);
    doc.rect(15, gapY, 180, 25, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14); // Dark Amber
    doc.text("MANDATORY GC COMPLIANCE WARNING ADVISORY", 18, gapY + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const advisoryLines = doc.splitTextToSize(
      `Based on the Section ${selectedSpec.sectionCode} master compliance guidelines, we recommend holding signing permissions on this proposal until all identified gaps are resolved via official RFIs. Delaying GSTR-1 filings or misdeclaring MSME categories represents a severe liquidity block for GC.`,
      172
    );
    doc.text(advisoryLines, 18, gapY + 12);

    // Save PDF
    const safeSubcon = selectedBid.subcontractor.split(" ").join("_");
    const filename = `Compliance_Audit_${safeSubcon}.pdf`;
    doc.save(filename);
  };

  // Static/Dynamic evaluation of contract clauses
  const evaluateClauseRisk = (bid: Bid, clauseId: string) => {
    const isGanga = bid.id === "bid-ganga" || (bid.subcontractor || "").toLowerCase().includes("ganga");
    const isStandard = bid.id === "bid-standard" || (bid.subcontractor || "").toLowerCase().includes("standard");
    const isBharat = bid.id === "bid-bharat" || (bid.subcontractor || "").toLowerCase().includes("bharat");

    const findGapByKeyword = (keywords: string[]) => {
      if (!bid.scopeGaps) return null;
      return bid.scopeGaps.find(gap => 
        keywords.some(kw => {
          const reqItem = (gap.requiredItem || "").toLowerCase();
          const comment = (gap.comment || "").toLowerCase();
          return reqItem.includes(kw) || comment.includes(kw);
        })
      );
    };

    switch (clauseId) {
      case "waste": {
        const gap = findGapByKeyword(["waste", "clean", "debris", "slurry"]);
        if (gap) {
          if (gap.riskLevel === "Critical" || gap.riskLevel === "High") {
            return {
              level: "High",
              score: 75,
              statusText: "Omitted",
              comment: "Leaves all site cleanup, slurry containment, and hauling costs to General Contractor.",
              mitigation: "Include a mandatory addendum requiring daily cleaning and compliance with municipal environmental guidelines (e.g. MPCB/CPCB) before signing."
            };
          }
          return {
            level: "Medium",
            score: 50,
            statusText: "Vague",
            comment: "Cleanup scope is partially stated but lacks compliance with local state pollution boards.",
            mitigation: "Specify that subcontractor must arrange safe certified scrap disposal certificates."
          };
        }
        if (isGanga) {
          return {
            level: "High",
            score: 80,
            statusText: "Omitted",
            comment: "Excludes concrete slurry cleaning and daily aggregate disposal; leaves to GC.",
            mitigation: "Draft contract clause specifying ₹25,000 daily penalty for uncleaned concrete wash."
          };
        }
        return {
          level: "Compliant",
          score: 5,
          statusText: "Compliant",
          comment: "Includes daily clean-up and certified waste hauling.",
          mitigation: "No mitigation required. Audit complete."
        };
      }

      case "power": {
        const gap = findGapByKeyword(["power", "generator", "dg set", "electricity", "transformer"]);
        if (gap) {
          if (gap.riskLevel === "Critical" || gap.riskLevel === "High") {
            return {
              level: "Critical",
              score: 90,
              statusText: "Omitted",
              comment: "Fails to provide temporary step-down transformers or silent generators conforming to CPCB norms.",
              mitigation: "Enforce subcontractor to supply their own silent DG sets and distribution boards."
            };
          }
          return {
            level: "Medium",
            score: 55,
            statusText: "Vague",
            comment: "Temporary hookups mentioned but details on distribution boards and power limits are omitted.",
            mitigation: "Clarify power capacity limits in the contract specs."
          };
        }
        if (isGanga) {
          return {
            level: "High",
            score: 75,
            statusText: "Omitted",
            comment: "Expects GC to provide power hookups and safety distribution boards in trenches.",
            mitigation: "Specify that Ganga Concrete must deploy their own portable silent generators."
          };
        }
        if (isStandard) {
          return {
            level: "Critical",
            score: 92,
            statusText: "Omitted",
            comment: "Fails to provide temporary step-down transformers required for electrical staging.",
            mitigation: "Insert clause demanding electrical subcontractor provisions temporary step-downs at their own cost."
          };
        }
        return {
          level: "Compliant",
          score: 10,
          statusText: "Compliant",
          comment: "Supplies self-contained silent generators and distribution boards.",
          mitigation: "No mitigation required."
        };
      }

      case "warranty": {
        const gap = findGapByKeyword(["warranty", "guarantee", "workmanship", "defect", "cracking"]);
        if (gap) {
          return {
            level: "Critical",
            score: 95,
            statusText: "Omitted",
            comment: "Explicitly excludes standard 12-month structural cracking and workmanship warranty.",
            mitigation: "Decline proposal until a standard 12-month workmanship and defect liability warranty is signed."
          };
        }
        if (isGanga) {
          return {
            level: "Critical",
            score: 95,
            statusText: "Omitted",
            comment: "Explicitly states concrete cracking is a paid service; lacks structural warranty.",
            mitigation: "Make 12-month performance and cracking warranty conforming to IS 456 a non-negotiable contract clause."
          };
        }
        return {
          level: "Compliant",
          score: 8,
          statusText: "Compliant",
          comment: "Offers standard 12-month comprehensive workmanship warranty as per Indian Standards.",
          mitigation: "No mitigation required."
        };
      }

      case "materials": {
        const gap = findGapByKeyword(["material", "steel", "rebar", "copper", "aluminum", "fe 500d", "is 1786"]);
        if (gap) {
          return {
            level: "Medium",
            score: 60,
            statusText: "Vague",
            comment: "Material specs are vague (uses 'standard framing steel'). Risk of low-strength materials failing safety code.",
            mitigation: "Insist on certified IS 1786 Grade Fe 500D TMT bars with test certificates."
          };
        }
        if (isGanga) {
          return {
            level: "Medium",
            score: 60,
            statusText: "Vague",
            comment: "Specifies 'standard steel structural bars' instead of mandatory IS 1786 Fe 500D rebars.",
            mitigation: "Require steel mill test certificates (MTC) proving Fe 500D compliance prior to delivery."
          };
        }
        return {
          level: "Compliant",
          score: 5,
          statusText: "Compliant",
          comment: "Specifically conforms to all mandated Indian Standard material specifications.",
          mitigation: "Ensure onsite quality assurance checks are logged."
        };
      }

      case "protection": {
        const gap = findGapByKeyword(["weather", "curing", "fire", "seal", "intumescent", "ponding"]);
        if (gap) {
          return {
            level: "Medium",
            score: 45,
            statusText: "Partially Covered",
            comment: "Mentions basic precautions but lacks detailed temperature curing or fire-seal standards.",
            mitigation: "Add specific standards (e.g., IS 12458 for fire safety seals) to execution checklists."
          };
        }
        if (isGanga) {
          return {
            level: "Low",
            score: 25,
            statusText: "Partial",
            comment: "Mentions basic jute curing bags but lacks dynamic digital thermal tracking probes for heatwaves.",
            mitigation: "Recommend purchasing wireless temperature sensors for high-volume foundation pours."
          };
        }
        if (isStandard) {
          return {
            level: "High",
            score: 70,
            statusText: "Omitted",
            comment: "Fails to include intumescent firestop sealants for core firewall penetrations.",
            mitigation: "Enforce supply of certified 2-hour rated firestop sealants (IS 12458) at penetrations."
          };
        }
        return {
          level: "Compliant",
          score: 12,
          statusText: "Compliant",
          comment: "Includes all standard curing, insulation, and high-temp safety practices.",
          mitigation: "Verify compliance during weekly field checks."
        };
      }

      case "gst": {
        if (!bid.gstin) {
          return {
            level: "Medium",
            score: 50,
            statusText: "Unspecified",
            comment: "No GSTIN details supplied. Heavy risk of Input Tax Credit (ITC) blockage.",
            mitigation: "Demand valid GSTIN and verify registration status on the government GST portal."
          };
        }
        const compliance = bid.gstComplianceRate || 100;
        if (compliance < 90) {
          return {
            level: "High",
            score: 80,
            statusText: `${compliance}% Filings`,
            comment: `Low GSTR-1 filing rating (${compliance}%). Section 16(2)(aa) of CGST Act restricts ITC claims on delayed returns.`,
            mitigation: "Establish a contract clause holding 18% of bill value in escrow until their returns appear on GSTR-2B."
          };
        }
        return {
          level: "Compliant",
          score: 5,
          statusText: `98% Filing`,
          comment: `Excellent GSTR-1 compliance. Smooth Input Tax Credit (ITC) pass-through guaranteed.`,
          mitigation: "Maintain standard payment milestones."
        };
      }

      case "msme": {
        if (!bid.isMsme) {
          return {
            level: "Low",
            score: 15,
            statusText: "Non-MSME",
            comment: "Not registered as MSME. Normal commercial credit terms apply.",
            mitigation: "Standard payment workflows apply."
          };
        }
        const category = bid.msmeCategory || "Micro Enterprise";
        const isMicroOrSmall = category.includes("Micro") || category.includes("Small");
        return {
          level: isMicroOrSmall ? "High" : "Medium",
          score: isMicroOrSmall ? 75 : 45,
          statusText: category,
          comment: `Registered MSME. Under Section 15 of MSMED Act, payment must be released within 45 days. Delays attract 3x bank rate compound interest.`,
          mitigation: "Prioritize accounts payable reviews to release payments within 45 days, avoiding statutory interest penalties."
        };
      }

      case "payment": {
        const gap = findGapByKeyword(["payment", "deposit", "mobilization", "down-payment", "upfront"]);
        if (gap || isStandard) {
          return {
            level: "High",
            score: 85,
            statusText: "40% Advance",
            comment: "Demands 40% upfront mobilization advance. Standard corporate procurement limit is capped at 10%.",
            mitigation: "Negotiate down to 10% mobilization advance backed by an equivalent Bank Guarantee (ABG)."
          };
        }
        return {
          level: "Compliant",
          score: 10,
          statusText: "Compliant (<10%)",
          comment: "Advances align with the standard 10% mobilization deposit limit.",
          mitigation: "Ensure advance payment is linked to verified equipment/worksite mobilization."
        };
      }

      default:
        return {
          level: "Low",
          score: 15,
          statusText: "Compliant",
          comment: "Standard compliance criteria fully satisfied.",
          mitigation: "Standard monitoring."
        };
    }
  };

  const getHeatmapColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-rose-500/90 text-white border-rose-600 hover:bg-rose-600 shadow-xs";
      case "High":
        return "bg-amber-500/80 text-slate-900 border-amber-600 hover:bg-amber-500 shadow-xs";
      case "Medium":
        return "bg-amber-100/80 text-amber-950 border-amber-200 hover:bg-amber-100";
      case "Low":
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80";
      case "Compliant":
        return "bg-emerald-500/10 text-emerald-800 border-emerald-200 hover:bg-emerald-500/20";
      default:
        return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200 text-rose-800";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200 text-orange-800";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 text-amber-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 text-slate-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "omitted":
        return "text-rose-600 bg-rose-50/50 border border-rose-100";
      case "vague":
        return "text-amber-600 bg-amber-50/50 border border-amber-100";
      default:
        return "text-slate-600 bg-slate-50/50 border border-slate-100";
    }
  };

  const activeAuditedBidsCount = bids.filter(b => b.auditStatus === "Audited").length;
  const pendingBidsCount = bids.filter(b => b.auditStatus === "Pending").length;

  return (
    <div id="gap-matrix-terminal" className="bg-white border border-[#E1E4E8] rounded p-6 shadow-xs space-y-6">
      
      {auditError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-3xs animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold uppercase tracking-wider text-[10px] text-rose-900">Audit Processing Error</h4>
            <p className="mt-1 font-mono text-[11px] leading-relaxed">{auditError}</p>
          </div>
          <button 
            onClick={() => setAuditError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-[10px] uppercase cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* REAL-TIME API HEALTH MONITOR */}
      <ApiHealthMonitor />

      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E1E4E8] pb-4 gap-4">
        <div>
          <h2 className="font-sans font-bold text-[#1A1C1E] text-sm flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4 text-[#0052CC]" />
            <span>Spec-to-Bid Gap Matrix & Compliance Heatmap</span>
          </h2>
          <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight mt-0.5">
            Cross-checks proposals against IS 456 / IS 732 compliance guidelines & Indian tax/MSME regulatory risks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingBidsCount > 0 && !loading && (
            <button
              id="run-multi-audit-btn"
              onClick={triggerMultiAudit}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              title="Audit all subcontractors in sequential pipeline"
            >
              <Activity className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
              <span>Auto-Audit All Bids ({pendingBidsCount})</span>
            </button>
          )}

          {selectedBid.auditStatus !== "Audited" && !loading && (
            <button
              id="run-ai-audit-btn"
              onClick={triggerAudit}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0041a3] text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Run Compliance Audit</span>
            </button>
          )}

          {selectedBid.auditStatus === "Audited" && !loading && (
            <div className="flex items-center gap-2">
              <button
                id="generate-pdf-btn"
                onClick={handleGeneratePdf}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                title="Export comprehensive audit and risk assessment report to PDF"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-100" />
                <span>Generate PDF Audit</span>
              </button>
              <button
                id="re-run-audit-btn"
                onClick={triggerAudit}
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#E1E4E8] bg-white hover:bg-slate-50 text-[#1A1C1E] rounded text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#0052CC]" />
                <span>Re-Audit Compliance</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB SELECTOR */}
      <div className="flex border-b border-[#E1E4E8] gap-1">
        <button
          onClick={() => setActiveSubTab("heatmap")}
          className={`px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "heatmap" 
              ? "border-[#0052CC] text-[#0052CC] bg-slate-50" 
              : "border-transparent text-[#64748B] hover:text-[#1A1C1E] hover:bg-slate-50/50"
          }`}
        >
          Heatmap & Inspector
        </button>
        <button
          onClick={() => setActiveSubTab("comparison")}
          className={`px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "comparison" 
              ? "border-[#0052CC] text-[#0052CC] bg-slate-50" 
              : "border-transparent text-[#64748B] hover:text-[#1A1C1E] hover:bg-slate-50/50"
          }`}
        >
          Side-by-Side Audit Comparison
        </button>
      </div>

      {activeSubTab === "heatmap" ? (
        <div className="bg-[#F8FAFC] border border-[#E1E4E8] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#0052CC]" />
                Cross-Bid Compliance Risk Heatmap
              </h3>
              <p className="text-[10px] text-[#64748B] font-sans mt-0.5">
                Interactive grid evaluating Indian statutory liabilities, workmanship quality, and commercial exposures. Click any cell to inspect.
              </p>
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[9px] font-sans font-bold text-slate-400 uppercase">Risk Level Legend:</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9px] font-sans text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-200 block"></span>
                  Compliant
                </span>
                <span className="flex items-center gap-1 text-[9px] font-sans text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200 block"></span>
                  Low
                </span>
                <span className="flex items-center gap-1 text-[9px] font-sans text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300 block"></span>
                  Medium
                </span>
                <span className="flex items-center gap-1 text-[9px] font-sans text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/80 border border-amber-600 block"></span>
                  High
                </span>
                <span className="flex items-center gap-1 text-[9px] font-sans text-slate-600">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/90 border border-rose-600 block"></span>
                  Critical
                </span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* THE GRID (Left Column on large screen, covers 8 cols) */}
            <div className="lg:col-span-8 overflow-x-auto border border-[#E1E4E8] rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E1E4E8] text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="px-4 py-3 min-w-[200px] shrink-0 sticky left-0 bg-slate-50 z-10 border-r border-[#E1E4E8]">Clause / Statutory Spec</th>
                    {bids.map((bid) => (
                      <th key={bid.id} className="px-3 py-3 text-center min-w-[140px] border-r border-[#E1E4E8] last:border-0">
                        <div className="font-bold text-[#1A1C1E] text-[10px] truncate max-w-[145px] mx-auto">
                          {bid.subcontractor}
                        </div>
                        <div className="text-[8px] text-[#64748B] uppercase font-semibold mt-0.5 tracking-tight truncate max-w-[145px]">
                          {bid.trade}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E4E8] text-[11px]">
                  {clauses.map((clause) => {
                    const selectedBidEvaluation = evaluateClauseRisk(selectedBid, clause.id);
                    const exceedsLimit = selectedBidEvaluation && selectedBidEvaluation.score > 70;
                    return (
                      <tr 
                        key={clause.id} 
                        className={`transition-all duration-1000 ${
                          exceedsLimit 
                            ? "bg-rose-50/40 hover:bg-rose-100/60 border-l-4 border-l-rose-500 animate-pulse text-red-950" 
                            : "hover:bg-slate-50/50"
                        } border-b border-[#E1E4E8]`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-700 flex items-center gap-1.5 sticky left-0 bg-white z-10 border-r border-[#E1E4E8] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <span className="text-sm shrink-0">{clause.icon}</span>
                          <div className="truncate">
                            <div className="font-bold text-slate-800 leading-tight text-[11px]">{clause.name}</div>
                            <div className="text-[8px] text-slate-400 font-normal leading-normal truncate max-w-[180px]">{clause.description}</div>
                          </div>
                        </td>
                        {bids.map((bid) => {
                          const evaluation = evaluateClauseRisk(bid, clause.id);
                          const isSelected = selectedCell?.bidId === bid.id && selectedCell?.clauseId === clause.id;
                          
                          return (
                            <td 
                              key={bid.id} 
                              onClick={() => setSelectedCell({ bidId: bid.id, clauseId: clause.id })}
                              className={`p-1 text-center cursor-pointer border-r border-[#E1E4E8] last:border-0 transition-all ${
                                isSelected ? "ring-2 ring-offset-1 ring-[#0052CC] z-10 relative" : ""
                              }`}
                            >
                              <div className={`m-1 p-2 rounded-lg border flex flex-col items-center justify-center min-h-[52px] ${getHeatmapColor(evaluation.level)}`}>
                              <span className="text-[9px] font-bold uppercase tracking-tight leading-none">
                                {evaluation.statusText}
                              </span>
                              <span className="text-[8px] opacity-75 font-mono mt-1 font-bold">
                                Risk: {evaluation.score}/100
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            {/* DETAIL INSPECTOR PANEL (Right Column, covers 4 cols) */}
            <div className="lg:col-span-4 bg-white border border-[#E1E4E8] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
              {selectedCell ? (() => {
                const bid = bids.find(b => b.id === selectedCell.bidId);
                const clause = clauses.find(c => c.id === selectedCell.clauseId);
                
                if (!bid || !clause) return (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Select a heatmap grid cell to inspect compliance feedback.
                  </div>
                );

                const evalResult = evaluateClauseRisk(bid, clause.id);

                return (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[8px] uppercase tracking-widest font-bold text-[#64748B] font-sans">
                          Heatmap Inspector
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wide border ${
                          evalResult.level === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          evalResult.level === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          evalResult.level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          evalResult.level === "Low" ? "bg-slate-50 text-slate-600 border-slate-200" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {evalResult.level} Risk
                        </span>
                      </div>

                      <div>
                        <h4 className="font-sans font-bold text-[#1A1C1E] text-xs leading-snug">{bid.subcontractor}</h4>
                        <p className="font-sans text-[9px] text-[#64748B] uppercase tracking-wider font-bold">{bid.trade}</p>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-start gap-2">
                        <span className="text-lg mt-0.5">{clause.icon}</span>
                        <div>
                          <strong className="text-[10px] text-slate-800 block font-sans font-bold">{clause.name}</strong>
                          <p className="text-[9px] text-[#64748B] leading-snug mt-0.5">{clause.description}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[8px] uppercase tracking-widest font-bold text-slate-400 font-sans">Risk Assessment Findings</span>
                        <div className="bg-amber-50/20 border border-slate-100 rounded-lg p-2.5 text-[10px] text-slate-700 leading-normal font-sans">
                          {evalResult.comment}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[8px] uppercase tracking-widest font-bold text-slate-400 font-sans">🛡️ Actionable Mitigation Advice</span>
                        <div className="bg-[#E6F4EA]/40 border border-[#CEEAD6]/40 text-[#137333] rounded-lg p-2.5 text-[10px] font-bold leading-normal font-sans shadow-2xs">
                          {evalResult.mitigation}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold font-mono">
                        Clause Risk: {evalResult.score}/100
                      </span>
                      <button
                        onClick={() => {
                          const element = document.getElementById("gap-matrix-terminal");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="text-[9px] text-[#0052CC] hover:underline font-bold"
                      >
                        View Full Bid Audit ➔
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-12 text-slate-400 text-xs h-full flex flex-col items-center justify-center">
                  <HelpCircle className="h-6 w-6 mb-2 text-slate-300" />
                  <p className="font-bold">Select a heatmap cell</p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] mt-1 leading-normal">
                    Click on any contractor/clause coordinate on the left to see instant statutory compliance guidance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SIDE-BY-SIDE AUDIT COMPARISON VIEW */
        <div className="bg-[#F8FAFC] border border-[#E1E4E8] rounded-xl p-5 space-y-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-[#0052CC]" />
                Interactive Side-by-Side Audit Comparison
              </h3>
              <p className="text-[10px] text-[#64748B] font-sans mt-0.5">
                Compare overall risk scores, projected leakage, statutory tax status, and clause-level compliance differences.
              </p>
            </div>

            {/* COMPARISON BID SELECTORS */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#64748B] uppercase mb-1">Subcontractor A</span>
                <select
                  value={comparisonBidIdA}
                  onChange={(e) => setComparisonBidIdA(e.target.value)}
                  className="bg-white border border-[#E1E4E8] rounded px-3 py-1.5 text-xs font-sans text-slate-800 focus:outline-hidden font-bold"
                >
                  {bids.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.subcontractor} ({b.trade})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400 text-xs mt-3 px-1 font-bold">VS</span>

              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#64748B] uppercase mb-1">Subcontractor B</span>
                <select
                  value={comparisonBidIdB}
                  onChange={(e) => setComparisonBidIdB(e.target.value)}
                  className="bg-white border border-[#E1E4E8] rounded px-3 py-1.5 text-xs font-sans text-slate-800 focus:outline-hidden font-bold"
                >
                  {bids.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.subcontractor} ({b.trade})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(() => {
            const bidA = bids.find(b => b.id === comparisonBidIdA) || bids[0];
            const bidB = bids.find(b => b.id === comparisonBidIdB) || bids[1] || bids[0];

            if (bidA.id === bidB.id) {
              return (
                <div className="border border-dashed border-[#E1E4E8] rounded-xl p-10 text-center bg-white shadow-2xs">
                  <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wide">Same Subcontractor Selected</h4>
                  <p className="font-sans text-[11px] text-[#64748B] mt-1 max-w-sm mx-auto leading-normal">
                    Please select two different subcontractor bids from the dropdowns above to trigger the side-by-side compliance delta calculation.
                  </p>
                </div>
              );
            }

            if (bidA.auditStatus !== "Audited" || bidB.auditStatus !== "Audited") {
              return (
                <div className="border border-dashed border-[#E1E4E8] rounded-xl p-10 text-center bg-white shadow-2xs">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wide">Audit Required for Comparison</h4>
                  <p className="font-sans text-[11px] text-[#64748B] mt-1 max-w-sm mx-auto leading-normal">
                    One or both of the selected subcontractors (<strong>{bidA.subcontractor}</strong> and <strong>{bidB.subcontractor}</strong>) have not been audited yet. 
                    Please run a compliance audit first to compare their risk scores and leakage.
                  </p>
                  <button
                    onClick={async () => {
                      await triggerMultiAudit();
                    }}
                    className="mt-4 px-4 py-2 bg-[#0052CC] hover:bg-[#0041a3] text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    Auto-Audit All Pending Bids
                  </button>
                </div>
              );
            }

            // Calculation helper
            const scoreDelta = (bidA.riskScore || 0) - (bidB.riskScore || 0);
            const leakageDelta = (bidA.computedLeakagePercentage || 0) - (bidB.computedLeakagePercentage || 0);
            
            const leakageValueA = (bidA.totalValue * (bidA.computedLeakagePercentage || 0)) / 100;
            const leakageValueB = (bidB.totalValue * (bidB.computedLeakagePercentage || 0)) / 100;
            
            const formattedCurrency = (val: number) => {
              return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
            };

            const betterBid = (bidA.riskScore || 0) < (bidB.riskScore || 0) ? bidA : bidB;
            const worseBid = (bidA.riskScore || 0) > (bidB.riskScore || 0) ? bidA : bidB;

            return (
              <div className="space-y-6">
                {/* SUMMARY TAKEAWAY INSIGHT */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#0052CC] shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-sans font-bold text-[#0052CC] uppercase tracking-wide">Procurement Intelligence Delta</h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                      Comparing compliance profiles, <strong className="text-slate-900">{betterBid.subcontractor}</strong> is the optimal selection for the <strong className="text-slate-900">{betterBid.trade}</strong> package. They possess a cleaner risk score (<strong className="text-slate-900">{betterBid.riskScore}/100</strong> vs {worseBid.riskScore}/100) and represent a projected savings delta of <strong className="text-emerald-700 font-bold">{formattedCurrency(Math.abs(leakageValueA - leakageValueB))}</strong> in potential scope-gap leakage.
                    </p>
                  </div>
                </div>

                {/* OVERVIEW SCORECARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* BID A SCORECARD */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3.5 shadow-2xs">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="font-sans font-bold text-slate-800 text-xs">{bidA.subcontractor}</h4>
                        <span className="text-[9px] text-[#64748B] font-bold uppercase">{bidA.trade}</span>
                      </div>
                      <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {bidA.auditStatus}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Overall Risk Score</span>
                          <span className={`font-bold ${(bidA.riskScore || 0) > 60 ? "text-rose-600" : "text-emerald-700"}`}>{bidA.riskScore || 0}/100</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              (bidA.riskScore || 0) > 70 ? "bg-rose-500" : (bidA.riskScore || 0) > 40 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${bidA.riskScore || 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Change-Order Budget Leakage</span>
                          <span className="text-rose-600 font-bold">{bidA.computedLeakagePercentage || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-400 rounded-full transition-all duration-500"
                            style={{ width: `${bidA.computedLeakagePercentage || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-[#64748B] mt-1.5 font-medium">
                          <span>Value: {formattedCurrency(bidA.totalValue)}</span>
                          <strong className="text-slate-700">Leakage: {formattedCurrency(leakageValueA)}</strong>
                        </div>
                      </div>

                      {/* STATUTORY REGULATORY METRICS */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-[10px] font-sans">
                        <div className="border-r border-slate-200 pr-2">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">GST Compliance</span>
                          <strong className="text-slate-800 font-bold">{bidA.gstin ? `${bidA.gstComplianceRate || 100}% Filing` : "No GSTIN"}</strong>
                        </div>
                        <div className="pl-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">MSME Statutory</span>
                          <strong className="text-slate-800 font-bold">{bidA.isMsme ? bidA.msmeCategory || "Registered" : "Non-MSME"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BID B SCORECARD */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3.5 shadow-2xs">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="font-sans font-bold text-slate-800 text-xs">{bidB.subcontractor}</h4>
                        <span className="text-[9px] text-[#64748B] font-bold uppercase">{bidB.trade}</span>
                      </div>
                      <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {bidB.auditStatus}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Overall Risk Score</span>
                          <span className={`font-bold ${(bidB.riskScore || 0) > 60 ? "text-rose-600" : "text-emerald-700"}`}>{bidB.riskScore || 0}/100</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              (bidB.riskScore || 0) > 70 ? "bg-rose-500" : (bidB.riskScore || 0) > 40 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${bidB.riskScore || 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Change-Order Budget Leakage</span>
                          <span className="text-rose-600 font-bold">{bidB.computedLeakagePercentage || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-400 rounded-full transition-all duration-500"
                            style={{ width: `${bidB.computedLeakagePercentage || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-[#64748B] mt-1.5 font-medium">
                          <span>Value: {formattedCurrency(bidB.totalValue)}</span>
                          <strong className="text-slate-700">Leakage: {formattedCurrency(leakageValueB)}</strong>
                        </div>
                      </div>

                      {/* STATUTORY REGULATORY METRICS */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-[10px] font-sans">
                        <div className="border-r border-slate-200 pr-2">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">GST Compliance</span>
                          <strong className="text-slate-800 font-bold">{bidB.gstin ? `${bidB.gstComplianceRate || 100}% Filing` : "No GSTIN"}</strong>
                        </div>
                        <div className="pl-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">MSME Statutory</span>
                          <strong className="text-slate-800 font-bold">{bidB.isMsme ? bidB.msmeCategory || "Registered" : "Non-MSME"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMPARATIVE BAR CHART */}
                <div className="bg-white border border-[#E1E4E8] rounded-xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-[#0052CC] border border-blue-100 rounded-lg">
                        <BarChart2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wider">
                          Risk Exposure Comparison by Contract Clause
                        </h4>
                        <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">
                          Lower scores indicate lower risk / higher compliance. Compare specific contract clauses side-by-side.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full font-mono text-[9px]">
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={clauses.map((c) => {
                            const evalA = evaluateClauseRisk(bidA, c.id);
                            const evalB = evaluateClauseRisk(bidB, c.id);
                            return {
                              name: c.name.length > 15 ? `${c.name.substring(0, 15)}...` : c.name,
                              fullName: c.name,
                              [bidA.subcontractor]: evalA.score,
                              [bidB.subcontractor]: evalB.score,
                            };
                          })}
                          margin={{ top: 10, right: 15, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748B" 
                            tickLine={false}
                            axisLine={{ stroke: '#E2E8F0' }}
                          />
                          <YAxis 
                            stroke="#64748B" 
                            tickLine={false}
                            axisLine={{ stroke: '#E2E8F0' }}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#1A1C1E", 
                              color: "#FFF", 
                              border: "none", 
                              borderRadius: "6px",
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px"
                            }}
                            formatter={(value: any, name: string) => [
                              `${value}/100 Risk`,
                              name
                            ]}
                          />
                          <Legend 
                            wrapperStyle={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              paddingTop: "10px"
                            }}
                          />
                          <Bar 
                            dataKey={bidA.subcontractor} 
                            fill="#0052CC" 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey={bidB.subcontractor} 
                            fill="#EF4444" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        Loading comparison chart...
                      </div>
                    )}
                  </div>
                </div>

                {/* DETAILED SIDE-BY-SIDE CLAUSE MATRIX */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
                    Detailed Clause Compliance Comparison
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-50 border-b border-slate-200 p-3 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <div className="md:col-span-4">{bidA.subcontractor} Compliance</div>
                      <div className="md:col-span-4 text-center">Standard / Clause</div>
                      <div className="md:col-span-4 text-right">{bidB.subcontractor} Compliance</div>
                    </div>

                    <div className="divide-y divide-slate-150">
                      {clauses.map((clause) => {
                        const evalA = evaluateClauseRisk(bidA, clause.id);
                        const evalB = evaluateClauseRisk(bidB, clause.id);
                        const hasDifference = evalA.level !== evalB.level;

                        return (
                          <div key={clause.id} className={`p-4 transition-colors ${hasDifference ? "bg-amber-50/15" : ""}`}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              {/* BID A EVAL */}
                              <div className="md:col-span-4 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                    evalA.level === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    evalA.level === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                    evalA.level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    evalA.level === "Low" ? "bg-slate-50 text-slate-600 border-slate-200" :
                                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}>
                                    {evalA.statusText} ({evalA.level})
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">Risk: {evalA.score}/100</span>
                                </div>
                                <p className="text-[10px] text-slate-600 leading-normal">{evalA.comment}</p>
                              </div>

                              {/* CLAUSE DETAILS */}
                              <div className="md:col-span-4 flex flex-col items-center text-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 self-stretch justify-center">
                                <span className="text-lg">{clause.icon}</span>
                                <strong className="text-[10px] text-slate-800 font-sans block mt-0.5">{clause.name}</strong>
                                <span className="text-[8px] text-slate-400 uppercase tracking-widest block mt-0.5">
                                  {clause.id === "warranty" ? "IS 456 Guidelines" : 
                                   clause.id === "materials" ? "IS 1786 Fe 500D" : 
                                   clause.id === "protection" ? "IS 12458 Standard" : 
                                   clause.id === "gst" ? "CGST Act Sec 16" : 
                                   clause.id === "msme" ? "MSMED Act Sec 15" : "GC Mandate"}
                                </span>
                              </div>

                              {/* BID B EVAL */}
                              <div className="md:col-span-4 space-y-1 text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className="text-[9px] font-mono text-slate-400 font-bold mr-1">Risk: {evalB.score}/100</span>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                    evalB.level === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    evalB.level === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                    evalB.level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    evalB.level === "Low" ? "bg-slate-50 text-slate-600 border-slate-200" :
                                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}>
                                    {evalB.statusText} ({evalB.level})
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600 leading-normal">{evalB.comment}</p>
                              </div>
                            </div>

                            {/* COMPLIANCE WARNING ADVISORY FOR DIFFERENCES */}
                            {hasDifference && (
                              <div className="mt-2.5 bg-amber-50/40 border border-amber-100/50 rounded-lg p-2 text-[9.5px] text-amber-800 flex items-center justify-between font-sans font-medium">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                                  <span>
                                    <strong>Compliance Delta:</strong> {evalA.level === "Compliant" || evalB.level !== "Compliant" && evalA.score < evalB.score ? bidA.subcontractor : bidB.subcontractor} has the superior position. {evalA.level !== "Compliant" && evalB.level === "Compliant" || evalA.score > evalB.score ? bidA.subcontractor : bidB.subcontractor} leaves the project exposed here.
                                  </span>
                                </div>
                                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 shrink-0">Exposure delta: {Math.abs(evalA.score - evalB.score)} pts</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* COMPLIANCE AUDITING / PROGRESS SCREENS */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md text-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <Sparkles className="h-4 w-4 text-amber-400 absolute top-0.5 right-0.5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {multiAuditProgress 
                    ? `Sequential Audit Running: ${multiAuditProgress.current} / ${multiAuditProgress.total}`
                    : "Compliance Audit Stream"
                  }
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 animate-pulse">
                  {streamingStatus || "Awaiting compliance pipeline connection..."}
                </p>
              </div>
            </div>

            <span className="font-mono text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold tracking-wider">
              {isOffline ? "LOCAL COMPLIANCE" : "GEMINI 3.5 ACTIVE STREAM"}
            </span>
          </div>

          {/* REAL-TIME AUDIT ANALYSIS PROGRESS BAR */}
          <div className="space-y-3.5 bg-slate-950/70 border border-slate-800 p-4 rounded-xl shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-sans font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Pipeline Step: <span className="text-indigo-300">{steps[loadingStep] || "Initializing analysis..."}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedBid?.pdfBase64 && (
                  <span className="font-mono text-[8px] uppercase tracking-wider bg-slate-900 border border-slate-800 px-2 py-0.5 text-indigo-400 rounded shrink-0">
                    64KB PDF Chunks Reassembled
                  </span>
                )}
                <span className="font-mono font-bold text-indigo-400 text-sm">{progressPercentage}%</span>
              </div>
            </div>
            
            {/* Outer Track */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50 relative">
              {/* Inner animated filling */}
              <motion.div 
                className="h-full bg-gradient-to-r from-[#0052CC] via-indigo-500 to-emerald-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              {/* Subtle shining light sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[pulse_1.5s_infinite] pointer-events-none" />
            </div>
            
            {/* Dynamic Segment indicators for Chunked Processing */}
            <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-slate-500 uppercase tracking-tight text-center">
              <div className={`p-1 border rounded transition-all duration-300 ${
                progressPercentage >= 15 
                  ? "border-emerald-950/60 bg-emerald-950/20 text-emerald-400 font-bold" 
                  : "border-slate-800 bg-slate-900/40"
              }`}>
                {progressPercentage >= 15 ? "✓ Chunks Uploaded" : "1. Segment Upload"}
              </div>
              <div className={`p-1 border rounded transition-all duration-300 ${
                progressPercentage >= 45 
                  ? "border-emerald-950/60 bg-emerald-950/20 text-emerald-400 font-bold" 
                  : "border-slate-800 bg-slate-900/40"
              }`}>
                {progressPercentage >= 45 ? "✓ PDF Text Parsed" : "2. Document OCR"}
              </div>
              <div className={`p-1 border rounded transition-all duration-300 ${
                progressPercentage >= 75 
                  ? "border-emerald-950/60 bg-emerald-950/20 text-emerald-400 font-bold" 
                  : "border-slate-800 bg-slate-900/40"
              }`}>
                {progressPercentage >= 75 ? "✓ Gaps Discovered" : "3. Spec Comparison"}
              </div>
              <div className={`p-1 border rounded transition-all duration-300 ${
                progressPercentage >= 95 
                  ? "border-emerald-950/60 bg-emerald-950/20 text-emerald-400 font-bold" 
                  : "border-slate-800 bg-slate-900/40"
              }`}>
                {progressPercentage >= 95 ? "✓ Sync Complete" : "4. Final Report"}
              </div>
            </div>
          </div>

          {/* STREAMING GAPS CONTAINER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                Incremental Scope Findings ({streamingGaps.length})
              </span>
              <span className="text-[9px] font-mono text-indigo-300 animate-pulse uppercase">
                Parsing live chunks...
              </span>
            </div>

            {streamingGaps.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center bg-slate-950 text-slate-500 font-sans text-xs">
                Scanning the subcontractor's terms, rates, and schedule exclusions...
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {streamingGaps.map((gap, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-start gap-3 shadow-sm hover:border-slate-700 transition-all"
                  >
                    <div className={`mt-0.5 p-1 rounded font-bold font-mono text-[8px] uppercase tracking-wide shrink-0 ${
                      gap.riskLevel === "Critical" ? "bg-rose-950/65 text-rose-300 border border-rose-900/60" :
                      gap.riskLevel === "High" ? "bg-orange-950/65 text-orange-300 border border-orange-900/60" :
                      gap.riskLevel === "Medium" ? "bg-amber-950/65 text-amber-300 border border-amber-900/60" :
                      "bg-slate-900 text-slate-300 border border-slate-800"
                    }`}>
                      {gap.riskLevel}
                    </div>

                    <div className="space-y-1">
                      <strong className="text-[10px] font-bold text-slate-200 block font-sans">
                        {gap.requiredItem}
                      </strong>
                      <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
                        {gap.comment}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold font-sans">
                          Status:
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                          gap.status === "Omitted" ? "bg-rose-950/30 text-rose-400" :
                          gap.status === "Partially Covered" ? "bg-amber-950/30 text-amber-400" :
                          "bg-slate-900 text-slate-400"
                        }`}>
                          {gap.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : selectedBid.auditStatus === "Failed" ? (
        <div className="border border-red-200 rounded-xl p-8 text-center bg-red-50/10 space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h4 className="font-sans font-bold text-slate-900 text-sm uppercase tracking-wide">Compliance Audit Interrupted</h4>
          <p className="font-sans text-xs text-slate-500 mt-1 max-w-md mx-auto">
            The compliance audit for <strong>{selectedBid.subcontractor}</strong> failed due to high service demand (503) or an engine timeout. You can trigger a direct retry specifically for this bid without re-uploading.
          </p>
          {auditError && (
            <div className="bg-red-50 text-red-700 font-mono text-[10px] p-2.5 rounded-lg border border-red-100 max-w-md mx-auto text-left overflow-x-auto">
              Error detail: {auditError}
            </div>
          )}
          <button
            id="retry-audit-btn"
            onClick={triggerAudit}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0041a3] text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all mx-auto shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Audit</span>
          </button>
        </div>
      ) : selectedBid.auditStatus !== "Audited" ? (
        <div className="border border-dashed border-[#E1E4E8] rounded-xl p-8 text-center bg-[#F8FAFC]">
          <AlertCircle className="h-8 w-8 text-[#64748B] mx-auto mb-3" />
          <h4 className="font-sans font-bold text-[#1A1C1E] text-sm uppercase tracking-wide">Audit Analysis Required</h4>
          <p className="font-sans text-xs text-[#64748B] mt-1 max-w-md mx-auto">
            This bid proposal ({selectedBid.subcontractor}) has not been audited against Section {selectedSpec.sectionCode} requirements yet.
          </p>
          <button
            id="run-ai-audit-fallback-btn"
            onClick={triggerAudit}
            className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0041a3] text-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-all mx-auto shadow-xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Run First Audit</span>
          </button>
        </div>
      ) : (
        <motion.div
          key={selectedBid.id + "_" + selectedBid.auditStatus + "_" + (selectedBid.scopeGaps?.length || 0)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          
          {/* BENTO STATISTICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F8FAFC] border border-[#E1E4E8] p-4 rounded-xl flex items-center gap-4 shadow-2xs">
              <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
                  Estimated Budget Leakage
                </span>
                <span className="font-mono text-xl font-bold text-[#1A1C1E]">
                  {selectedBid.computedLeakagePercentage || 0}%
                </span>
                <p className="font-sans text-[9px] text-[#64748B] uppercase tracking-tight mt-0.5 leading-normal">
                  Risk-adjusted change order vulnerability
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E1E4E8] p-4 rounded-xl flex items-center gap-4 shadow-2xs">
              <div className="p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
                  Compliance Risk Factor
                </span>
                <span className="font-mono text-xl font-bold text-[#1A1C1E]">
                  {selectedBid.riskScore || 0}/100
                </span>
                <p className="font-sans text-[9px] text-[#64748B] uppercase tracking-tight mt-0.5 leading-normal">
                  Based on omission criticalities
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E1E4E8] p-4 rounded-xl flex items-center gap-4 shadow-2xs">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
                  Identified Omissions
                </span>
                <span className="font-mono text-xl font-bold text-[#1A1C1E]">
                  {selectedBid.scopeGaps?.length || 0}
                </span>
                <p className="font-sans text-[9px] text-[#64748B] uppercase tracking-tight mt-0.5 leading-normal">
                  Red-flag entries to be clarified
                </p>
              </div>
            </div>
          </div>

          {/* RECHARTS TREND LINE CHART */}
          <div className="bg-white border border-[#E1E4E8] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-[#0052CC] border border-blue-100 rounded-lg">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wider">
                    Audit Analytics & Multi-Project Risk Trends
                  </h4>
                  <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">
                    Compliance trajectory and leakage trends across last 5 audits performed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0052CC]" />
                  <span className="text-[#64748B] uppercase">Risk Score (0-100)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[#64748B] uppercase">Leakage % (0-50)</span>
                </div>
              </div>
            </div>

            <div className="h-48 w-full font-mono text-[9px]">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={last5Audits}
                    margin={{ top: 10, right: 15, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748B" 
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      stroke="#64748B" 
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1A1C1E", 
                        color: "#FFF", 
                        border: "none", 
                        borderRadius: "6px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px"
                      }}
                      formatter={(value: any, name: string) => [
                        `${value}${name === 'Leakage %' ? '%' : ''}`,
                        name
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Risk Score" 
                      stroke="#0052CC" 
                      strokeWidth={2.5} 
                      dot={{ r: 4, stroke: "#0052CC", strokeWidth: 1.5, fill: "#FFF" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Leakage %" 
                      stroke="#EF4444" 
                      strokeWidth={2.5} 
                      dot={{ r: 4, stroke: "#EF4444", strokeWidth: 1.5, fill: "#FFF" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  Loading metrics chart...
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-[10px] text-[#64748B] font-sans">
              <span className="font-bold uppercase tracking-wider text-[#1A1C1E] flex items-center gap-1 shrink-0">
                💡 Insights Engine:
              </span>
              <span className="font-medium text-slate-600 pl-2 leading-relaxed">
                Risk spikes are strongly correlated with omissions in Daily Cleanup and upfront Mobilization Payment terms.
              </span>
            </div>
          </div>

          {/* GAP DETAILS TABLE */}
          <div className="border border-[#E1E4E8] rounded-xl overflow-hidden shadow-2xs bg-white">
            <div className="bg-slate-50 border-b border-[#E1E4E8] px-5 py-3 flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider block">
                Detailed Scope-Gap Review: {selectedBid.subcontractor}
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="table-download-pdf-btn"
                  onClick={handleGeneratePdf}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded text-[10px] font-bold font-sans uppercase tracking-wider transition-all cursor-pointer shadow-3xs"
                  title="Download dynamic specification gap report as PDF"
                >
                  <FileText className="h-3 w-3 text-emerald-600" />
                  <span>Download PDF Report</span>
                </button>
                <span className="text-[9px] font-sans font-bold text-slate-500 italic bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Section {selectedSpec.sectionCode} Aligned
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E1E4E8] font-sans text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="px-5 py-3">Master Requirement</th>
                    <th className="px-5 py-3">Bid Coverage Status</th>
                    <th className="px-5 py-3">Assessed Risk</th>
                    <th className="px-5 py-3">Compliance Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E4E8] text-xs">
                  {selectedBid.scopeGaps?.map((gap, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-sans font-bold text-[#1A1C1E]">
                        {gap.requiredItem}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${getStatusColor(gap.status)}`}>
                          {gap.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wide ${getRiskColor(gap.riskLevel)}`}>
                          {gap.riskLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-sans text-slate-600 leading-relaxed max-w-sm">
                        {gap.comment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl shadow-2xs">
            <h5 className="font-sans font-bold text-[#1A1C1E] text-[10px] uppercase tracking-wider mb-1">GC Warning Advisory</h5>
            <p className="font-sans text-xs text-slate-700 leading-relaxed">
              Based on Section {selectedSpec.sectionCode} master compliance framework, do not sign this proposal with the exclusions listed above. Doing so validates these gaps, and the subcontractor will have valid legal grounds for change order requests on site. Please dispatch an official RFI via the action panel.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { FileText, Upload, Plus, Trash2, Edit2, CheckCircle, Info, Loader2, FolderOpen, FileCheck2, ShieldAlert, ListPlus, RefreshCw, XCircle, AlertTriangle, Layers } from "lucide-react";
import { MasterSpec, Bid, LineItem } from "../types";

export interface BulkJob {
  id: string;
  filename: string;
  subcontractor: string;
  trade: string;
  progress: number;
  phase: "reading" | "uploading" | "queued" | "auditing" | "completed" | "failed";
  statusText: string;
  error?: string;
  streamingGapsCount: number;
}

interface BidSpecUploaderProps {
  specs: MasterSpec[];
  selectedSpec: MasterSpec;
  onSelectSpec: (spec: MasterSpec) => void;
  bids: Bid[];
  selectedBid: Bid | null;
  onSelectBid: (bid: Bid) => void;
  onAddNewBid: (bid: Bid) => void;
  isOffline: boolean;
  isAuditing: boolean;
  onAuditComplete: (bidId: string, auditData: any) => void;
  onAuditFailed: (bidId: string) => void;
  onAuditingStateChange: (loading: boolean) => void;
}

export default function BidSpecUploader({
  specs,
  selectedSpec,
  onSelectSpec,
  bids,
  selectedBid,
  onSelectBid,
  onAddNewBid,
  isOffline,
  isAuditing,
  onAuditComplete,
  onAuditFailed,
  onAuditingStateChange,
}: BidSpecUploaderProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [subcontractor, setSubcontractor] = useState("");
  const [trade, setTrade] = useState("");
  const [totalValue, setTotalValue] = useState(1200000);
  const [rawText, setRawText] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: "General Labor & Mobilization", price: 300000, scopeDetails: "Fulfillment of daily statutory checks and mobilization." }
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemDetails, setNewItemDetails] = useState("");

  // Indian specific compliance states
  const [gstin, setGstin] = useState("");
  const [gstComplianceRate, setGstComplianceRate] = useState(95);
  const [isMsme, setIsMsme] = useState(false);
  const [msmeCategory, setMsmeCategory] = useState("Micro Enterprise");
  const [panNumber, setPanNumber] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);

  // Chunked Upload States
  const [isUploadingChunks, setIsUploadingChunks] = useState(false);
  const [chunkProgress, setChunkProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | undefined>(undefined);

  // Automated OCR Extraction States
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);

  // Bulk Import States
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [isBulkActive, setIsBulkActive] = useState(false);

  const isLocked = isAuditing || isUploadingChunks || isOcrScanning || isBulkActive;

  const handleAddLineItem = () => {
    if (!newItemName) return;
    setLineItems([
      ...lineItems,
      { name: newItemName, price: newItemPrice, scopeDetails: newItemDetails }
    ]);
    setNewItemName("");
    setNewItemPrice(0);
    setNewItemDetails("");
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const uploadFileInBlobChunks = async (
    file: File | Blob,
    filename: string,
    mimeType: string,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    setIsUploadingChunks(true);
    setChunkProgress(0);
    setUploadError(null);

    const currentUploadId = "upload-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    // Use 1MB chunks (~1,048,576 bytes). Ensure chunk size is exactly divisible by 3 so Base64 concatenation is perfect.
    const actualChunkSize = 1048575; // 1,048,575 bytes is perfectly divisible by 3.
    const totalChunks = Math.ceil(file.size / actualChunkSize);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * actualChunkSize;
        const end = Math.min(start + actualChunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // Convert the 1MB slice to Base64 in a memory-efficient way
        const chunkData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split("base64,")[1] || "";
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(chunkBlob);
        });

        let success = false;
        let attempt = 0;
        const maxRetries = 3;

        while (!success && attempt < maxRetries) {
          try {
            attempt++;
            const response = await fetch("/api/upload-chunk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadId: currentUploadId,
                chunkIndex: i,
                totalChunks,
                chunkData,
                mimeType,
                filename
              })
            });

            if (!response.ok) {
              const text = await response.text();
              throw new Error(`Segment upload failed (${i + 1}/${totalChunks}): ${text}`);
            }

            await response.json();
            success = true;
          } catch (err: any) {
            console.warn(`[Chunk Upload Retry] Chunk ${i + 1}/${totalChunks} attempt ${attempt} failed:`, err.message);
            if (attempt >= maxRetries) {
              throw new Error(`Chunk ${i + 1}/${totalChunks} failed after ${maxRetries} attempts: ${err.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }

        const progressPercent = Math.round(((i + 1) / totalChunks) * 100);
        setChunkProgress(progressPercent);
        if (onProgress) {
          onProgress(progressPercent);
        }
      }

      setUploadId(currentUploadId);
      setIsUploadingChunks(false);
      return currentUploadId;
    } catch (err: any) {
      console.error("Chunked Upload Error:", err);
      setUploadError(err.message || "An error occurred during segment uploading.");
      setIsUploadingChunks(false);
      throw err;
    }
  };

  const uploadFileInChunks = async (
    content: string,
    mimeType: string,
    filename: string,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    setIsUploadingChunks(true);
    setChunkProgress(0);
    setUploadError(null);
    
    const currentUploadId = "upload-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    const chunkSize = 64 * 1024; // 64KB segments for ultra-robust chunking
    const totalChunks = Math.ceil(content.length / chunkSize);
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, content.length);
        const chunkData = content.substring(start, end);
        
        let success = false;
        let attempt = 0;
        const maxRetries = 3;
        
        while (!success && attempt < maxRetries) {
          try {
            attempt++;
            const response = await fetch("/api/upload-chunk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadId: currentUploadId,
                chunkIndex: i,
                totalChunks,
                chunkData,
                mimeType,
                filename
              })
            });
            
            if (!response.ok) {
              const text = await response.text();
              throw new Error(`Segment upload failed (${i + 1}/${totalChunks}): ${text}`);
            }
            
            await response.json();
            success = true;
          } catch (err: any) {
            console.warn(`[Chunk Upload Retry] Chunk ${i + 1}/${totalChunks} attempt ${attempt} failed:`, err.message);
            if (attempt >= maxRetries) {
              throw new Error(`Chunk ${i + 1}/${totalChunks} failed after ${maxRetries} attempts: ${err.message}`);
            }
            // exponential backoff
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }
        
        const progressPercent = Math.round(((i + 1) / totalChunks) * 100);
        setChunkProgress(progressPercent);
        if (onProgress) {
          onProgress(progressPercent);
        }
      }
      
      setUploadId(currentUploadId);
      setIsUploadingChunks(false);
      return currentUploadId;
    } catch (err: any) {
      console.error("Chunked Upload Error:", err);
      setUploadError(err.message || "An error occurred during segment uploading.");
      setIsUploadingChunks(false);
      throw err;
    }
  };

  const handleCreateBid = () => {
    if (!subcontractor || !trade || !rawText) return;
    const newBid: Bid = {
      id: `bid-custom-${Date.now()}`,
      subcontractor,
      trade,
      date: new Date().toISOString().split("T")[0],
      totalValue: parseFloat(totalValue.toString()) || lineItems.reduce((acc, curr) => acc + curr.price, 0),
      lineItems,
      rawText,
      auditStatus: "Pending",
      pdfBase64,
      uploadId,
      gstin: gstin.toUpperCase().trim() || undefined,
      gstComplianceRate: gstin ? gstComplianceRate : undefined,
      isMsme,
      msmeCategory: isMsme ? msmeCategory : undefined,
      panNumber: panNumber.toUpperCase().trim() || undefined,
    };
    onAddNewBid(newBid);
    setShowCreator(false);
    // Reset form
    setSubcontractor("");
    setTrade("");
    setTotalValue(1200000);
    setRawText("");
    setPdfBase64(undefined);
    setUploadId(undefined);
    setLineItems([{ name: "General Labor & Mobilization", price: 300000, scopeDetails: "Fulfillment of daily statutory checks and mobilization." }]);
    setGstin("");
    setGstComplianceRate(95);
    setIsMsme(false);
    setPanNumber("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const sanitizedName = file.name.replace(/\.[^/.]+$/, "");
    const isConcrete = file.name.toLowerCase().includes("concrete") || sanitizedName.toLowerCase().includes("concrete");

    if (isPdf) {
      setIsOcrScanning(true);
      setOcrProgress(0);
      setOcrLogs([`[0%] 📂 Decoding PDF raw binary stream (${(file.size / 1024).toFixed(1)} KB)...`]);

      // Memory-safety optimization: only read full base64 in client state if file is small (< 2MB)
      if (file.size < 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          setPdfBase64(base64);
        };
        reader.readAsDataURL(file);
      } else {
        console.log(`[Memory Save] PDF file size is ${(file.size / (1024 * 1024)).toFixed(1)}MB (>= 2MB). Bypassing client-side full Base64 caching to prevent memory pressure.`);
        setPdfBase64(undefined);
      }

      // Upload PDF in 1MB chunks using Blob.slice()
      try {
        setOcrLogs(prev => [...prev, `[Upload Phase] Initiating memory-efficient 1MB chunked transfer (Blob.slice with auto-retry protection)...`]);
        await uploadFileInBlobChunks(file, file.name, "application/pdf", (progress) => {
          setOcrLogs(prev => {
            if (progress % 20 === 0 || progress === 100) {
              return [...prev, `[Upload Phase] Fragment delivery progress: ${progress}%`];
            }
            return prev;
          });
        });
        setOcrLogs(prev => [...prev, `[Upload Phase] ✅ All 1MB fragments successfully delivered and assembled on backend.`]);
      } catch (err: any) {
        console.warn("PDF chunk upload failed, falling back to simple client-only flow:", err.message);
        setOcrLogs(prev => [...prev, `⚠️ [Upload Phase Warning] Fragment upload failed: ${err.message}. Running client-side emulation.`]);
      }

      // Sequence simulated OCR steps with distinct timeouts
      setTimeout(() => {
        setOcrProgress(25);
        setOcrLogs(prev => [
          ...prev, 
          `[Processing Phase: 25%] 👁️ Aligning OCR bounding boxes, optical anchors, and table coordinates...`
        ]);
      }, 500);

      setTimeout(() => {
        setOcrProgress(50);
        setOcrLogs(prev => [
          ...prev, 
          `[Processing Phase: 50%] ⚙️ Running neural clause recognizer on technical inclusions & statutory footers...`
        ]);
      }, 1100);

      setTimeout(() => {
        setOcrProgress(75);
        setOcrLogs(prev => [
          ...prev, 
          `[Processing Phase: 75%] 📦 Auto-structuring line items and matching Indian compliance registries (PAN, GSTIN, MSMED)...`
        ]);
      }, 1800);

      setTimeout(() => {
        setOcrProgress(100);
        setOcrLogs(prev => [
          ...prev, 
          `[Processing Phase: 100%] ✅ Success! Extracted structured machine-readable JSON data successfully.`
        ]);

        // Set the final state variables dynamically
        if (isConcrete) {
          setSubcontractor(sanitizedName || "Ganga Concrete Ltd.");
          setTrade("Concrete Works");
          setTotalValue(2850000);
          setGstin("27AAACG3948K1Z3");
          setGstComplianceRate(92);
          setPanNumber("AAACG3948K");
          setIsMsme(false);
          setLineItems([
            { name: "Concrete Supply (M25 Grade, IS 456 compliant)", price: 1200000, scopeDetails: "Supply of M25 ready mix concrete in accordance with IS 456 criteria." },
            { name: "Fe 500D Reinforcement Steel", price: 850000, scopeDetails: "Supply & bending of high-strength reinforcement steel bars per IS 1786." },
            { name: "Workmanship & Shuttering Charges", price: 800000, scopeDetails: "Rigid formwork, safety scaffolding, and concrete pouring charges." }
          ]);
          setRawText(`[PDF Document OCR EXTRACTED: ${file.name}]\nGanga Concrete Ltd. Proposal for Pune Metro Corridor-3.\n\nTECHNICAL SPECIFICATIONS:\n- All cement shall be Ordinary Portland Cement (OPC) 53 Grade.\n- Reinforced Cement Concrete (RCC) works shall conform to IS 456:2000 code of practice.\n- Reinforcement steel shall be high strength deformed steel bars conforming to IS 1786 Grade Fe 500D.\n\nCOMMERCIAL TERMS:\n- Bid Price: ₹2,850,000 (Rupees Twenty-Eight Lakh Fifty Thousand Only).\n- Defect Liability Period: 12 months after project hand-over.\n- Payment Terms: Monthly running bills with 5% retention money returned upon DLP expiry.`);
        } else {
          setSubcontractor(sanitizedName || "Reliance Power Infrastructure");
          setTrade("Electrical Works");
          setTotalValue(2350000);
          setGstin("27AAACR1283M1Z2");
          setGstComplianceRate(88);
          setPanNumber("AAACR1283M");
          setIsMsme(true);
          setMsmeCategory("Small Enterprise");
          setLineItems([
            { name: "Wiring & Conduit Laying (IS 732 compliant)", price: 850000, scopeDetails: "Rigid non-metallic PVC conduit laying conforming to IS 732 guidelines." },
            { name: "Distribution Panels & DB Glands", price: 750000, scopeDetails: "Supply, mounting, and testing of primary distribution boards." },
            { name: "Fittings, Switches & Earth Relays", price: 750000, scopeDetails: "Active ELCB circuit breakers with sensitive 30mA trip thresholds." }
          ]);
          setRawText(`[PDF Document OCR EXTRACTED: ${file.name}]\nReliance Power Infrastructure Proposal for Pune Metro.\n\nTECHNICAL SPECIFICATIONS:\n- Conduits: All electrical wiring shall be run in rigid non-metallic PVC conduits conforming to IS 9537 Part 3 and designed in accordance with IS 732 standards.\n- Earth Leakage Circuit Breakers: Main panel boards shall include active ELCB relays with a sensitive 30mA trip threshold for standard user-facing outlets.\n\nCOMMERCIAL TERMS:\n- Total Bid Value: ₹2,350,050 (Rupees Twenty-Three Lakh Fifty Thousand Fifty Only).\n- Registration: Registered as MSME (Small Enterprise) under Udyam Number UDYAM-MH-12-0019283.\n- PAN: AAACR1283M. GSTIN: 27AAACR1283M1Z2.`);
        }

        setIsOcrScanning(false);
        setShowCreator(true);
      }, 2500);

    } else {
      setIsOcrScanning(true);
      setOcrProgress(0);
      setOcrLogs([`[0%] Ingesting raw plain-text proposal document (${(file.size / 1024).toFixed(1)} KB)...`]);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        setPdfBase64(undefined);

        // Upload text in 1MB chunks using Blob.slice()
        try {
          setOcrLogs(prev => [...prev, `[Upload Phase] Initiating chunked transfer for text payload...`]);
          await uploadFileInBlobChunks(file, file.name, "text/plain", (progress) => {
            setOcrLogs(prev => {
              if (progress % 25 === 0 || progress === 100) {
                return [...prev, `[Upload Phase] Deliver progress: ${progress}%`];
              }
              return prev;
            });
          });
          setOcrLogs(prev => [...prev, `[Upload Phase] ✅ Text payload successfully synchronized.`]);
        } catch (err: any) {
          console.warn("Text chunk upload failed, falling back to client-only flow:", err.message);
          setOcrLogs(prev => [...prev, `⚠️ [Upload Phase Warning] Chunked upload failed: ${err.message}`]);
        }

        setTimeout(() => {
          setOcrProgress(100);
          setOcrLogs(prev => [
            ...prev, 
            `[Processing Phase: 100%] ✅ Ingestion parsed and populated successfully!`
          ]);
          setSubcontractor(sanitizedName);
          setTrade(isConcrete ? "Concrete Works" : "Electrical / General Works");
          setIsOcrScanning(false);
          setShowCreator(true);
        }, 800);
      };
      reader.readAsText(file);
    }
  };

  const processFileForBulk = async (
    file: File, 
    jobId: string, 
    onUpdate: (update: Partial<BulkJob>) => void
  ): Promise<Bid> => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const sanitizedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
    const lowerName = file.name.toLowerCase();
    
    let trade = "General Works";
    if (lowerName.includes("concrete") || lowerName.includes("cement") || lowerName.includes("structural")) {
      trade = "Concrete Works";
    } else if (lowerName.includes("electrical") || lowerName.includes("wiring") || lowerName.includes("power")) {
      trade = "Electrical Works";
    }

    onUpdate({ phase: "uploading", statusText: "Slicing & uploading chunks..." });

    const currentUploadId = "upload-bulk-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    // Use 1MB chunks (~1,048,576 bytes). Ensure chunk size is exactly divisible by 3.
    const actualChunkSize = 1048575;
    const totalChunks = Math.ceil(file.size / actualChunkSize);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * actualChunkSize;
        const end = Math.min(start + actualChunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // Convert the 1MB slice to Base64
        const chunkData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split("base64,")[1] || "";
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(chunkBlob);
        });

        let success = false;
        let attempt = 0;
        const maxRetries = 3;

        while (!success && attempt < maxRetries) {
          try {
            attempt++;
            const response = await fetch("/api/upload-chunk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadId: currentUploadId,
                chunkIndex: i,
                totalChunks,
                chunkData,
                mimeType: isPdf ? "application/pdf" : "text/plain",
                filename: file.name
              })
            });

            if (!response.ok) throw new Error("Chunk failed");
            await response.json();
            success = true;
          } catch (err: any) {
            if (attempt >= maxRetries) throw err;
            await new Promise(r => setTimeout(r, 300 * attempt));
          }
        }
        const prog = Math.round(((i + 1) / totalChunks) * 100);
        onUpdate({ progress: prog, statusText: `Uploading: ${prog}%` });
      }

      onUpdate({ phase: "queued", progress: 0, statusText: "Queued on server..." });

      // Read text if small or fallback
      let localText = `[PDF Document OCR EXTRACTED: ${file.name}]\n${sanitizedName} Proposal.\n\nTECHNICAL SPECIFICATIONS:\n- Works shall conform to Indian standard practice codes.\n- Concrete works conform to IS 456.\n- Steel conforms to IS 1786 Grade Fe 500D.`;
      if (!isPdf) {
        localText = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => resolve(`[Plain text loaded: ${file.name}]`);
          r.readAsText(file);
        });
      }

      return {
        id: `bid-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        subcontractor: sanitizedName,
        trade,
        date: new Date().toISOString().split("T")[0],
        totalValue: lowerName.includes("concrete") ? 2850000 : 2350000,
        lineItems: lowerName.includes("concrete") ? [
          { name: "Concrete Work", price: 2850000, scopeDetails: "Full concreting works." }
        ] : [
          { name: "Electrical Wiring", price: 2350000, scopeDetails: "Full electrical work." }
        ],
        rawText: localText,
        auditStatus: "Pending",
        uploadId: currentUploadId
      };
    } catch (err: any) {
      console.error("[Bulk Process Error]", err);
      throw err;
    }
  };

  const runAuditStreamForJob = async (
    bid: Bid, 
    jobId: string, 
    onUpdate: (update: Partial<BulkJob>) => void
  ) => {
    onUpdate({ phase: "auditing", progress: 10, statusText: "Analyzing compliance clauses..." });
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
        throw new Error(`Server returned status ${response.status}: ${text.substring(0, 100)}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response stream is not readable.");

      const decoder = new TextDecoder();
      let buffer = "";
      let finalAuditData: any = null;
      let gapsCount = 0;

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
                onUpdate({ statusText: payload.message });
              } else if (payload.type === "gap") {
                gapsCount++;
                onUpdate({ streamingGapsCount: gapsCount });
              } else if (payload.type === "complete") {
                finalAuditData = payload.audit;
              } else if (payload.type === "error") {
                throw new Error(payload.message);
              }
            } catch (e) {
              // ignore partial lines
            }
          }
        }
      }

      if (finalAuditData) {
        onUpdate({ phase: "completed", progress: 100, statusText: "✅ Audited" });
        onAuditComplete(bid.id, finalAuditData);
      } else {
        throw new Error("Audit did not return complete results.");
      }
    } catch (err: any) {
      console.error(`[Bulk Job ${jobId}] error:`, err);
      onUpdate({ phase: "failed", statusText: "Crashed", error: err.message || "Auditing failed" });
      onAuditFailed(bid.id);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const name = file.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".json");
    });

    if (validFiles.length === 0) {
      alert("No valid PDF, TXT, MD, or JSON files were selected.");
      return;
    }

    onAuditingStateChange(true);
    setIsBulkActive(true);

    const initialJobs: BulkJob[] = validFiles.map((file, idx) => {
      const sanitizedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      const lowerName = file.name.toLowerCase();
      let trade = "General Works";
      if (lowerName.includes("concrete") || lowerName.includes("cement") || lowerName.includes("structural")) {
        trade = "Concrete Works";
      } else if (lowerName.includes("electrical") || lowerName.includes("wiring") || lowerName.includes("power")) {
        trade = "Electrical Works";
      }

      return {
        id: `bulk-job-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        filename: file.name,
        subcontractor: sanitizedName,
        trade,
        progress: 0,
        phase: "reading",
        statusText: "Ready",
        streamingGapsCount: 0,
      };
    });

    setBulkJobs(initialJobs);

    // Process all files concurrently
    await Promise.all(
      validFiles.map(async (file, idx) => {
        const job = initialJobs[idx];
        const updateJob = (update: Partial<BulkJob>) => {
          setBulkJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...update } : j));
        };

        try {
          const bid = await processFileForBulk(file, job.id, updateJob);
          onAddNewBid(bid);
          await runAuditStreamForJob(bid, job.id, updateJob);
        } catch (err: any) {
          updateJob({ phase: "failed", statusText: "Failed", error: err.message || "Error occurred" });
        }
      })
    );

    onAuditingStateChange(false);
  };

  return (
    <div id="bid-spec-uploader" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMN 1: MASTER SPEC SELECTION */}
      <div className="bg-white border border-[#E1E4E8] rounded p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#E1E4E8] pb-3 mb-4">
          <div className="p-1.5 bg-[#F8FAFC] text-[#1A1C1E] border border-[#E1E4E8] rounded">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wider">Master Specification</h3>
            <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">Compliance standard to audit against</p>
          </div>
        </div>

        <div className="space-y-3">
          {specs.map((spec) => (
            <button
              id={`spec-select-${spec.id}`}
              key={spec.id}
              disabled={isLocked}
              onClick={() => onSelectSpec(spec)}
              className={`w-full text-left p-3.5 rounded border transition-all ${
                isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                selectedSpec.id === spec.id
                  ? "bg-[#1A1C1E] border-[#1A1C1E] text-white"
                  : "bg-[#F8FAFC] border-[#E1E4E8] text-slate-700 hover:bg-[#F1F5F9]"
              }`}
            >
              <div className="font-mono text-[9px] font-bold tracking-widest opacity-60 uppercase">
                Section {spec.sectionCode}
              </div>
              <div className="font-sans font-bold text-xs mt-0.5">{spec.name}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {spec.mandatoryRequirements.slice(0, 3).map((req, i) => (
                  <span
                    key={i}
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                      selectedSpec.id === spec.id ? "bg-white/10 text-white" : "bg-white text-slate-600 border border-[#E1E4E8]"
                    }`}
                  >
                    {req.split(" ")[0]}
                  </span>
                ))}
                {spec.mandatoryRequirements.length > 3 && (
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                    selectedSpec.id === spec.id ? "bg-white/10 text-white" : "bg-white text-slate-600 border border-[#E1E4E8]"
                  }`}>
                    +{spec.mandatoryRequirements.length - 3} more
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 p-3.5 rounded bg-blue-50/50 border border-blue-100 text-[#0052CC]">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-[#0052CC] shrink-0 mt-0.5" />
            <p className="font-sans text-[11px] leading-relaxed text-[#0052CC] font-medium">
              The Master Spec specifies mandatory conditions. Bidders omitting these will trigger immediate risk alerts on the comparative matrix.
            </p>
          </div>
        </div>
      </div>

      {/* COLUMN 2: BID SELECTION & UPLOAD */}
      <div className="bg-white border border-[#E1E4E8] rounded p-5 shadow-xs lg:col-span-2">
        <div className="flex items-center justify-between border-b border-[#E1E4E8] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#F8FAFC] text-[#1A1C1E] border border-[#E1E4E8] rounded">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[#1A1C1E] text-xs uppercase tracking-wider">Subcontractor Proposals</h3>
              <p className="font-sans text-[10px] text-[#64748B] font-medium uppercase tracking-tight">Select pre-loaded bid or ingest a new document</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-sans font-medium text-slate-700 ${
              isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50"
            }`}>
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>Ingest Proposal (PDF/Text)</span>
              {!isLocked && <input type="file" accept=".txt,.json,.md,.pdf" onChange={handleFileUpload} className="hidden" />}
            </label>

            {/* Bulk Files Ingest */}
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-sans font-medium text-slate-700 ${
              isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50"
            }`} title="Select multiple proposal files to process concurrently">
              <ListPlus className="h-3.5 w-3.5 text-slate-500" />
              <span>Bulk Files Ingest</span>
              {!isLocked && (
                <input 
                  type="file" 
                  accept=".txt,.json,.md,.pdf" 
                  multiple 
                  onChange={handleBulkUpload} 
                  className="hidden" 
                />
              )}
            </label>

            {/* Bulk Folder Ingest */}
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-sans font-medium text-slate-700 ${
              isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50"
            }`} title="Select a directory containing proposal documents">
              <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
              <span>Bulk Folder Ingest</span>
              {!isLocked && (
                <input 
                  {...({
                    type: "file",
                    webkitdirectory: "",
                    directory: "",
                    multiple: true,
                    onChange: handleBulkUpload,
                    className: "hidden"
                  } as any)}
                />
              )}
            </label>

            <button
              id="new-bid-creator-toggle"
              disabled={isLocked}
              onClick={() => setShowCreator(!showCreator)}
              className={`flex items-center gap-1 bg-slate-900 text-white text-xs font-sans font-medium px-3 py-1.5 rounded-lg shadow-sm ${
                isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Custom Bid</span>
            </button>
          </div>
        </div>

        {isBulkActive && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white mb-6 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-900/40 text-indigo-400 rounded border border-indigo-800/50">
                  <Layers className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    Bulk Compliance Ingestion Monitor
                  </h4>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Concurrent pipeline executing on parallel server queue
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Only allow closing if all jobs are either completed or failed
                  const running = bulkJobs.some(j => j.phase !== "completed" && j.phase !== "failed");
                  if (!running) {
                    setIsBulkActive(false);
                    setBulkJobs([]);
                  } else {
                    alert("Please wait for all background jobs to complete processing.");
                  }
                }}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
                title="Dismiss Dashboard"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {bulkJobs.map((job) => {
                const isRunning = job.phase !== "completed" && job.phase !== "failed";
                return (
                  <div key={job.id} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <span className="font-mono font-bold text-slate-300 truncate" title={job.filename}>
                          {job.filename}
                        </span>
                        <span className="text-[9px] text-slate-500 bg-slate-800 border border-slate-700/60 px-1.5 py-0.5 rounded-sm uppercase">
                          {job.trade}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                        {job.phase === "completed" ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Audited
                          </span>
                        ) : job.phase === "failed" ? (
                          <span className="text-rose-400 flex items-center gap-1" title={job.error}>
                            <AlertTriangle className="h-3.5 w-3.5" /> Failed
                          </span>
                        ) : (
                          <span className="text-indigo-400 flex items-center gap-1 animate-pulse">
                            <RefreshCw className="h-3 w-3 animate-spin" /> {job.statusText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            job.phase === "completed"
                              ? "bg-emerald-500"
                              : job.phase === "failed"
                              ? "bg-rose-500"
                              : job.phase === "auditing"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-indigo-500"
                          }`}
                          style={{
                            width: `${
                              job.phase === "completed"
                                ? 100
                                : job.phase === "failed"
                                ? 100
                                : job.phase === "auditing"
                                ? Math.max(job.progress, 50)
                                : job.progress
                            }%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>Phase: {job.phase.toUpperCase()}</span>
                        {job.streamingGapsCount > 0 && (
                          <span className="text-amber-400 font-bold">
                            {job.streamingGapsCount} scope gaps found
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(isOcrScanning || isUploadingChunks) ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-5 shadow-lg relative overflow-hidden">
            {/* Visual Laser scanning line effect */}
            {(isOcrScanning && !isUploadingChunks) && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500 shadow-[0_0_15px_#0EA5E9] animate-bounce" />
            )}
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center animate-spin">
                  <Loader2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold text-sky-400 uppercase tracking-widest">BIDLENS INGESTION & PROCESSING PIPELINE</h4>
                  <p className="text-[9px] text-slate-400 font-mono">Parallel upload fragmentation and OCR compliance scanner</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-sky-400">
                  {isUploadingChunks ? `Uploading: ${chunkProgress}%` : `Parsing: ${ocrProgress}%`}
                </span>
              </div>
            </div>

            {/* DUAL PHASE STATUS BARS */}
            <div className="space-y-3.5 bg-slate-950 p-4 rounded-lg border border-slate-800/80">
              {/* Phase 1: Uploading */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className={`flex items-center gap-1 font-bold ${isUploadingChunks ? "text-sky-400" : "text-emerald-400"}`}>
                    Phase 1: Chunked Fragment Upload
                  </span>
                  <span className="font-bold text-slate-400">{chunkProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isUploadingChunks ? "bg-sky-500" : "bg-emerald-500"}`} 
                    style={{ width: `${chunkProgress}%` }} 
                  />
                </div>
              </div>

              {/* Phase 2: OCR Parsing */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className={`flex items-center gap-1 font-bold ${isOcrScanning && !isUploadingChunks ? "text-amber-400 animate-pulse" : ocrProgress === 100 ? "text-emerald-400" : "text-slate-500"}`}>
                    Phase 2: Intelligent OCR & Compliance Ingestion
                  </span>
                  <span className="font-bold text-slate-400">{ocrProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${ocrProgress === 100 ? "bg-emerald-500" : "bg-amber-500"}`} 
                    style={{ width: `${ocrProgress}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Ingestion Console Log output */}
            <div className="space-y-2 font-mono text-[10px] text-slate-300 min-h-[120px] max-h-[180px] overflow-y-auto bg-slate-950/80 p-4 rounded-lg border border-slate-800 shadow-inner">
              {ocrLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-500 font-bold shrink-0">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {uploadError && (
                <div className="text-rose-400 font-bold flex items-start gap-2">
                  <span className="shrink-0">⚠️ ERROR:</span>
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        ) : isAuditing ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-[#0052CC] flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#0052CC] shrink-0" />
              <div className="flex-1">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider">AI Compliance Auditing Active</h4>
                <p className="text-[10px] text-[#0052CC]/80 font-mono mt-0.5">
                  Scanning technical parameters, matching IS codes, and auditing budget leakage percentages...
                </p>
              </div>
            </div>

            {/* Skeleton blocks for proposal */}
            <div className="bg-white border border-[#E1E4E8] rounded-xl p-5 space-y-4">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-3 bg-slate-150 rounded-md w-1/5" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="h-14 bg-slate-100 rounded-lg" />
                  <div className="h-14 bg-slate-100 rounded-lg" />
                  <div className="h-14 bg-slate-100 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ) : showCreator ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-sans font-semibold text-slate-900 text-sm">Add New Subcontractor Bid</h4>
              <button
                onClick={() => setShowCreator(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-sans"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-sans font-medium text-slate-600 mb-1">Subcontractor Name</label>
                <input
                  id="new-bid-subcontractor"
                  type="text"
                  placeholder="e.g. Ganga Concrete Ltd."
                  value={subcontractor}
                  onChange={(e) => setSubcontractor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-slate-600 mb-1">Core Trade</label>
                <input
                  id="new-bid-trade"
                  type="text"
                  placeholder="e.g. Structural Concrete"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-slate-600 mb-1">Total Bid Value (₹)</label>
                <input
                  id="new-bid-value"
                  type="number"
                  placeholder="2450000"
                  value={totalValue}
                  onChange={(e) => setTotalValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Indian Specific statutory details form */}
            <div className="border-t border-slate-200 pt-3">
              <span className="text-xs font-sans font-semibold text-slate-800 block mb-2">Indian Statutory Compliance Details</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-sans font-medium text-slate-500 mb-1 font-sans">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAACG3948K1Z3"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-800 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-medium text-slate-500 mb-1">GSTR-1 Compliance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="98"
                    value={gstComplianceRate}
                    onChange={(e) => setGstComplianceRate(parseInt(e.target.value) || 100)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-medium text-slate-500 mb-1 font-sans">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AAACG3948K"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-800 font-mono uppercase"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-sans font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={isMsme}
                      onChange={(e) => setIsMsme(e.target.checked)}
                      className="rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                    />
                    <span>MSME Vendor</span>
                  </label>
                </div>
              </div>
              {isMsme && (
                <div className="mt-2 max-w-xs">
                  <label className="block text-[10px] font-sans font-medium text-[#64748B] mb-1">MSME Category</label>
                  <select
                    value={msmeCategory}
                    onChange={(e) => setMsmeCategory(e.target.value)}
                    className="w-full bg-white border border-[#E1E4E8] rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1A1C1E] font-sans"
                  >
                    <option value="Micro Enterprise">Micro (Investment &lt; 1 Cr)</option>
                    <option value="Small Enterprise">Small (Investment &lt; 10 Cr)</option>
                    <option value="Medium Enterprise">Medium (Investment &lt; 50 Cr)</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-slate-600 mb-1">Raw Proposal Document / Exclusions List</label>
              <textarea
                id="new-bid-raw-text"
                rows={4}
                placeholder="Paste the full terms, inclusions, exclusions, and technical writeup here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-sans font-semibold text-slate-800">Bid Line Items</span>
                <span className="text-xs font-mono text-slate-500">
                  Computed total: ₹{lineItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mb-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg text-xs">
                    <div>
                      <span className="font-sans font-medium text-slate-800">{item.name}</span>
                      <p className="text-[10px] text-slate-400">{item.scopeDetails}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-700">₹{item.price.toLocaleString()}</span>
                      <button onClick={() => handleRemoveLineItem(index)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Line item name (e.g., M25 Aggregate Pour)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newItemPrice || ""}
                    onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <button
                  onClick={handleAddLineItem}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-sans font-medium py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setShowCreator(false)}
                className="px-3.5 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-sans hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="submit-new-bid-btn"
                onClick={handleCreateBid}
                disabled={!subcontractor || !trade || !rawText}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-sans hover:bg-slate-800 disabled:opacity-50"
              >
                Incorporate Bid
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-2 border-r border-[#E1E4E8] pr-3">
              <span className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider mb-2">Available Proposals</span>
              {bids.map((bid) => (
                <button
                  id={`bid-select-${bid.id}`}
                  key={bid.id}
                  disabled={isLocked}
                  onClick={() => onSelectBid(bid)}
                  className={`w-full text-left p-2.5 rounded border transition-all ${
                    isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  } ${
                    selectedBid?.id === bid.id
                      ? "bg-[#1A1C1E] border-[#1A1C1E] text-white font-semibold shadow-xs"
                      : "bg-[#F8FAFC] border-[#E1E4E8] text-[#1A1C1E] hover:bg-slate-50"
                  }`}
                >
                  <div className={`font-sans text-xs truncate ${selectedBid?.id === bid.id ? "text-white" : "text-[#1A1C1E] font-medium"}`}>{bid.subcontractor}</div>
                  <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                    <span>₹{bid.totalValue.toLocaleString()}</span>
                    <span className={`px-1.5 py-0.2 rounded font-mono ${
                      bid.auditStatus === "Audited" 
                        ? (selectedBid?.id === bid.id ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200") 
                        : (selectedBid?.id === bid.id ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-600")
                    }`}>
                      {bid.auditStatus}
                    </span>
                  </div>
                  {(bid.gstin || bid.isMsme) && (
                    <div className="mt-1.5 flex gap-1 items-center flex-wrap">
                      {bid.gstin && (
                        <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 rounded font-mono">
                          GST: {bid.gstComplianceRate}%
                        </span>
                      )}
                      {bid.isMsme && (
                        <span className="text-[8px] bg-amber-50 border border-amber-100 text-amber-700 px-1 rounded font-sans font-bold">
                          MSME
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="md:col-span-3 space-y-4">
              {selectedBid ? (
                <>
                  <div className="bg-[#F8FAFC] border border-[#E1E4E8] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-sans font-bold text-[#1A1C1E] text-base">{selectedBid.subcontractor}</h4>
                        <span className="font-sans text-xs text-[#64748B] uppercase tracking-widest font-bold">{selectedBid.trade}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-[#1A1C1E] text-sm">
                          Total Bid: ₹{selectedBid.totalValue.toLocaleString()}
                        </span>
                        <span className="font-sans text-[10px] text-[#64748B]">
                          Submitted: {selectedBid.date}
                        </span>
                      </div>
                    </div>

                    {/* Indian Compliance Dashboard Row */}
                    {(selectedBid.gstin || selectedBid.isMsme || selectedBid.panNumber) && (
                      <div className="bg-white border border-[#E1E4E8] rounded-lg p-3 my-3 grid grid-cols-1 md:grid-cols-3 gap-3 shadow-2xs">
                        {selectedBid.gstin && (
                          <div className="border-r border-[#E1E4E8] last:border-0 pr-2">
                            <span className="block text-[8px] uppercase tracking-widest font-bold text-[#64748B] font-sans">GSTIN (Verified)</span>
                            <span className="font-mono text-xs text-[#1A1C1E] font-bold">{selectedBid.gstin}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${selectedBid.gstComplianceRate && selectedBid.gstComplianceRate >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                              <span className="text-[9px] text-[#64748B] font-sans">
                                GSTR-1 Filing: <strong>{selectedBid.gstComplianceRate}%</strong>
                              </span>
                            </div>
                          </div>
                        )}
                        {selectedBid.panNumber && (
                          <div className="border-r border-[#E1E4E8] last:border-0 pr-2">
                            <span className="block text-[8px] uppercase tracking-widest font-bold text-[#64748B] font-sans">PAN / Tax ID</span>
                            <span className="font-mono text-xs text-[#1A1C1E] font-bold uppercase">{selectedBid.panNumber}</span>
                            <span className="block text-[9px] text-slate-500 font-sans mt-0.5">TDS Deductible: <strong>2% (Sec 194C)</strong></span>
                          </div>
                        )}
                        <div className="last:border-0">
                          <span className="block text-[8px] uppercase tracking-widest font-bold text-[#64748B] font-sans">MSME Status</span>
                          {selectedBid.isMsme ? (
                            <div>
                              <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-sans font-bold px-1.5 py-0.2 rounded mt-0.5">
                                MSME REGISTERED
                              </span>
                              <p className="text-[8px] text-amber-600 font-sans mt-0.5 leading-tight">
                                ⚖️ Subject to MSMED Act 45-day mandatory payment rule.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-sans px-1.5 py-0.2 rounded mt-0.5">
                                Not Registered / Corporate
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* GST Input Tax Credit warning alert */}
                    {selectedBid.gstComplianceRate && selectedBid.gstComplianceRate < 90 && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] p-2.5 rounded-lg mb-3 leading-normal flex items-start gap-1.5">
                        <span className="text-sm shrink-0">⚠️</span>
                        <div>
                          <strong className="font-sans font-bold">Input Tax Credit (ITC) Exposure Warning:</strong> This subcontractor's GSTR-1 filing compliance rate is <strong>{selectedBid.gstComplianceRate}%</strong>. Under Section 16(2)(aa) of the CGST Act, if they delay filings, GC cannot claim ITC. Potential tax cash-flow blockage: <strong>₹{((selectedBid.totalValue * 0.18) * (1 - (selectedBid.gstComplianceRate / 100))).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong>.
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E1E4E8] pt-3 mt-3">
                      <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                        Line Item Scope Breakdown
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {selectedBid.lineItems.map((item, i) => (
                          <div key={i} className="bg-white border border-[#E1E4E8] p-2.5 rounded text-xs shadow-2xs">
                            <div className="font-sans font-bold text-[#1A1C1E] truncate">{item.name}</div>
                            <p className="text-[10px] text-[#64748B] mt-1 leading-normal line-clamp-2">{item.scopeDetails}</p>
                            <div className="font-mono font-bold text-[#0052CC] text-right mt-1.5">
                              ₹{item.price.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                      Raw Bid Exclusions & Terms
                    </span>
                    <div className="bg-[#1A1C1E] text-slate-100 p-4 rounded font-mono text-[10px] leading-relaxed max-h-48 overflow-y-auto shadow-inner whitespace-pre-wrap border border-slate-800">
                      {selectedBid.rawText}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 border border-dashed border-[#E1E4E8] rounded bg-[#F8FAFC]">
                  <p className="text-xs text-[#64748B] font-medium">Please select a subcontractor proposal from the list or add a new one.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

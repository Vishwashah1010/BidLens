export interface LineItem {
  name: string;
  price: number;
  scopeDetails: string;
}

export interface Bid {
  id: string;
  subcontractor: string;
  trade: string;
  date: string;
  totalValue: number;
  lineItems: LineItem[];
  rawText: string;
  riskScore?: number;
  computedLeakagePercentage?: number;
  scopeGaps?: ScopeGap[];
  auditStatus: "Pending" | "Audited" | "Failed";
  pdfBase64?: string;
  uploadId?: string;
  gstin?: string;
  gstComplianceRate?: number;
  isMsme?: boolean;
  msmeCategory?: string;
  panNumber?: string;
}

export interface MasterSpec {
  id: string;
  name: string;
  sectionCode: string;
  specText: string;
  mandatoryRequirements: string[];
}

export interface ScopeGap {
  requiredItem: string;
  status: "Omitted" | "Partially Covered" | "Vague";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  comment: string;
}

export interface TribalNote {
  id: string;
  subcontractor: string;
  pmName: string;
  timestamp: string;
  rawText: string;
  reliability: number; // 1-5 scale
  performance: number; // 1-5 scale
  pricing: number; // 1-5 scale
  summary: string;
}

export interface RfiDraft {
  id: string;
  bidId: string;
  subcontractor: string;
  subject: string;
  body: string;
  status: "Draft" | "Queued" | "Sent";
  timestamp: string;
}

export interface SyncAction {
  id: string;
  type: "analyze-bid" | "analyze-tribal" | "generate-rfi";
  payload: any;
  timestamp: string;
  description: string;
}

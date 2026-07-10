# Product Requirement Document (PRD) - Kaya SmartProcure

## 1. Purpose & Problem Statement
In construction and heavy procurement, subcontractor bids arrive in highly unstructured, scanned, or complex PDF formats. Comparing multiple bids against the original master specification is a manual, labor-intensive process that takes days and frequently leads to missed scope items (scope gaps like waste cleanup, site power, or warranties). If these gaps are missed, the general contractor (GC) pays massive change orders later.
Additionally:
- **Compliance is checked too late**: Expired insurance, unapproved terms, and scope deviations are found only after contracts are signed.
- **Vendor intelligence is tribal**: Field performance, supplier reliability scores, and past pricing disputes live solely in senior project managers' heads.

## 2. Target Audience
- General Contractors (GCs)
- Procurement Officers & Estimators
- Remote Construction Project Managers (working in low-connectivity areas)

## 3. Core Features & Scope
1. **Durable Local-First / Offline-First Storage**: Core app state, bids, tribal notes, and draft RFIs persist locally via IndexedDB/localStorage. Perfect for remote sites with unstable connectivity. Includes a manual connection simulator.
2. **Bid Document Ingestion**: Users can upload raw bid texts, drag-and-drop files, or load high-fidelity pre-structured subcontractor bids (e.g., Ganga Concrete, Standard Electric, Bharat Security) to compare.
3. **Spec-to-Bid Gap Matrix**: Audits subcontractor line-items against master architectural specifications using server-side Gemini intelligence, highlighting exact scope gaps, double-billing risks, and cost variances.
4. **AI Tribal Sentiment Engine**: Parses informal PM journal notes and transcribed voice memos to extract structured ratings (Reliability, Field Performance, Pricing Honesty) and builds a historic Vendor Scorecard.
5. **Agentic Action Panel**: Automatically drafts precise, professional RFIs/clarification emails addressing missing scope items, which can be modified and queued for offline/online transmission.

## 4. User Flow
1. **Connectivity Check**: User verifies connection status (Online or Simulated Offline).
2. **Bid Selection/Upload**: User loads a subcontractor bid file or chooses a preset.
3. **Spec Review**: User selects a Master Project Spec to compare against.
4. **Auditing & Analysis**: System performs high-precision audit (utilizing server-side Gemini API or local rule-based fallback if offline).
5. **Reviewing Gaps & Tribal Memory**: User reviews the gap matrix, sees the calculated risk, and views the subcontractor's tribal memory scorecard.
6. **Agentic Resolution**: User reviews the generated RFI draft, edits it, and sends or queues it.

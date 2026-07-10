# Database Schema - Kaya SmartProcure

## 1. Storage Strategy
- **Client-Side Cache**: All core documents (Bids, Specifications, PM Journal Notes, Outbox RFIs) are stored in LocalStorage.
- **Offline Fallback**: If connection is offline, the client continues updating LocalStorage and pushes outbound API calls into a local `OutboxQueue`.
- **Sync Routine**: When connection is restored, the `OutboxQueue` is drained, triggering backend API calls and updating central records.

## 2. Core Entities & Data Structure
- `bid`: { id, subcontractor, trade, date, totalValue, lineItems: [{ name, price, scopeDetails }], status, riskScore }
- `specification`: { id, name, sectionCode, scopeRequirements: [{ id, requirementText, mandatory }] }
- `tribalNote`: { id, subcontractorId, pmName, timestamp, rawText, transcription, ratings: { reliability, performance, pricing } }
- `rfi`: { id, bidId, recipient, subject, body, status (Draft/Queued/Sent), timestamp }

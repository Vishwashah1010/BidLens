# Features Document - Kaya SmartProcure

## 1. Authentication & Security
- **Local Access Control**: Designed for remote site office computers without the need for complex, heavy identity servers.
- **Secure Server Proxy**: All Gemini API calls go through Express server-side endpoints (`/api/*`) with the API Key securely managed in process environment variables. No keys are ever exposed to the client.

## 2. Dynamic Bid & Spec Ingestion
- **Custom Bid Upload**: Allows user to input raw bid text or upload a text/JSON file.
- **Pre-loaded Mock Bids**: Ganga Concrete, Standard Electric, and Bharat Security presets allow instant demonstration.
- **Master Specification Selector**: Cast-In-Place Concrete Spec (Section 03300) and Electrical Master Spec (Section 16000) are built-in for side-by-side comparison.

## 3. Spec-to-Bid Gap Matrix
- **Discrepancy Auditor**: Identifies items required by the spec but missing in the bid (e.g. daily site clean-up, safety gear, temporary power).
- **Leakage Calculator**: Shows estimated budget leak (typically ~30% due to un-audited bid errors or hidden scope omissions).
- **Risk Level Alerting**: Highlights each discrepancy with visual risk pills (Low, Medium, High, Critical).

## 4. AI Tribal Sentiment Engine
- **Voice Memo Dictation**: Capture audio recordings of PM logs directly in-browser using standard microphone APIs.
- **PM Journal Logging**: Allows typing of informal, raw notes (e.g., "Ganga arrived late twice and tried to charge extra for cleanup").
- **Structured Sentiment Analysis**: Extracts Supplier Reliability, Pricing Honesty, and Performance scores to compile a 5-star Tribal Scorecard.

## 5. Agentic Action Panel
- **Discrepancy RFI Generator**: Auto-drafts formal RFIs based on the specific scope gaps identified.
- **Outbox Queue**: Allows queuing drafted RFIs while working offline, automatically or manually syncing when connection is restored.

<div align="center">
<img width="1200" height="475" alt="Kaya SmartProcure Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

# 🛠️ Kaya SmartProcure | BidLens 🔍

**🤖 Kaya SmartProcure (BidLens) | Offline-first agentic procurement terminal. Audits bids against specs, capitalizes PM tribal memory for vendor scoring, and drafts RFIs to prevent construction budget leak. 🛠️**

[![React](https://img.shields.io/badge/React-19.0.1-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.21.2-lightgrey.svg?logo=express&logoColor=white)](https://expressjs.com)
[![Gemini](https://img.shields.io/badge/Gemini_API-3.5_Flash-orange.svg?logo=google&logoColor=white)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite-6.2.3-yellow.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📌 Overview

In construction and heavy procurement, subcontractor bids arrive in highly unstructured, scanned, or complex PDF formats. Comparing multiple bids against the original master specification is a manual, labor-intensive process that takes days and frequently leads to missed scope items (e.g., waste cleanup, site power, or warranties). If these gaps are missed, general contractors (GCs) pay massive change orders later.

**Kaya SmartProcure (BidLens)** is a full-stack web application designed for estimators and remote project managers. It automates compliance checks, extracts tribal performance sentiment from PM logs, and auto-drafts RFIs to close scope gaps instantly.

---

## ✨ Key Features

*   **🔍 Spec-to-Bid Gap Matrix**: Compares subcontractor proposals against master specification sheets using server-side Gemini AI. It identifies omissions, vagues, or double-billing risks, and estimates potential budget leakage.
*   **🧠 AI Tribal Sentiment Scorecard**: Parses informal journal logs and voice recordings from site engineers, automatically rating vendors on reliability, quality, and pricing honesty.
*   **🎙️ Voice Log Dictation**: Native browser audio recording via the HTML5 MediaRecorder API to dictate field journals on the go.
*   **✉️ Agentic RFI Generator**: Auto-drafts professional Request for Information (RFI) letters addressing specific scope discrepancies. Includes an outbox queue to store drafts when offline.
*   **🌐 Connection Emulation & Offline-First**: Supports a manual connection simulator. If a `GEMINI_API_KEY` is not present or the internet is down, the system seamlessly transitions into a high-fidelity **Local Emulated** mode using preset rule engines to keep field offices running.
*   **🛡️ Secure Server Proxy**: Keeps sensitive Gemini API keys protected server-side, preventing exposure to the client browser.

---

## 🏗️ Architecture

```
              ┌─────────────────────────────────────────┐
              │             React Frontend              │
              │  (Local Storage Cache + Local Fallback) │
              └────────────┬──────────────────────┬─────┘
                           │                      │
                   (Online Connection)    (Offline Connection)
                           │                      │
                           ▼                      ▼
              ┌────────────────────────┐  ┌────────────────┐
              │     Express Server     │  │ Local Client   │
              │   (Vite Middleware)    │  │ State Engine   │
              └────────────┬───────────┘  └───────┬────────┘
                           │                      │
                    (Gemini Proxy)                │
                           ▼                      ▼
              ┌────────────────────────┐  ┌────────────────┐
              │    Gemini API SDK      │  │ Rule-based     │
              │   (gemini-3.5-flash)   │  │ Fallback Logic │
              └────────────────────────┘  └────────────────┘
```

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
*   **Backend**: Node.js + Express (serving as the API Proxy and static server)
*   **AI Integration**: `@google/genai` SDK (`gemini-3.5-flash` primary, `gemini-3.1-flash-lite` fallback)
*   **Audio Processing**: Web Audio APIs & HTML5 MediaRecorder API
*   **Development**: TSX, ESBuild, TypeScript

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)

### Installation

1. Clone the repository and navigate to the directory:
   ```bash
   git clone <repository-url>
   cd kaya-smartprocure
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

3. Configure your API key (Optional):
   Create a `.env.local` or `.env` file in the root directory:
   ```env
   # Set your Gemini API key (If omitted, the app will run in Local Emulated mode)
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

5. Access the app:
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 💡 Local Emulated Mode
When running the application without configuring a `GEMINI_API_KEY` (or during low-connectivity scenarios), the app automatically triggers a high-fidelity **Local Emulated** mode. It uses preset rule-based algorithms to parse common contractor proposals (e.g., Ganga Concrete, Standard Electric, Bharat Security) and provides mock audits, scores, and RFIs to demonstrate the exact workflow.

---

## 💡 Devpost & Hackathon Submission Details

### 🎨 Inspiration
In remote parts of India and low-connectivity construction zones, project estimators spend days manually cross-referencing hundreds of pages of unstructured, handwritten, or scanned subcontractor bids against massive master spec sheets. Minor omissions—like concrete curing procedures, temporary electrical panels, or workmanship warranties—frequently go unnoticed, leading to **change orders** that cause up to **30% budget leakage** once construction begins. 

Additionally, field performance, reliability records, and pricing disputes are rarely documented centrally. They exist solely as "tribal knowledge" in the heads of senior project managers. We built **BidLens** to be a robust, offline-first agentic terminal that acts as a compliance guard, vendor intelligence scorecard, and automated RFI generator for remote site offices.

### 🎯 What it does
*   **Spec-to-Bid Gap Matrix**: Cross-references subcontractor bids against master specs using Gemini AI, flagging omissions, vagues, or deviations, and calculating potential financial leakages.
*   **AI Tribal Sentiment Scorecard**: Analyzes unstructured PM journal notes and transcribed voice recordings to generate 5-star vendor ratings for reliability, quality, and pricing.
*   **Native Voice Dictation**: Leverages standard HTML5 MediaRecorder APIs to allow field engineers to dictate performance logs directly in-browser.
*   **Agentic RFI Creator**: Instantly drafts formal Request for Information (RFI) letters based on the detected scope gaps to clear up discrepancies with subcontractors.
*   **Offline-First & Local Emulated Engine**: Features a manual connection simulator. If connection is lost or the API key is unconfigured, the app falls back to a high-fidelity local engine running on mock preset algorithms, saving drafted RFIs in an outbox queue to sync when online.

### ⚙️ How we built it
*   **Frontend**: Built using React 19, Vite, and TypeScript. Styled with Tailwind CSS for clean layout, Framer Motion for premium micro-animations, and Recharts for vendor score visualization.
*   **Backend**: Node.js and Express backend acting as a secure API gateway proxy to shield API keys. Bundled with ESBuild into a CommonJS production bundle (`server.cjs`).
*   **AI Models**: Integrated Google's `@google/genai` SDK using `gemini-3.5-flash` for high-speed analysis and structured outputs, with automatic fallback configurations to `gemini-3.1-flash-lite`.

### 🚧 Challenges we ran into
*   **Runtime Bundle Mismatches**: Adapting ESM-specific structures (like `import.meta.url`) to behave correctly in serverless CommonJS container builds without causing startup crashes on platforms like Cloud Run.
*   **PDF Parsing at the Edge**: Extracting text from heavy, scanned PDFs without crashing node memory limits or triggering GFE load balancer timeouts. We solved this by creating a hybrid parser that switches dynamically between raw PDF binary OCR and client/server text extractions.
*   **Graceful Degraded States**: Designing a UI that treats lack of connectivity or credentials as a standard operational status ("Local Emulated" with pulsing blue indicators) rather than breaking the user flow with red, alarming errors.

### 🏆 Accomplishments that we're proud of
*   A fully functional, responsive, offline-first application that handles state changes gracefully.
*   A simulated compliance engine stream that mimics the progressive analysis steps of the live API.
*   A clean, professional interface with modern typography and interactive widgets built without heavy external library dependencies.

### 📚 What we learned
*   **State under Connectivity**: Connection state is not a binary switch (online/offline). Designing for low-connectivity means treating state as a spectrum and mapping local storage synchronizations seamlessly.
*   **Strict JSON schemas**: Leveraging Gemini's `responseSchema` is highly effective for getting predictable, parseable data fields directly into React states.

### 🔮 What's next for BidLens
*   **Scanned Handwriting OCR**: Integrating Vision API support to read handwritten vendor logs directly.
*   **Enterprise Integrations**: Syncing outbox RFIs directly to construction management tools like Procore, Autodesk Construction Cloud, or SAP.
*   **Multi-Agent Negotiation**: Developing sub-agents that can automatically send generated RFIs, parse vendor responses, and update the gap matrix autonomously.


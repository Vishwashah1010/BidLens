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

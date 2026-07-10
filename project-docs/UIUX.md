# UI/UX Specifications - Kaya SmartProcure

## 1. Design Concept & Theme
- **Theme**: Swiss Modern meets Clean Industrial. Neutral color palette (warm slate grays, off-whites, amber accents) inspired by modern construction management tools.
- **Visual Grid**: Responsive bento-style cards with clear, bold headers, Inter typography for standard interfaces, and JetBrains Mono for data-heavy audit rows and status lines.
- **Micro-interactions**: Subtle hover state shifts, fade-in transitions using standard Tailwind classes and `motion` components, and pulsing active network states.

## 2. Main Interface Modules
- **Offline Sync Dashboard**: Fixed top-right indicator displaying network status, active cache queue size, and a "Simulate Connection Toggle".
- **Step-by-Step Tab Layout**:
  - **Tab 1: Bid Auditor (Spec-to-Bid Gap Matrix)**: Drag-and-drop uploader alongside the spec comparison grid.
  - **Tab 2: Tribal Memory (PM Journal & Voice)**: PM Voice Memo recorder, informal logger, and 5-star scorecard charts.
  - **Tab 3: Agentic Action (RFI Center & Outbox)**: RFI editor and draft dispatcher.

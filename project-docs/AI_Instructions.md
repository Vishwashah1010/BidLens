# AI Prompting Instructions - Kaya SmartProcure

- **Model Selection**: Prefer `gemini-3.5-flash` for high-speed document auditing and rating extraction.
- **Strict JSON Formats**: Configure `responseSchema` or enforce precise markdown-JSON blocks for structured parsing of scope gaps, RFI text, and sentiment scores.
- **Zero Hallucination Directive**: Ensure only the provided bid details are cross-referenced with the spec sheet.

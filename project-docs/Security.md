# Security Specifications - Kaya SmartProcure

- **No Secrets on Client**: The `GEMINI_API_KEY` is kept exclusively on the server backend (`process.env.GEMINI_API_KEY`).
- **Input Sanitization**: User inputs and raw contractor bids are sanitized before passing to the LLM to prevent injection attacks.
- **Microphone Consent**: Local browser prompts are triggered dynamically for voice note recording, ensuring complete user control.

# Architecture Diagram - Kaya SmartProcure

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

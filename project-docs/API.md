# API Specification - Kaya SmartProcure

## 1. Bid Analysis
- **POST** `/api/analyze-bid`
  - **Body**: `{ bidText: string, specText: string }`
  - **Response**: `{ audit: { scopeGaps: [{ requiredItem: string, status: string, riskLevel: string, comment: string }], computedLeakagePercentage: number, riskScore: number } }`

## 2. Tribal Sentiment Processing
- **POST** `/api/analyze-tribal`
  - **Body**: `{ notes: string }`
  - **Response**: `{ scores: { reliability: number, performance: number, pricing: number }, summary: string }`

## 3. RFI Generation
- **POST** `/api/generate-rfi`
  - **Body**: `{ bidText: string, gapsText: string, subcontractor: string }`
  - **Response**: `{ rfi: { subject: string, body: string } }`

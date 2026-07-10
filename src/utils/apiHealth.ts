export interface GeminiHealthStatus {
  isHealthy: boolean;
  isHighDemand: boolean; // Warning state
  explanation: string;
  queueSize: number;
}

/**
 * Service layer to poll and query Gemini API status from the backend telemetry.
 * Helps prevent users from initiating heavy compliance audits during API downtime.
 */
export async function checkGeminiStatus(): Promise<GeminiHealthStatus> {
  try {
    const res = await fetch("/api/health-check");
    if (!res.ok) {
      throw new Error("HTTP non-ok response from health telemetry endpoint");
    }
    const data = await res.json();
    
    // Under high demand if degraded, active queue size is non-zero, or there are rate limits/errors reported
    const queueSize = data.systemLoads?.queueSize || 0;
    const hasRecentQuotaError = Array.isArray(data.recentEvents) && data.recentEvents.some(
      (e: any) => e.type === "error" && (e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("Quota"))
    );
    
    const isHighDemand = data.status === "degraded" || queueSize > 1 || hasRecentQuotaError;
    
    return {
      isHealthy: data.status === "healthy" || data.status === "degraded",
      isHighDemand,
      explanation: data.explanation || "System is operating normally.",
      queueSize
    };
  } catch (err: any) {
    console.warn("[ApiHealthService] Error querying Gemini API status:", err);
    return {
      isHealthy: false,
      isHighDemand: true,
      explanation: "Gemini compliance engine is under extremely high demand, offline, or rate-limited.",
      queueSize: 0
    };
  }
}

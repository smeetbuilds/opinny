import { appConfig } from "@/lib/config";

type ErrorContext = Record<string, string | number | boolean | null | undefined>;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      digest: "digest" in error && typeof error.digest === "string" ? error.digest : undefined
    };
  }
  return { name: "UnknownError", message: String(error) };
}

export function captureException(error: unknown, context: ErrorContext = {}) {
  console.error(error);
  if (typeof window === "undefined") return;

  const payload = {
    error: normalizeError(error),
    context,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  window.dispatchEvent(new CustomEvent("opinny:error", { detail: payload }));

  if (!appConfig.errorReportUrl) return;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(appConfig.errorReportUrl, new Blob([body], { type: "application/json" }));
      if (sent) return;
    }
    void fetch(appConfig.errorReportUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      signal: AbortSignal.timeout(5000)
    }).catch(() => undefined);
  } catch {
    // Error reporting must never make the product flow fail a second time.
  }
}

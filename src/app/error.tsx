"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import { Logo } from "@/components/logo";
import { captureException } from "@/lib/observability";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { captureException(error, { operation: "appErrorBoundary", digest: error.digest }); }, [error]);
  return <main className="error-page"><Logo /><span className="error-code">Error</span><h1>Something interrupted the market view.</h1><p>Retry the request. No wallet transaction has been submitted from this screen.</p><button className="primary-button" onClick={reset}><RefreshCcw size={16} />Try again</button></main>;
}

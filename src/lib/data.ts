import type { OpinnyIntegrationAdapter } from "@/core/contracts/ports";
import { mockAdapter } from "@/adapters/mock";

// Replace this with a runtime adapter factory when integrating REST, GraphQL,
// WebSocket, RPC, or another transport. UI components must not depend on
// provider-specific payloads.
export const dataAdapter: OpinnyIntegrationAdapter = mockAdapter;

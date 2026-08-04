import type { OpinnyIntegrationAdapter } from "@/core/contracts/ports";
import { mockAdapter } from "@/adapters/mock";
import { appConfig } from "@/lib/config";

const adapters = {
  mock: mockAdapter
} satisfies Record<string, OpinnyIntegrationAdapter>;

export function createOpinnyAdapter(name = appConfig.adapter): OpinnyIntegrationAdapter {
  return adapters[name as keyof typeof adapters] ?? mockAdapter;
}

// UI code consumes only the integration contract. Integrators can replace the
// registry entry with REST, GraphQL, RPC, WebSocket, serverless, or any other
// backend implementation without changing product components.
export const dataAdapter = createOpinnyAdapter();

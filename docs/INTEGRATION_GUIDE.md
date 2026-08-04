# Backend integration guide

Opinny is deliberately backend agnostic. The frontend can be connected to Node.js, Go, Rust, Java, Python, PHP, .NET, serverless functions, blockchain indexers, smart contracts or mixed architectures as long as the integration normalizes data into the contracts under `src/core/contracts`.

Developed by Aahav Labs: https://aahavlabs.in · hi@aahavlabs.in

## Integration boundary

The frontend recognizes five responsibility groups:

1. **Market data** — lists, detail, order book and recent trades.
2. **Account data** — positions, orders, activity and leaderboard.
3. **Admin data** — metrics, users, resolution queue and transactions.
4. **Commands** — order preview/preparation, funding preparation and admin mutations.
5. **Real time** — normalized market events and sequence numbers.

These are defined in `src/core/contracts/ports.ts` and combined by `OpinnyIntegrationAdapter`.

## Implement an adapter

Create a directory such as:

```text
src/adapters/production/
  client.ts
  mappers.ts
  index.ts
```

Your adapter should map external payloads into Opinny domain models:

```ts
import type { OpinnyIntegrationAdapter } from "@/core/contracts/ports";

export const productionAdapter: OpinnyIntegrationAdapter = {
  async listMarkets(query) {
    const response = await fetch("/your-api/markets");
    const payload = await response.json();
    return payload.items.map(mapMarket);
  },
  // Implement every contract method.
};
```

Register the adapter in `src/lib/data.ts` and select it with `NEXT_PUBLIC_OPINNY_DATA_ADAPTER`.

## REST, GraphQL and non-JavaScript backends

The frontend does not care which language or database serves the data. Keep transport-specific concerns inside the adapter:

- REST response envelopes
- GraphQL fragments and generated types
- gRPC gateway models
- RPC requests and chain-specific values
- pagination tokens
- authentication headers
- database identifiers
- timestamp and decimal conversions

UI components should receive only the normalized types from `domain.ts`.

## Authentication and authorization

The reference repository does not implement authentication. A production integration should provide:

- wallet challenge/signature verification or another approved login method;
- secure sessions using server-managed, HttpOnly cookies where appropriate;
- authorization checks for every account and admin command;
- CSRF protection when cookie-authenticated commands are used;
- role and permission enforcement server-side;
- session expiry, revocation and device/account controls.

Never trust frontend admin visibility as authorization.

## Crypto funding

Funding is crypto only. `FundingIntent` includes action type, asset, amount, chain ID and optional destination. The backend or smart-contract integration must:

- validate supported assets and networks;
- return a wallet transaction request or deposit instruction;
- enforce balances, limits, allowlists and compliance policy;
- index confirmations and failure states;
- prevent replay and duplicate submission;
- never request or transmit private keys or recovery phrases.

Do not add fiat payment gateways to the core product.

## Trading

`previewOrder` is a non-authoritative estimate for user review. `prepareOrder` returns a short-lived request and optional wallet transaction. Production implementations must handle:

- authoritative price, size, fee and slippage calculations;
- idempotency through `clientRequestId`;
- market status and eligibility checks;
- signature or authorization preparation;
- matching, cancellation, settlement and reconciliation;
- stale quote and expiry handling;
- real-time order and fill updates.

## Real-time data

`subscribeToMarket` returns an unsubscribe function and emits normalized events with sequence numbers. WebSocket, SSE, RPC subscriptions or polling can implement this port. Production adapters should handle reconnect, backoff, resynchronization and out-of-order events.

## Administration

Admin components call adapter commands, but all security and business rules must be server-side. Protect market creation, user status changes, resolution approvals, exports and settings with auditable authorization.

## Static export considerations

The reference app statically exports mock routes. A production deployment that needs request-time authentication, personalized server rendering or protected admin routes can remove `output: "export"` and use a compatible Next.js runtime deployment. The adapter contracts do not change.

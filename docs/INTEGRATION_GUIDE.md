# Backend integration guide

Opinny is deliberately backend agnostic. The frontend can be connected to Node.js, Go, Rust, Java, Python, PHP, .NET, serverless functions, blockchain indexers, smart contracts or mixed architectures as long as the integration normalizes data into the contracts under `src/core/contracts`.

Developed by Aahav Labs: https://aahavlabs.in · hi@aahavlabs.in

## Integration boundary

The frontend recognizes seven responsibility groups:

1. **Market data** — lists, detail, order book and recent trades.
2. **Discussion data and commands** — comments, replies and reactions.
3. **Rewards data** — liquidity-incentive opportunities, qualification states and account earnings presentation.
4. **Account data** — positions, orders, activity and leaderboard.
5. **Admin data** — metrics, users, resolution queue and transactions.
6. **Commands** — order preview/preparation/cancellation, funding preparation, redemption and admin mutations.
7. **Real time** — normalized market events and sequence numbers.

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

## Trading and account orders

`previewOrder` is a non-authoritative estimate for user review. `prepareOrder` returns a short-lived request and optional wallet transaction. `getOrders` supplies normalized account order state used by both the account history and market-context open-order panel. `cancelOrder` prepares or submits a cancellation through the integration boundary.

Production implementations must handle:

- authoritative price, size, fee and slippage calculations;
- idempotency through `clientRequestId`;
- market status and eligibility checks;
- signature or authorization preparation;
- matching, cancellation, settlement and reconciliation;
- partial fills and remaining-order quantities;
- stale quote and expiry handling;
- real-time order and fill updates.

## Rewards and liquidity incentives

`getRewardOpportunities` returns normalized `RewardOpportunity` records for the public rewards surface. The frontend can display programme rules, competition, eligibility and account earnings, but those values are never authoritative browser calculations.

A production integration is responsible for:

- selecting which markets participate in incentive programmes;
- maximum-spread and minimum-size rules;
- maker/order eligibility snapshots;
- competition or scoring calculations;
- account earnings and accrual state;
- exclusions, anti-abuse rules and programme windows;
- final reward settlement and transaction indexing.

The UI should continue to work even when an operator does not support rewards: return an empty array and Opinny will render the corresponding empty state.

## Discussion

Discussion reads and commands are normalized independently from market data. Production implementations should handle identity, persistence, moderation, rate limits, abuse controls and authorization outside the browser.

## Real-time data

`subscribeToMarket` returns an unsubscribe function and emits normalized events with sequence numbers. WebSocket, SSE, RPC subscriptions or polling can implement this port. Production adapters should handle reconnect, backoff, resynchronization and out-of-order events.

## Administration

Admin components call adapter commands, but all security and business rules must be server-side. Protect market creation, user status changes, resolution approvals, exports and settings with auditable authorization.

## Static export considerations

The reference app statically exports mock routes. A production deployment that needs request-time authentication, personalized server rendering or protected admin routes can remove `output: "export"` and use a compatible Next.js runtime deployment. The adapter contracts do not change.

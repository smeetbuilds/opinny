# Backend integration guide

Opinny intentionally separates UI from transport and persistence.

## 1. Implement the adapter

Create an object implementing `OpinnyIntegrationAdapter` from `src/core/contracts/ports.ts`. Your implementation may call REST, GraphQL, gRPC-web, tRPC, WebSocket, blockchain RPC, an indexer, server actions, or any combination of services.

Implement read ports, command ports, and the real-time subscription port. Normalize provider responses into the domain models in `src/core/contracts/domain.ts`. Never expose raw backend response shapes to components.

## 2. Replace the adapter factory

Update `src/lib/data.ts` to select your adapter using configuration or dependency injection. A production system will usually keep public market data and authenticated account data in separate clients while composing both behind the same port.

## 3. Authoritative state

The frontend must treat balances, fills, prices, permissions, identity status, resolution, signatures and transaction status as authoritative only when returned by trusted backend or onchain systems. Mock calculations exist only to demonstrate interface states.

## 4. Real-time data

Map WebSocket or streaming events into normalized updates for:

- order-book snapshots and deltas
- best bid/ask and last trade
- market status and resolution
- user orders and fills
- funding and settlement transactions
- notifications

Use sequence numbers or hashes supplied by the backend to detect stale or missing messages.

## 5. Authentication and wallet signing

Wallet connection UI is deliberately provider-neutral. Integrators should supply their preferred wallet library and keep message construction, nonce issuance, session establishment and authorization checks outside presentational components.

## 6. Admin authorization

The `/admin` routes are frontend screens, not a security boundary. Enforce roles and permissions on every backend operation and protect admin routes at the deployment layer.

## 7. Command separation

`previewOrder` may provide an indicative UI preview, but the backend remains authoritative. `prepareOrder` and `prepareFunding` return wallet transaction requests without signing them. Cancellation, market creation, user status changes, and resolution commands must be authorized and validated outside the browser.

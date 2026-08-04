# Opinny

Opinny is an open-source, backend-agnostic prediction-market frontend built with Next.js and Bun. It includes a complete public trading interface and an administration interface, with realistic mock data and explicit integration contracts so teams can connect any backend, database, blockchain indexer, order-matching service, or smart-contract stack.

Developed by **Aahav Labs**.

- Website: https://aahavlabs.in
- Contact: hi@aahavlabs.in

## Included product surfaces

- Market discovery, categories, search, watchlists and leaderboards
- Binary and multi-outcome market presentation
- Price history, probability states, order book and recent trade activity
- Buy/sell ticket with market and limit-order states
- Wallet connection, crypto funding and withdrawal interface states
- Portfolio, open positions, orders, history, activity and profile pages
- Notifications, user preferences and connected-wallet management
- Responsive desktop, tablet and mobile navigation
- Admin overview, users, markets, resolution queue, transactions and platform settings
- Modal, drawer, command search, tabs, tooltips, toast and mobile bottom-sheet patterns
- Mock integration adapter plus typed read, command and real-time ports for REST, GraphQL, WebSocket, RPC or custom integrations

## Architecture

```text
src/
  app/                 Next.js App Router screens
  components/          Product and admin UI components
  core/contracts/      Backend-neutral domain types and adapter ports
  adapters/mock/       In-memory implementation for demo and development
  lib/                 Formatting, configuration and shared helpers
```

UI components consume typed domain models rather than transport responses. Read models, order/funding commands, admin mutations, and real-time subscriptions are represented as separate ports. Replace the mock adapter with your own implementation while preserving the contracts in `src/core/contracts`.

## Getting started

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

Run the full quality gate with `bun run check` (ESLint, TypeScript, Bun tests and production build).

## Production integration checklist

The demo deliberately does not implement custody, wallet signing, authentication, authorization, matching, settlement, market resolution, KYC/KYB, geofencing, sanctions controls, rate limits, fraud controls, or authoritative financial calculations. Integrators must implement these server-side or onchain and return normalized data through an adapter.

## Environment

Copy `.env.example` to `.env.local` and configure the selected adapter, HTTP endpoint, WebSocket endpoint, chain ID and collateral token.

## License

MIT. Copyright 2026 Aahav Labs.

# Opinny

Opinny is an **open-source, frontend-only, backend-agnostic crypto prediction-market platform interface** built with Next.js and Bun. It provides the public, account and administration experiences expected from modern event-market products while deliberately leaving custody, authentication, order matching, settlement, market resolution and persistence to the integration selected by the adopter.

Developed and maintained by **Aahav Labs**.

- Website: https://aahavlabs.in
- Contact: hi@aahavlabs.in
- License: MIT

## Product principles

- **Frontend only:** no bundled application server, database, custody service or authoritative financial engine.
- **Backend agnostic:** connect REST, GraphQL, gRPC gateways, serverless functions, RPC, WebSocket, smart-contract indexers or any other stack through typed adapter ports.
- **Crypto only:** wallet connection, deposits, withdrawals and trading flows are designed for supported crypto assets. No card, bank, PayPal, Stripe or other fiat gateway is included.
- **Platform presentation:** the application UI is branded only as Opinny. Open-source and Aahav Labs attribution is kept in repository documentation and metadata rather than the public product interface.
- **Independent design:** the product follows proven prediction-market interaction patterns without copying another platform’s branding, assets or proprietary implementation.
- **Light mode:** a distinctive warm-neutral, forest and coral colour system with no dark-mode dependency.
- **Typography:** Instrument Serif for display/editorial hierarchy and Inter for UI, body and market data.
- **Responsive by default:** desktop, laptop, tablet and mobile layouts use tables, cards, drawers, bottom sheets, modals and sticky actions appropriate to each viewport.
- **Stable release baseline:** production dependencies stay on supported stable release channels rather than preview/canary builds.

## Included product surfaces

### Public market experience

- Homepage with featured, trending and live-market discovery
- Category navigation, search command palette, filtering and sorting by activity, volume, liquidity, newest and ending soon
- Binary and multi-outcome markets
- Watchlists and saved-market state
- Market detail with probability history, ranges and hover inspection
- Outcome probabilities, daily movement, volume, liquidity and participation
- Order book, spread, best bid/ask and recent trades with a realtime adapter boundary
- Market-context open orders with fill progress and cancellation
- Resolution rules, source, discussion and related markets
- Searchable rewards/liquidity-incentive opportunities with programme rules and competition states
- Leaderboard and statically generated trader profiles
- Notification centre, help centre and platform policy surfaces

### Trading and crypto account experience

- Wallet-selection modal for browser wallets, WalletConnect, Coinbase Wallet and Safe presentation states
- Crypto-only deposit and withdrawal bottom-sheet/dialog flows
- Network, asset, amount and withdrawal-address validation
- Adapter-backed funding request preparation
- Buy and sell ticket with market and limit orders
- Estimated shares, collateral, fees, payout, profit and price impact
- Mobile trading bottom sheet and outcome-to-ticket deep interaction
- Portfolio, positions, order history, activity and claimable states
- Open-order cancellation from both market context and account history
- Rewards earnings presentation supplied through a normalized adapter contract
- User-controlled trading, notification and slippage preferences
- Persistent browser watchlist and preference states

### Administration experience

- Operational overview and attention queues
- Market search, filters, sort, create and moderation states
- User search, risk filters, CSV export and status transitions
- Resolution evidence review, disputes and adapter-backed approval
- Transaction explorer, status filters, copy and CSV export
- Integration, chain, collateral, compliance, notifications and market defaults
- Responsive data tables that become labelled mobile cards
- Mobile admin drawer, modal and evidence side-panel patterns

## Architecture

```text
src/
  app/                     Next.js App Router screens
  components/              Product, account and admin UI modules
  core/contracts/          Backend-neutral domain models and ports
  adapters/mock/           In-memory reference implementation
  lib/config.ts            Environment-driven platform configuration
  lib/data.ts              Adapter registry and active adapter selection
  app/styles/              Layered light-mode design system

docs/
  PRODUCT_REQUIREMENTS.md  Product scope and requirement matrix
  INTEGRATION_GUIDE.md     How to connect any backend or chain stack
```

UI components consume normalized domain models and command results, never provider-specific payloads. Market reads, reward opportunities, account reads, order commands, funding commands, discussion actions, admin commands and real-time subscriptions are separate interfaces in `src/core/contracts/ports.ts`.

## Getting started

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

Quality commands:

```bash
bun run lint
bun run typecheck
bun test
bun run build
bun run check
```

## Environment

Copy `.env.example` to `.env.local`.

```env
NEXT_PUBLIC_OPINNY_DATA_ADAPTER=mock
NEXT_PUBLIC_OPINNY_API_URL=
NEXT_PUBLIC_OPINNY_WS_URL=
NEXT_PUBLIC_OPINNY_CHAIN_ID=137
NEXT_PUBLIC_OPINNY_CHAIN_NAME=Polygon
NEXT_PUBLIC_OPINNY_BLOCK_EXPLORER_URL=https://polygonscan.com
NEXT_PUBLIC_OPINNY_COLLATERAL_SYMBOL=USDC
NEXT_PUBLIC_OPINNY_SUPPORTED_ASSETS=USDC,USDT,DAI
NEXT_PUBLIC_OPINNY_ADMIN_PATH=/admin
```

The repository includes only the `mock` adapter. Add a production adapter to the registry in `src/lib/data.ts` after implementing the interfaces in `src/core/contracts/ports.ts`.

## Frontend-only boundary

Opinny intentionally does **not** implement or claim to implement:

- wallet custody or private-key management
- identity, authentication, authorization or session security
- card, bank or other fiat payment processing
- order matching, authoritative pricing or settlement
- smart contracts or blockchain indexing
- market creation governance or authoritative resolution
- reward scoring, accrual or payout settlement
- sanctions, KYC/KYB, geofencing, fraud controls or rate limits
- authoritative balances, P&L, fees or tax calculations
- persistent user, market, transaction, discussion or notification storage

Production adopters must provide those capabilities server-side and/or onchain and return normalized data through an adapter. See `docs/INTEGRATION_GUIDE.md`.

## Deployment

The reference deployment uses `output: "export"` and publishes the generated `out` directory. All mock dynamic routes are pre-rendered with `generateStaticParams()`.

## Contributing and security

Read `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` and `docs/PRODUCT_REQUIREMENTS.md` before submitting changes.

## License

MIT License. Copyright 2026 Aahav Labs.

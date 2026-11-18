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

The repository includes only the `mock` adapter. Its account state is saved in the browser as a **paper trading simulation**. Add a production adapter to the registry in `src/lib/data.ts` after implementing the interfaces in `src/core/contracts/ports.ts`.

## Paper trading walkthrough

The reference adapter supports a connected, browser-only practice workflow without a database, real funds or a matching service:

1. Select **Start trading → Paper wallet**. Every provider choice is explicitly simulated in the reference build.
2. Open any active market. Select a binary or multi-outcome contract, then buy with simulated USDC or sell shares you own.
3. A market order fills immediately at the reference quote and updates available USDC, positions, activity and order history. A limit order crossing that quote fills; a resting order reserves collateral or shares.
4. Open **Orders** or the market's **Your open orders** section. Select **Match 50%** to simulate a counterparty taking a resting order. The next match finishes it. You can instead cancel the unfilled remainder and free reserved collateral.
5. Open **Portfolio** to inspect marked-to-reference prices and unrealized P&L. Redeem an eligible winning position to credit its paper proceeds.
6. Open **Deposit crypto** or **Withdraw** to simulate approved funding. Supported mock assets and network are validated; no blockchain operation is broadcast.
7. Post a market comment, reply, mark a comment useful, bookmark markets, change preferences and use the notification centre. Paper account and discussion activity survive reloads on this device.
8. Open the **Admin** area to create local market drafts, pause or reopen reference markets, change mock user review status, approve sample resolution cases and inspect trade/funding records. Drafts intentionally do not have public trading routes until production publishing exists.
9. Use **Settings → Reset paper account** to return trades, positions, orders, funding and comments to reference fixtures while preserving preferences and the watchlist.

All order fills, prices, portfolio valuations, synthetic order-book liquidity, USDC movements and payout amounts are **illustrative local simulation**. The manual match control is a testing affordance, not a real exchange or liquidity source. No user data is synchronized across browsers/devices. Clearing site storage resets paper state. There is no real on-chain wallet connection, custody, financial execution or live market feed in the reference adapter.

## Frontend-only boundary

Opinny intentionally does **not** implement or claim to implement:

- wallet custody or private-key management
- identity, authentication, authorization or session security
- card, bank or other fiat payment processing
- production order matching, authoritative pricing or settlement (paper fills are immediate or manually simulated)
- smart contracts or blockchain indexing
- market creation governance or authoritative resolution
- reward scoring, accrual or payout settlement
- sanctions, KYC/KYB, geofencing, fraud controls or rate limits
- authoritative balances, P&L, fees or tax calculations (the reference engine computes illustrative local values)
- server-side persistent user, market, transaction, discussion or notification storage (paper activity is stored in this browser only)

Production adopters must provide those capabilities server-side and/or onchain and return normalized data through an adapter. See `docs/INTEGRATION_GUIDE.md`.

## Deployment

The reference deployment uses `output: "export"` and publishes the generated `out` directory. All mock dynamic routes are pre-rendered with `generateStaticParams()`.

## Contributing and security

Read `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` and `docs/PRODUCT_REQUIREMENTS.md` before submitting changes.

## License

MIT License. Copyright 2026 Aahav Labs.

# Project status

## Reference frontend complete

- [x] Next.js App Router and Bun project structure
- [x] Backend-neutral read, command, funding, admin and real-time contracts with a mock adapter
- [x] Discovery homepage and category market browsing
- [x] Command search, navigation drawer and mobile bottom navigation
- [x] Binary and multi-outcome market cards
- [x] Market detail, probability chart, order book, recent trades, rules and adapter-backed discussion
- [x] Buy/sell market and limit ticket states with adapter-supplied previews
- [x] Reference wallet session plus crypto deposit and withdrawal request states
- [x] Client-loaded account balances, portfolio, orders and activity compatible with the static reference deployment
- [x] Watchlist, leaderboard, profile and functional account preferences
- [x] Admin overview, markets, users, resolutions, transactions and truthful deployment/reference settings
- [x] Responsive desktop, tablet, mobile and compact-mobile styling
- [x] Error, not-found and loading states
- [x] Open-source repository documentation and GitHub CI configuration

## Paper-exchange enhancement — November 2026

- [x] Browser-persisted reference wallet account; explicit paper-mode disclosures
- [x] Market and limit order simulation with balance checks, fee estimates, cross/posted behavior and idempotent order submission
- [x] Held collateral for unmatched buys; reserved shares for unmatched sells; cancellation releases available amounts
- [x] Manual counterparty test action for partial then full fills
- [x] Market-specific synthetic order depth, per-market paper trades and immediate feed refresh
- [x] Account event synchronization for portfolio, order history, local balances and activity
- [x] Paper deposits and withdrawals, validation, idempotence and winning redemption credits
- [x] Persistent local discussion posts, replies, useful reactions, bookmarks and notifications
- [x] Admin market pause/reopen, private drafts, user review status and mock resolution approvals saved on device
- [x] Simulated transaction explorer reflecting trades, deposits and withdrawals
- [x] Paper-account reset with confirmation; touch/focus/reduced-motion and information-density refinements
- [x] Reference exchange behavior covered by tests

**Scope:** This is a coherent local paper simulator, not an authoritative live prediction exchange. It deliberately has no real-money execution, exchange matching, login service, blockchain settlement or multi-device state.

## Production integration work intentionally not included

- [ ] Authentication, sessions and admin authorization
- [ ] Production wallet provider library and real signatures
- [ ] REST/GraphQL/WebSocket/RPC adapter implementation
- [ ] Order matching, custody, settlement and smart-contract execution
- [ ] KYC/KYB, geofencing, sanctions and risk systems
- [ ] Authoritative market creation and resolution operations
- [ ] Production analytics and notification delivery
- [ ] Configure `NEXT_PUBLIC_OPINNY_ERROR_REPORT_URL` for the chosen production observability intake
- [ ] Configure `NEXT_PUBLIC_OPINNY_SITE_URL` with the canonical production origin for sitemap URLs

The exact next production integration item is to register a real adapter in `src/lib/data.ts` and a matching wallet implementation in `src/lib/wallet.ts`. Unknown adapter names fail closed and never fall back to mock data.

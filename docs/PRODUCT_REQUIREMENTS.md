# Opinny product requirements

Opinny is an open-source, frontend-only prediction-market platform interface developed by Aahav Labs. This document is the authoritative product-scope checklist for repository changes.

Aahav Labs: https://aahavlabs.in · hi@aahavlabs.in

## Non-negotiable requirements

1. The public application must present only the Opinny platform brand. Do not add contributor, agency, open-source or repository attribution to the frontend UI.
2. Repository documentation and GitHub metadata must identify Opinny as open source and developed by Aahav Labs.
3. The application must remain frontend only. No bundled database, custody layer, authentication server, matching engine or settlement service.
4. All product data and commands must pass through backend-neutral contracts. Components must never depend on provider-specific transport payloads.
5. Funding and withdrawal experiences must be crypto only. Do not add card, bank, PayPal, Stripe or fiat gateway flows.
6. The design system must remain light mode, minimalist, responsive and independently branded.
7. Every important action needs a complete UI state: idle, loading, empty, validation, success and failure where applicable.
8. Desktop, laptop, tablet and mobile layouts must be explicitly supported.
9. Production dependencies must use stable supported release channels. Preview, canary, beta and release-candidate packages are not the production baseline unless explicitly approved for an experiment.
10. Instrument Serif is the display/editorial typeface and Inter is the UI, body and data typeface. Monospace is reserved for technical identifiers.

## Capability matrix

| Area | Frontend requirement | Repository status | Production integration responsibility |
|---|---|---|---|
| Market discovery | Featured, trending, category deep-links, search, sort, filters | Implemented | Supply authoritative market data |
| Binary markets | Yes/no probability and trading states | Implemented | Token/outcome mapping and pricing |
| Multi-outcome markets | Multiple outcome cards, depth selection and ticket selection | Implemented | Outcome identifiers and order routing |
| Market chart | Ranges, probability series and hover inspection | Implemented | Historical and real-time series |
| Order book | Bids, asks, spread, depth and realtime refresh boundary | Implemented | Matching-engine or exchange data |
| Recent trades | Side, outcome, shares, price, value and realtime refresh boundary | Implemented | Indexed trade stream |
| Discussion | Read, post, reply intent and useful reactions | Implemented | Persistent comments, moderation and identity |
| Market/limit orders | Input, preview, validation and wallet request | Implemented | Preview, authorization, matching and settlement |
| Portfolio | Balances, positions, P&L and claimable states | Implemented | Authoritative account calculations |
| Orders | Search, filters, sorting, fill progress and cancellation | Implemented | Order lifecycle and cancellation |
| Activity | Trade, funding, reward and resolution timeline | Implemented | Persistent account event feed |
| Watchlist | Save/remove and browser persistence | Implemented | Optional account synchronization |
| Wallet connection | Provider selection and connected state | Implemented presentation | Wallet SDK/session integration |
| Crypto funding | Asset/network validation and prepared wallet request | Implemented | Deposit addresses/contracts and confirmations |
| Crypto withdrawal | Destination/amount validation and prepared request | Implemented | Authorization, limits and settlement |
| Notifications | Drawer, unread/read and preferences | Implemented | Persistent delivery and push/email channels |
| Leaderboard/profile | Ranking, following, sharing and profile surfaces | Implemented | Aggregated trader statistics |
| Admin overview | Metrics and attention queues | Implemented | Operational telemetry |
| Admin markets | Create and moderation workflows | Implemented | Authorization and market persistence |
| Admin users | Risk and status operations | Implemented | Identity, policy and access control |
| Admin resolutions | Evidence, disputes and approval | Implemented | Governance and authoritative settlement |
| Admin transactions | Search, filters, copy and export | Implemented | Blockchain/payment indexing |
| Admin settings | Integration, network, policy and defaults | Implemented | Secure server-side configuration |
| Help/legal/risk | Platform information surfaces | Implemented | Operator legal review and jurisdictional customization |

## Responsive requirements

### Desktop and large laptop

- Persistent primary navigation and account controls
- Multi-column market grids and sidebars
- Sticky trading ticket on market detail
- Full operational tables in admin
- Popover notification centre

### Tablet and compact laptop

- Collapsed navigation with drawer
- Trading ticket converted to bottom sheet
- Two-column market and summary layouts where space permits
- Admin sidebar converted to drawer
- Tables may remain scrollable or convert to cards based on density

### Mobile

- Bottom navigation for primary account/product routes
- Full-width market cards and stacked outcomes
- Safe-area-aware bottom sheets
- Labelled card representation for dense tables
- Full-width modal actions and touch targets
- No horizontal page overflow

## Architecture rules

- `src/core/contracts/domain.ts` owns normalized product models.
- `src/core/contracts/ports.ts` owns read, command, discussion and real-time boundaries.
- `src/lib/data.ts` selects an adapter; components import only the selected adapter or normalized props.
- Provider SDKs and transport models belong in an adapter directory, not in UI components.
- Every production command must be treated as a preparation step until the connected wallet/backend confirms execution.
- The mock adapter must remain deterministic enough for static export and visual testing.

## Visual rules

- Light mode only unless the product requirements are intentionally revised.
- Use Opinny’s warm neutral, forest and coral palette; do not copy another platform’s colour identity.
- Use Instrument Serif for display/editorial typography and Inter for interface, body and market-data typography.
- Maintain clear probability hierarchy, dense but readable market data, restrained motion and accessible focus states.
- Prefer drawers, bottom sheets and modals for contextual tasks rather than navigating away unnecessarily.
- Respect reduced-motion settings and keyboard dismissal for overlays.

## Definition of done

A change is complete only when:

- it preserves the frontend-only and crypto-only boundaries;
- it works with the mock adapter and does not hard-code provider payloads;
- loading, error, empty and responsive states are considered;
- keyboard and screen-reader semantics are reasonable;
- dependency versions are from stable supported channels;
- `bun run lint`, `bun run typecheck`, `bun test` and `bun run build` pass;
- repository attribution rules are respected.

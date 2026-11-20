# Opinny paper simulator — acceptance and device QA

This is the verification plan for the **browser-local, simulated** prediction exchange.
It is not a real-money, wallet-custody, order-matching or oracle-settlement specification.

## Automated gate

`bun run check` runs ESLint, TypeScript, Bun unit tests, and Next.js production build.
The existing GitHub Actions job executes exactly that command after a push to `main`.
Do not introduce an additional workflow or paid testing service.

Core tests in `src/adapters/mock/simulator.test.ts` and
`src/adapters/mock/market-data.test.ts` exercise:

- Paper market and limit orders, finite book depth and slippage bounds
- Buy-side fees, limit price improvement, ledger reconciliation and collateral reserve/release
- Sell-side share reservation, oversell prevention and cancellation
- Idempotent order/funding requests and rejection of conflicting order IDs
- Partial then full simulated counterparty fills
- Market pause, publish, resolution, winning claim and double-claim prevention
- The create → publish → buy → resolve → redeem journey
- Bundled market-to-resolution case linkage and resolved-book closure
- Multi-outcome probability normalization and market fixture integrity

**Limitation:** CI and a successful Vercel build do not constitute screenshot-based
visual QA, real assistive-technology QA, or tested browser performance budgets.

## Acceptance flows — manual browser walkthrough

| Flow | Action | Expected result |
| --- | --- | --- |
| Start a paper session | Click **Start trading**, choose **Paper wallet** | Account shows simulated balances; no real wallet is needed or contacted |
| Buy at market | Open an active market and buy a small amount | Estimated price, fees and shares precede confirmation; available cash decreases, position grows, consumed ask depth shrinks |
| Limit buy | Enter a price below the best ask | Order posts; collateral is reserved, not charged twice; cancellation restores the unused reserve |
| Price improvement | Enter a buy limit above the best ask | Price paid is the actual matched quote, not the maximum limit; any unused collateral remains available |
| Sell | Sell some owned shares; then attempt to sell more than unreserved holdings | Valid sale credits simulated proceeds net of fees; overselling is rejected |
| Partial fills | Post an unmatched limit and use **Simulate match** in open orders | Filled fraction, reserved collateral/shares and activity all update; a second match completes the remainder |
| Market discovery | Create a market in admin and leave it as a draft | It is not exposed in public discovery or global search |
| Publish local market | Publish that draft, search for it and open it | Market is visible and opens through the client-only paper market route |
| Resolve | In admin resolutions, choose the local market's winning outcome and approve | Open orders are cancelled, book closes, final probability becomes 100% or 0%, positions become resolved |
| Redeem | Claim a winning position twice | The first claim credits simulated collateral, the second is refused |
| Discussions | Post a comment or reply and revisit discovery | Local discussion persists and the market comment count reflects it |
| Persistence | Refresh, open a second same-origin tab, then use **Reset paper account** | Local state persists on that browser until reset; account changes refresh in other tabs |
| Failure paths | Try a zero amount, invalid limit, insufficient cash, invalid withdrawal address and extreme slippage | Errors are actionable and do not change paper balances or positions |

## Device and interaction matrix

**Minimum viewport review:** 320×640, 375×812, 390×844, 430×932,
768×1024, 1024×768, 1280×800, 1440×900 and 1920×1080.
Test both touch and keyboard where possible, including a mobile device with
a visible software keyboard and bottom safe-area inset.

On each viewport verify discovery cards, market detail, outcome controls,
price chart, trading sheet, order book, recent trades, open-order controls,
portfolio tables, wallet sheet, admin panels and resolution selection.
Check no horizontal page overflow, clipped chart labels, unreachable actions,
overlapping sticky bars, hidden errors or obstructed primary buttons.

**Keyboard:** Test skip-to-content, `Cmd/Ctrl+K` search, result navigation,
`Tab` and `Shift+Tab` inside dialogs, `Escape` dismissal, focus return
to the opening trigger, and chart `←`/`→`/`Home`/`End`.
Test 200% zoom, reduced-motion preference, meaningful labels in a screen
reader, and usable contrast at each primary interaction.

**Performance:** Evaluate mobile initial render, interaction latency while
filling multiple orders, layout shift after balance/chart updates, local-storage
limits and large transaction histories. Measure with browser profiling before
assigning an LCP, CLS or INP pass/fail verdict.

## Known boundaries

- All prices, historical trades, users, funding and settlement are simulations.
- State is persisted to the current browser's local storage, not to an account backend.
- There is no authoritative cross-device synchronization or exchange matching service.
- Admin operations have no production authorization boundary.
- Asset/network validation is an interface simulation; there are no blockchain transactions.
- UI/device/screen-reader checks above are **manual acceptance cases**, not claims
  that they were executed by the automated CI gate.

For deployment-specific configuration and eventual production integrations, see
`docs/INTEGRATION_GUIDE.md` and `docs/PRODUCT_REQUIREMENTS.md`.

## Design acceptance — editorial market interface

Design-focused inspection should cover the November 2026 implementation of the market-detail outcome board, sequential-sample chart, order ticket, order book, trade tape, homepage and discovery cards.

| Surface | Test | Pass criterion |
| --- | --- | --- |
| Market detail | 320px portrait and 1440px desktop | Question remains fully readable; outcome prices and Trade actions do not clip |
| Contract board | Two and four outcome markets | One clear row per outcome, a meaningful number, label, probability bar and operable action |
| Sample chart | Recent 6 / All, keyboard navigation and touch | Chart never suggests unsupported calendar-time history; focus and selected sample remain accessible |
| Order ticket | Side/outcome/type changes, market/limit previews | Available simulated balance, estimate, fee and CTA read in order without decorative cards |
| Market depth | Open, partially consumed and resolved books | Bid/ask headers, data, spread and no-depth states are legible and truthful |
| Homepage | Small phone, tablet and laptop | A single featured contract replaces floating card stacks, with no irrelevant ornament |
| Discovery | Category filters, bookmarked and resolved markets | Flat market cards keep title, odds and links visible; no pastel emoji thumbnails |
| Interaction | 200% zoom, reduced motion, keyboard, screen reader | Accessible focus, names and status, no hidden trade actions |

**QA scope:** the existing lint/type/test/build checks verify code integrity. They do not replace manual screenshot comparison or assistive-technology testing.

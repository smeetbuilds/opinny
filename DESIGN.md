# Opinny — Design Language

**Reference:** User-provided `Miro-design-analysis` (visual-system inspiration).  
**Status:** Applied to the Opinny paper-market interface in November 2026.  
**Ownership:** Original Opinny branding and product UI; no borrowed Miro assets or wordmark.

This file is the implementation-facing `DESIGN.md`. For the detailed precedent
and project-only rules, see `docs/DESIGN_SYSTEM.md` and
`src/app/styles/opinny-workspace.css`.

## Intent

A confident, friendly, exceptionally clear visual workspace for studying
prediction markets. Use the supplied reference's white canvas, very dark
rounded CTAs, balanced typography, purposeful pastel educational panels and
precise spacing. Reuse the *visual system*, not Miro's product, imagery or
copy. Every depicted market is a real component driven by Opinny's simulator.

## Fidelity decisions

| Reference component or treatment | Opinny implementation |
| --- | --- |
| Stark white marketing canvas | White site canvas and editorial home hero |
| Black full-pill primary button | Black rounded primary action throughout navigation and trading |
| White outline pill | Secondary action, market filters, navigation chips |
| Yellow brand accent | Original Opinny brand-mark dot, paper badge, restrained micro-highlights |
| Pastel product feature cards | Three genuinely functional paper-trading journey cards |
| Real product mockup imagery | Embedded, linked sample contract board using Opinny market data |
| 80px / 1.05 hero type | Responsive 80px / 1.05 display headline at wide desktop |
| 16px body and 14px buttons | Text scale, form/CTA and accessible trade actions |
| Flat cards and 1px hairlines | Market cards, account panels, portfolio, admin |
| 6-column dark marketing footer | Opinny brand column + five real-link navigation groups |
| Dark bottom CTA | Functional `/markets` CTA under the discovery page |
| 4/8px spacing units | Documented space tokens and section spacing |
| Responsive steps at 480/768/1024/1280 | Aligned mobile, tablet, desktop and wide rules |
| Miro brand wordmark | **Not used**; original Opinny logo retained |
| Roobert PRO | **Not licensed or bundled**. Project fonts: self-hosted Inter and Instrument Serif |
| Miro boards, stock imagery | **Not used**; product board built with live React components and mock adapter data |
| Marketing pricing tiers and app store badges | **Not applicable** to a free frontend-only paper simulator; do not invent these pages |

## Foundation tokens

```css
--canvas: #ffffff;
--surface-soft: #f7f8fa;
--ink: #1c1c1e;
--ink-2: #555a6a;
--ink-3: #6b6f7e;
--line: #e0e2e8;
--line-strong: #c7cad5;
--brand: #1c1c1e;
--accent: #4262ff;
--op-yellow: #ffd02f;
--op-rose: #fde0f0;
--op-coral: #ffc6c6;
--op-teal: #c3faf5;
--radius: 16px;
--radius-lg: 28px;
--container: 1280px;
```

## Typographic roles

- **Inter**, self-hosted by `next/font/google`: body, navigation, buttons,
  labels, balances, charts, percentages, order books, input fields and data.
- **Instrument Serif**, self-hosted by `next/font/google`: hero, question
  and editorial section headlines. Major market numbers remain Inter.
- No copied Roobert PRO, local system stacks, or third-party font files.
- The font aliases must resolve from the generated classes on `<html>`.
- Body uses 16px; ordinary controls target 13–14px or higher. Do not hide
  unreadable microcopy behind a large polished layout.

## Shapes and spacing

- 4px base unit, with 8 / 12 / 16 / 20 / 24 / 32 / 40px increments.
- Black primary pill buttons 44–48px tall, secondary outlined white pills.
- Flat card corner radius 16px, large expressive feature cards 28px.
- Marketing sections separated by roughly 64–96px, hero up to 112px.
- Subtle 1px gray hairlines between rows; no empty marketing ornament.
- Reserve shadow for the real featured market board and modal elevation.
- Preserve clear negative/positive indicators on trade components, and
  distinguish simulated data from real-money trading.

## Page coverage

**Homepage**: Centered hero, black pill actions, real featured market board,
purposeful rose/teal/coral journey cards, market pulse, existing discovery,
dark editorial CTA and six-column desktop footer (native accordions on small phones).

**Discovery**: Category pills, accessible search and sorting, flat market
cards, clear current probabilities, liquidity data and active actions.

**Market detail**: Clear contract board, simulated sample chart, trading
ticket, market depth and trade tape. Trading controls must not be hidden by
marketing treatments.

**Portfolio, orders, wallet and profile**: Whitespace, balances in Inter,
flat cards, readable tables, responsive controls and honest paper labels.

**Admin and resolutions**: More information density than the homepage but
the same black/white tokens, status readability and form affordances.

**Legal, help and rewards**: Consistent page typography, readable text,
dark footer and keyboard focus treatment. Do not add marketing content that
would obscure terms or risk information.

## Responsive contract

| Width | Behavior |
| --- | --- |
| Below 480px | 36px hero headline, one-column journey cards, full-width controls |
| 480–767px | Hero around 48–54px; two-up journey cards (third full-width); mobile trading sheet remains reachable |
| 768–1023px | Two-column feature cards; mobile/tablet trade sheet stays accessible |
| 1024–1279px | Desktop trading sidebar, information-first market layouts |
| 1280px and above | Up to 80px editorial hero, 1280px max container, six-column footer |

Always test 320px, 375px, 430px, 768px, 1024px and 1440px,
plus 200% zoom, reduced motion, keyboard-only flow and touch targets.
Breakpoints alone do not prove rendered pixel fidelity.

## Implementation-hardening audit (20 November 2026)

The following issues were discovered and repaired after the initial reference
implementation. They are enforced where possible by `design-language.test.ts`
and the existing CI suite.

- **Tablet navigation:** the original desktop navigation disappeared at 1024px
  while the menu was hidden until 760px. The hamburger now appears at 1024px;
  between 761–900px search remains available through the same drawer.
- **320px header:** wallet text previously competed with the brand, bell and
  menu buttons. On narrow phones it is an accessible labeled icon button,
  while the account control collapses its address text.
- **Top banner:** the black paper-mode strip now precedes the sticky white
  navigation, echoing the source's stacked marketing header without hiding
  its crucial simulated-money disclosure.
- **Market-board overlap:** the pastel supporting note is now a normal-flow
  element instead of covering active quote links.
- **Typography floor:** old 7–10px micro-labels across the legacy CSS were
  increased to at least the reference's 11px micro size. Main controls,
  account/admin inputs and table filters receive larger explicit sizes.
- **Footer:** six columns at desktop, three across tablets, two on mobile,
  and keyboard-operable native accordion navigation below 480px.
- **Interaction states:** visible keyboard focus, no invisible text,
  reduced-motion handling and minimum mobile touch sizes.
- **Paper honesty:** the footer no longer implies real blockchain
  transactions when the reference mock adapter is active.

These are code and stylesheet checks; passing CI does not establish that
every device and assistive-technology combination has been visually tested.

## Verification and honest limitations

The project runs `bun run check`: ESLint, TypeScript, unit tests and Next.js
static production build. Font and design-contract tests prevent common CSS
regressions. Vercel production preview checks confirm generated pages.

**Pixel-perfect cannot be certified from this textual reference alone.**
It has no target screenshots, exact Opinny page coordinates, imagery, or
interactive recordings. A full fidelity sign-off additionally needs
side-by-side desktop/mobile screenshots, browser inspection and hands-on
keyboard/screen-reader testing. The marketing-specific pricing/customer
story/whiteboard components are not implemented because they are not
part of Opinny.

## Maintenance

The legacy CSS currently uses multiple numbered files; the reference
translation is centralized in `src/app/styles/opinny-workspace.css` and
loaded last. Do not add more numbered global overrides for simple changes.
Consolidate shared rules into the canonical layer carefully, with browser
visual regression baselines before removing legacy selectors.

## November 2026 detailed audit addendum

A subsequent source audit identified additional mismatches and addressed them
in code rather than treating the earlier green CI as visual proof.

- **Trading boundary:** the existing 1024px stylesheet and the 980px trade
  interaction were inconsistent with this document. At 1024–1279px the
  trading layout now uses a visible desktop ticket; below 1024px the same
  outcome interaction opens a mobile modal. Resizing closes a stale sheet.
  Desktop quote interactions now focus their chosen contract.
- **Navigation:** full desktop navigation now collapses by 1180px to avoid
  crowding. Keyboard focus returns to a *visible* search/menu trigger,
  including when search was opened from the mobile drawer.
- **Account and notifications:** account actions expose normal keyboard
  link semantics and dismiss on outside clicks or Escape; the notifications
  dialog traps Tab/Shift+Tab, focuses its close button and restores focus.
- **Search result hierarchy:** placeholder market emoji squares were removed
  in favor of information-led rows with a question, sample-volume context
  and tabular probability.
- **Secondary pages:** legal body copy, help topics, safety notices, reward
  rules, admin KPIs and forms use the same readable Inter scale, fine borders
  and restrained backgrounds. Decorative KPI halos were removed.

**Verification status:** compilation, lint, typechecking and contract tests
run in the existing `bun run check` gate. Deployed-route HTML and font URLs
can be checked independently. Precise visual/layout measurements, real
interactive browser testing and screen-reader validation are still required
before a claim of complete pixel-perfect fidelity.

### Original uploaded reference review

The original user-supplied `Pasted text(6).txt` was reopened and reviewed
alongside this adapted DESIGN.md. It is a Miro marketing-system analysis
covering token colors, 80px display typography, pill buttons, input focus,
responsive grids, FAQ accordions, dark footer, marketing imagery and
Miro-specific pricing, customer stories, Roobert PRO and download badges.

The general design patterns are adapted. The Miro-specific business features,
brand assets and proprietary font remain intentionally excluded. Opinny uses
its real simulated markets instead of images that merely imitate another app.

The Help page and Rewards console now explicitly distinguish browser-local
paper examples from connected production integrations. The rewards dialog
also uses keyboard focus containment, and legal text has a 16px reading
scale consistent with the reference.

### Final source-level consistency pass

The source CSS has also been cleaned at the originating selectors:
floating market-card hover lifts, search shadows, decorative probability-card
orb, and legacy green gradients in snapshots, rewards, admin KPIs, resolution,
account, and claimable surfaces were removed or flattened. This reduces the
dependence on late overrides and keeps the UI aligned with the reference's
flat, hairline-led treatment.

Paper-mode context is visible in the wallet dialog (browser-local environment),
metadata, error handling and on all three policy pages. The policies preserve
their future-integration material but clearly disclose that the current product
executes no real blockchain transactions.

A static CSS contract test checks that these ornamental treatments do not
silently return. CI and HTTP responses cannot confirm visual parity, keyboard
accessibility in a rendered browser or device-specific layout.

**Loading and status treatments:** The loading screen now uses stable neutral
skeleton blocks instead of an indefinite green-tinted shimmer. Decorative
"live" pulsing was removed from the market-status accent: an open paper market
is not a live exchange feed. These changes preserve the loading status
announcement and the underlying trading state.

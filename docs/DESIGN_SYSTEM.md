# Opinny design system

## Direction

Opinny uses one light-mode visual language: warm neutral canvas, white information surfaces, deep evergreen controls, emerald positive states, coral emphasis, restrained borders, and low-opacity shadows. The interface should feel analytical rather than casino-like.

## Typography

- Interface, body, market data and technical identifiers: Inter only.
- Editorial/display hierarchy, questions and major headings: Instrument Serif only.
- Do not introduce system, generic serif/sans-serif, monospace, Georgia, Palatino, Times or other fallback font stacks.

## Core patterns

- Market cards prioritize the question, probability, outcome controls and liquidity metadata.
- Probability color is not the only indicator; every state also has a numeric value and text label.
- Desktop trade tickets remain sticky; mobile trade entry becomes a bottom sheet.
- Dense tables scroll horizontally rather than compressing columns below legibility.
- Modal, drawer and bottom-sheet overlays close with Escape or backdrop interaction where applicable.
- Admin pages share the product tokens but use a denser operational layout.

## Breakpoints

- Desktop: above 1024px
- Tablet: 761px–1024px
- Mobile: up to 760px
- Compact mobile refinements: up to 430px

## Accessibility baseline

- Visible labels accompany inputs.
- Interactive targets generally meet or exceed 38px, with primary mobile actions at 44–52px.
- Reduced-motion preferences disable non-essential animation.
- Statuses use labels and icons in addition to color.
- Normal-size text must maintain at least 4.5:1 contrast against its rendered background.
- Modal dialogs receive focus on open, contain Tab and Shift+Tab navigation, recover stray focus, and return focus to their trigger when closed.
- Search uses combobox/listbox semantics with an explicit active descendant for keyboard navigation.
- Horizontal overflow is intentionally contained within tabs and tables.

## Trading-first design direction (November 2026)

The market-detail screen, paper desk, and discovery cards establish the **Opinny editorial exchange** language. This is an original information-led approach, not a copy of another prediction market or a generic SaaS dashboard.

### Information hierarchy

1. On a market detail page, lead with the exact question and close date. The outcome contract prices are the primary action. Volume, sample participants, and liquidity are context, never marketing proof.
2. On a market card, make the question readable, followed by leading contract probability, outcome rows, and supporting metadata. Do not put emoji/letter illustrations ahead of market information.
3. In a trade ticket, prioritize: buy/sell, contract, order type, quantity, **visible paper balance**, realistic estimate and submit action. Fees, price impact, potential payout, and errors must remain legible.
4. In market depth, show explicit bid/ask headings, column labels, a spread, finite simulated depth, and the distinction between sample prints and the user's paper matches.
5. In the chart, use sequential sample windows (Recent 6, All samples), never fictitious 1D/1W/1M labels over an undated array. Expose the first-outcome limitation until the adapter can provide per-outcome timestamped history.

### Visual design decisions

- **Canvas:** warm neutral; white information surfaces with a single fine stroke and almost no elevation. Most cards should be flat.
- **Ink:** strong dark evergreen for actions and high-contrast primary data. Use coral/red only to denote negative/sell-related states, not decoration.
- **Typography:** Instrument Serif is reserved for editorial hero and major panel headers; all transaction prices, metadata, inputs, controls and charts use Inter and tabular figures.
- **Information density:** prefer compact but readable rows, not 7–9px labels. Standard metadata should be at least 11px and substantive interactive text at least 12px.
- **Spacing:** use deliberate divisions and quiet rule lines to separate content instead of a card-within-card-within-card pattern.
- **Feedback:** focus, selected state, disabled state, pending preview, errors and success must be readable without animation or color alone.
- **Responsive:** outcome quotes stack actions below prices below 430px. Tablet uses the mobile trade sheet below 1024px; desktop keeps the order ticket sticky but independently scrollable.
- **Motion:** no ambient pulses, hover lifts, floating cards or gradient glows as signifiers of quality. Honor reduced-motion preferences for programmatic scrolling and transitions.

### Anti-patterns forbidden in future Opinny work

- A new pastel illustration tile or arbitrarily colored emoji avatar on every market.
- Repeating the same probability in multiple decorated widgets without adding a new fact.
- Unexplained badges for normal section metadata.
- Fake historical timing, fabricated live-price labels, or treating simulated volume as verified market activity.
- Overlapping translucent panels, radial decorative halos, glow-on-hover cards, or gradients that convey no state.
- Extremely small captions compensated for by excessive whitespace.
- A UI polish pass that removes actual executable controls, loading, errors, keyboard handling or contrast.
- Copying branded iconography, layouts or visual assets from other trading platforms.

### Design acceptance gate

Evaluate the market page, home, discovery grid and mobile trade sheet at 320, 375, 430, 768, 1024 and 1440 pixels. Confirm readable probabilities, full question access, contrast, keyboard outcome and order selection, focus handling, no horizontal overflow and a coherent primary action. Use a real browser and screenshots: CI passing does **not** prove design quality.

### Implementation debt

The styles are currently composed from `globals-01.css` through numbered override files. The most recent detail/discovery direction is in `globals-23.css`, `globals-24.css`, and `globals-25.css`. This is a *transitional cascade*, not a sustainable final architecture. Before future large-scale redesigns, consolidate duplicate selectors into component-scoped or purpose-built stylesheets, with visual regression checks. Do not pile on another global override file for routine maintenance.

## Reliable webfont loading

Font sources are bundled through `next/font/google` in `src/app/layout.tsx` and served
from the deployed Next.js static assets. Inter is the UI and numeric font;
Instrument Serif is the editorial display face.

The generated `inter.variable` and `instrumentSerif.variable` classes **must be on
`<html>`**, not only on `<body>`. The project aliases them as
`--font-ui: var(--font-inter)` and `--font-display: var(--font-instrument-serif)`
inside `:root`, which cannot resolve a child-only variable on the ancestor.

Style rules must use `var(--font-ui)` or `var(--font-display)`, including the family
slot of the `font` shorthand. Literal `"Inter"` and `"Instrument Serif"`
CSS font-family names are *not* aliases for Next.js's generated scoped font names.
Do not force a single family on all descendants with an important universal rule.

Both fonts use `display: "swap"` to avoid invisible text while loading.
Keep the two-font-only brand rule and do not add a third font or CSS fallback stack.
The font smoke test in `src/lib/fonts.test.ts` checks the contract during CI.

To diagnose font loading in a deployed browser, inspect the computed `font-family`
of a market heading and its price row. The heading should use the generated
Instrument Serif family and the price row the generated Inter family. Check
requests for the generated `_next/static/media/*.woff2` files return HTTP 200
with font data rather than HTML/404.

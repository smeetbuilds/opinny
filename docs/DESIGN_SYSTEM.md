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

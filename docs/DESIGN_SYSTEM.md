# Opinny design system

## Direction

Opinny uses one light-mode visual language: warm neutral canvas, white information surfaces, deep evergreen controls, emerald positive states, coral emphasis, restrained borders, and low-opacity shadows. The interface should feel analytical rather than casino-like.

## Typography

- Interface: system sans-serif stack for speed and broad platform consistency.
- Editorial/display: Iowan Old Style, Palatino or Georgia for questions and major headings.
- Numeric and wallet identifiers: system monospace.

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
- Horizontal overflow is intentionally contained within tabs and tables.

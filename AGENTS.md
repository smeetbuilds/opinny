# Opinny agent instructions

Opinny is an open-source project developed by Aahav Labs (https://aahavlabs.in · hi@aahavlabs.in).

## Product invariants

- Frontend only; no bundled production backend or database.
- Backend-neutral contracts under `src/core/contracts`.
- Crypto-only wallet, deposit and withdrawal experiences.
- No card, bank, Stripe, PayPal or other fiat payment gateway.
- Public UI is branded only as Opinny; repository attribution stays in repository files.
- Independent light-mode visual identity; do not copy another platform’s branding or assets.
- Responsive desktop, laptop, tablet and mobile behaviour is mandatory.
- Admin UI is a presentation and command-preparation layer, never an authorization boundary.

## Implementation rules

- Keep provider payloads inside adapters.
- Use normalized domain types in components.
- Preserve static export compatibility for the reference mock deployment.
- Add loading, empty, validation, error and success states.
- Use accessible labels, roles, focus states, Escape dismissal and reduced-motion support.
- Do not claim mock calculations or requests are authoritative.

## Validation

Run `bun run check` before considering work complete.

# Opinny agent instructions

Opinny is an open-source project developed by Aahav Labs (https://aahavlabs.in · hi@aahavlabs.in).

## Product invariants

- Frontend only; no bundled production backend or database.
- Backend-neutral contracts under `src/core/contracts`.
- Crypto-only wallet, deposit and withdrawal experiences.
- No card, bank, Stripe, PayPal or other fiat payment gateway.
- Public UI is branded only as Opinny; repository attribution stays in repository files.
- Independent light-mode visual identity; do not copy another platform’s branding or assets.
- Instrument Serif is the display typeface and Inter is the UI/body typeface.
- Responsive desktop, laptop, tablet and mobile behaviour is mandatory.
- Admin UI is a presentation and command-preparation layer, never an authorization boundary.

## Implementation rules

- Keep provider payloads inside adapters.
- Use normalized domain types in components.
- Preserve static export compatibility for the reference mock deployment.
- Use the latest stable supported dependency releases. Do not move the production baseline to preview, canary, beta or release-candidate channels unless explicitly requested for an experiment.
- Add loading, empty, validation, error and success states.
- Use accessible labels, roles, focus states, Escape dismissal and reduced-motion support.
- Do not claim mock calculations, local state, integrations or requests are authoritative.
- Do not surface Aahav Labs, open-source, repository or demo attribution in the product UI.

## Validation

Run `bun run check` before considering work complete.

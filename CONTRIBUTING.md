# Contributing to Opinny

Opinny is an open-source project developed by Aahav Labs. Contributions that improve prediction-market UX, accessibility, backend-neutral architecture, documentation and integration quality are welcome.

Aahav Labs: https://aahavlabs.in · hi@aahavlabs.in

## Before contributing

Read:

- `README.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/INTEGRATION_GUIDE.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`

## Local setup

```bash
bun install
bun run dev
```

Before submitting changes:

```bash
bun run check
```

## Architecture requirements

- Keep the repository frontend only.
- Do not add a bundled production database, custody layer, matching engine or settlement backend.
- Keep product components independent from REST, GraphQL, RPC or provider-specific payloads.
- Add external integration logic under `src/adapters` and map it to `src/core/contracts`.
- Preserve crypto-only funding. Do not add card, bank or other fiat payment gateways.
- Treat frontend calculations as presentation estimates until confirmed by a backend or wallet.
- Keep Aahav Labs/open-source attribution in repository files, not the public Opinny UI.

## UI and accessibility requirements

- Preserve the independent light-mode visual identity.
- Test desktop, laptop, tablet and mobile layouts.
- Avoid horizontal page overflow.
- Include loading, empty, validation, error and success states.
- Use semantic buttons, links, labels and dialog roles.
- Support Escape dismissal and background scroll locking for overlays.
- Respect `prefers-reduced-motion`.
- Do not copy another platform’s branding, assets or proprietary interface verbatim.

## Pull requests

Use the pull request template. Keep changes cohesive, document user-visible behavior and list validation performed. Security-sensitive changes should first follow `SECURITY.md` rather than being publicly disclosed.

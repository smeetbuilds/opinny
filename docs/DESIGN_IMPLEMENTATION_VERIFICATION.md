# Opinny design implementation verification

**Scope:** User-supplied Miro visual analysis, translated through the repo's `DESIGN.md` into an original, browser-local prediction-market simulator. Last code review: 20 November 2026.

**How to interpret statuses**

- **Implemented** means source reviewed or changed in the repo and tested where practical.
- **Automated checks** means lint, typechecking, unit tests, static Next.js build, and/or HTTP/static font checks. It is not a claim of visual equivalence.
- **Not visually certified** means a real browser/device screenshot and/or assistive-technology check remains necessary.

| Area | Implemented evidence | Automated verification | Manual work still needed |
| --- | --- | --- | --- |
| Design token map | White canvas, 1280px content width, flat surfaces, yellow/rose/coral/teal accents, black action color | `design-language.test.ts`, `design-contrast.test.ts` | Inspect screenshots at six target widths |
| Fonts | Next.js self-hosted Inter body/numerics and Instrument Serif editorial headings; `font-display: swap` | `fonts.test.ts`, Next.js build, production font URLs | Verify actual loaded font family in computed styles |
| Hero & product illustration | Centered hero, actual simulated outcome board, no borrowed mockups | Design contract tests, static homepage response | Compare line wraps, type, alignment, and illustration size |
| Feature cards & bottom CTA | Three functioning pastel journey links and a dark end CTA | Source contract tests | Check row symmetry, overflow, button position |
| Market discovery | Accessible search/filter controls, flat contract cards and truthful sample labels | Contract tests and static route response | Keyboard filtering, varying title lengths, 320px layout |
| Market detail | Contract-first hero, sampled chart, finite-depth book, trade tape | Simulation and design tests | Real browser chart focus and display |
| Responsive trading | Desktop ticket at ≥1024px, sheet below 1024px; resize closes stale sheet | Breakpoint contract tests | Measure trading ticket at 768, 1024 and 1440px |
| Wallet & session | Browser-local environment, paper USDC, no real wallet/network broadcast | Paper simulation tests, static contract tests | Test opening, closing, tabbing and balance changes in browser |
| Rewards & help | Real controls, no invented payout, paper-specific disclosures | Design tests, static route response | Verify screen-reader dialog flow |
| Orders, account, settings & admin | Flat cards, readable forms, tabular amounts, mobile navigation | Existing tests/static build | Exercise every dialog, menu, form and empty state |
| Policy pages | 16px article copy and explicit demonstration-only scope note | CSS assertions and static route response | Read at 200% zoom and on mobile |
| Footer | Dark desktop grid, responsive native-accordion navigation on small screens | Design tests | Test details expansion and 200% zoom |
| Loading / errors | Quiet static skeleton, matching 64px header, clear retry and paper wording | Design tests/static build | Observe route transitions and error recoverability |
| Color / focus | Semantic green/red, dark buttons, visible blue keyboard focus | Calculated WCAG AA token contrast tests | Check effective computed contrast on all variants |
| Motion | Removed obsolete glows, hover lifts, and fake live pulses; reduced-motion rules | CSS regression tests | Test reduced-motion at OS level |
| Responsive grid | 320, 375, 430, 768, 1024, 1440px breakpoints defined in `DESIGN.md` | Source contracts | **No screenshot-level verification performed** |
| Accessibility | Named search inputs, clear buttons, dialog focus management | Source tests | VoiceOver/TalkBack, axe scan, full keyboard walkthrough |
| Performance | No additional dependencies or external font CDNs from this design pass | Existing production build | Measure CWV, CPU and memory on low-end mobile |

## Intentional deviations from the reference

Opinny retains its own brand/logo and uses license-compatible web fonts rather than Miro's Roobert PRO. It shows functional simulated markets rather than copying Miro's whiteboards or stock imagery. Miro's pricing tiers, customer logos, app-store badges, business sales pages and endorsements are deliberately not introduced: they are inappropriate for the free frontend-only simulator.

The yellow accent is used sparingly, not as the global trading CTA. Positives and negatives retain semantic green/red; they are not generalized into decorative pastels. All volumes, balance, prices and rewards in paper mode must be labeled simulated.

## Remaining acceptance gate

1. Use a real browser to capture **320 / 375 / 430 / 768 / 1024 / 1440px** viewports on homepage, discovery, market detail, trade sheet, account, rewards, help, legal and admin.
2. Confirm no overflow, clipped primary actions or unreadable small text; check actual font loading and focus indicators.
3. Run keyboard-only and VoiceOver/TalkBack tests for modals, accordion, search results, tabs and paper trading.
4. Verify reduced motion, 200% zoom, input focus and actual order preview/execution.
5. Only then claim visual/pixel-fidelity completion. The provided source is a text design analysis, not exact Opinny screenshots or Figma coordinates.

No branches, pull requests, paid services or new CI workflows are required. Avoid consolidating the legacy CSS by blind bulk deletion until browser comparison baselines exist.

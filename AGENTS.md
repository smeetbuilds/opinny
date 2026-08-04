# Opinny engineering guide

## Product boundary

Opinny is a frontend-only prediction-market platform. Do not introduce custody, signing, authentication, authorization, matching, settlement, resolution, compliance decisions, or authoritative balance calculations into browser code.

## Architecture rules

- UI code consumes domain models and ports from `src/core/contracts`.
- Transport-specific mapping belongs in `src/adapters`; pages must not depend directly on REST, GraphQL, WebSocket, RPC, database, or chain SDK response shapes.
- Keep server components as the default. Add `"use client"` only around interaction boundaries.
- Preserve light-mode-only design tokens and responsive behavior from 320px through ultrawide layouts.
- Every icon-only control requires an accessible name. Every modal, drawer, or sheet must support semantic dialog behavior and a clear close action.
- Never expose secrets through `NEXT_PUBLIC_*` variables.

## Quality gate

Run `bun run check` before merging. It executes ESLint, strict TypeScript checking, Bun tests, and the production build.

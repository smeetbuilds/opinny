# Pending release verification

The repository intentionally does not commit a hand-authored `bun.lock`. Bun's package manager must generate it from `package.json` using Bun 1.3.14 so transitive resolutions are authoritative.

When Bun is available in a networked environment, run:

```bash
bun install --lockfile-only
bun ci
bun run check
```

Commit the generated `bun.lock` only if all three commands succeed. CI should then replace `bun install` with `bun ci` so package/lockfile drift fails closed.

Browser regression coverage remains the next dependency-backed task after the lockfile is committed. Add the chosen browser runner and its exact locked dependencies in the same change; do not add an unlocked E2E dependency.

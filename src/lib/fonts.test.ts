import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const appDir = join(import.meta.dir, "..", "app");
const stylesDir = join(appDir, "styles");
const layout = readFileSync(join(appDir, "layout.tsx"), "utf8");
const baseFontRules = readFileSync(join(stylesDir, "globals-16.css"), "utf8");
const stylesheetNames = readdirSync(stylesDir).filter((name) => name.endsWith(".css"));

test("Next.js self-hosted fonts expose both family variables at the document root", () => {
  expect(layout).toContain('variable: "--font-inter"');
  expect(layout).toContain('variable: "--font-instrument-serif"');
  expect(layout).toContain('className={`${inter.variable} ${instrumentSerif.variable}`}');
  expect(layout).toContain("<body className={inter.className}>");
  expect(layout.match(/display: "swap"/g)).toHaveLength(2);
  expect(baseFontRules).toContain("--font-ui: var(--font-inter)");
  expect(baseFontRules).toContain("--font-display: var(--font-instrument-serif)");
  expect(baseFontRules).toContain("font-family: var(--font-ui)");
  expect(baseFontRules).toContain("font-family: var(--font-display)");
});

test("styles reference the generated font families, not unbundled font names or system stacks", () => {
  for (const name of stylesheetNames) {
    const content = readFileSync(join(stylesDir, name), "utf8");
    expect(content).not.toMatch(/"Iowan Old Style"|"Palatino Linotype"|ui-monospace|ui-sans-serif/i);
    expect(content).not.toMatch(/font-family:\s*(?:"Inter"|"Instrument Serif"|Inter\s*,)/);
    expect(content).not.toMatch(/font:\s*[^;{}]*(?:"Inter"|"Instrument Serif")/);
  }
  const fontLock = readFileSync(join(stylesDir, "globals-19.css"), "utf8");
  expect(fontLock).not.toMatch(/html\s+body\s+\*\s*\{/);
});

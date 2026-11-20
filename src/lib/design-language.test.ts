import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const stylesheet = readFileSync(join(root, "src", "app", "styles", "opinny-workspace.css"), "utf8");
const globals = readFileSync(join(root, "src", "app", "globals.css"), "utf8");
const homepage = readFileSync(join(root, "src", "components", "home-dashboard.tsx"), "utf8");
const footer = readFileSync(join(root, "src", "components", "site-footer.tsx"), "utf8");

test("reference design colors and sizing are declared with Opinny names", () => {
  const expected = {
    "--canvas": "#ffffff",
    "--brand": "#1c1c1e",
    "--accent": "#4262ff",
    "--op-yellow": "#ffd02f",
    "--op-rose": "#fde0f0",
    "--op-teal": "#c3faf5",
    "--op-coral": "#ffc6c6",
    "--line": "#e0e2e8",
    "--container": "1280px"
  };
  for (const [token, value] of Object.entries(expected)) {
    expect(stylesheet).toContain(`${token}: ${value};`);
  }
  expect(globals).toContain('@import "./styles/opinny-workspace.css";');
  expect(globals.trimEnd().endsWith('@import "./styles/opinny-workspace.css";')).toBe(true);
  expect(stylesheet).toContain("border-radius: 9999px");
  expect(stylesheet).toContain("@media (max-width: 479px)");
  expect(stylesheet).toContain("@media (max-width: 767px)");
  expect(stylesheet).toContain("@media (max-width: 1023px)");
});

test("marketing product surfaces link to actual working paper-market routes", () => {
  expect(homepage).toContain('className="market-board-frame"');
  expect(homepage).toContain('className="workflow-grid"');
  expect(homepage).toContain('className="home-cta"');
  expect(homepage).toContain('href="/markets"');
  expect(homepage).toContain('href="/portfolio"');
  expect(homepage).toContain("marketHref(featured.slug, featured.id");
  expect(homepage).not.toContain("miro.com");
  expect(homepage).not.toContain("Roobert PRO");
});

test("footer links exist and mock collateral disclosure stays truthful", () => {
  for (const label of ["Product", "Trading", "Explore", "Account", "Information"]) {
    expect(footer).toContain(`<strong>${label}</strong>`);
  }
  expect(footer).toContain('appConfig.adapter === "mock" ? "No real funds"');
  expect(footer).toContain('appConfig.adapter === "mock" ? "Browser-local sessions"');
  expect(footer).not.toContain("Live market states");
});

test("tablet navigation remains accessible when desktop navigation collapses", () => {
  const baseCss = readFileSync(join(root, "src", "app", "styles", "globals-08.css"), "utf8");
  const header = readFileSync(join(root, "src", "components", "header.tsx"), "utf8");
  expect(baseCss).toContain(".desktop-nav { display: none; }");
  expect(stylesheet).toMatch(/@media \(max-width: 1024px\)\s*\{\s*\.topbar \.mobile-menu-trigger \{ display: inline-flex/);
  expect(stylesheet).toContain('(max-width: 900px)');
  expect(header).toContain('className="mobile-drawer"');
  expect(header).toContain('aria-label="Account menu"');
  expect(header).toContain('aria-label={appConfig.adapter === "mock" ? "Start paper trading" : "Connect wallet"}');
  expect(header).toContain('className="wallet-button-label"');
  expect(stylesheet).toContain('.topbar-actions .wallet-button-label { display: none; }');
});

test("dark footer uses a keyboard-operable small-screen accordion", () => {
  const shell = readFileSync(join(root, "src", "components", "site-shell.tsx"), "utf8");
  expect(footer).toContain('className="footer-mobile-groups"');
  expect(footer).toContain("<details key={group}>");
  expect(footer).toContain("<summary>{group}</summary>");
  expect(stylesheet).toContain('.site-footer .footer-mobile-groups summary');
  expect(stylesheet).toContain("min-height: 50px");
  expect(footer).toContain('"Practice mode · No blockchain transactions"');
  expect(shell.indexOf('<div className="paper-banner"')).toBeLessThan(shell.indexOf("<Header />"));
});

test("the live market board cannot be covered by the educational note", () => {
  expect(stylesheet).toContain(".opinny-desk-home .board-context-note {");
  expect(stylesheet).toMatch(/\.opinny-desk-home \.board-context-note\s*\{\s*position: static/);
  expect(stylesheet).toContain("width: min(100%, 790px)");
  expect(stylesheet).toMatch(/@media \(min-width: 480px\) and \(max-width: 767px\)/);
});

test("no authored CSS uses text smaller than the reference's 11px micro size", () => {
  const styleDir = join(root, "src", "app", "styles");
  const names = readdirSync(styleDir).filter((name) => name.endsWith(".css"));
  const failures: string[] = [];
  for (const name of names) {
    const contents = readFileSync(join(styleDir, name), "utf8");
    for (const match of contents.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      if (Number(match[1]) < 11) failures.push(`${name}: ${match[0]}`);
    }
  }
  expect(failures).toEqual([]);
});

test("interactive states have a strong visible focus ring and mobile controls stay usable", () => {
  expect(stylesheet).toContain('body :is(a, button, input, select, textarea, summary, [role="slider"], [tabindex="0"]):focus-visible');
  expect(stylesheet).toContain("outline: 3px solid var(--accent) !important");
  expect(stylesheet).toContain("min-height: 44px");
  expect(stylesheet).toContain(".site-footer .footer-mobile-groups nav a");
  expect(stylesheet).toContain('max-width: 479px');
});

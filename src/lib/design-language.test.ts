import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
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

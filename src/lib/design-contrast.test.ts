import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const stylesheet = readFileSync(join(import.meta.dir, "..", "app", "styles", "opinny-workspace.css"), "utf8");

function token(name: string): string {
  const line = stylesheet.split("\n").find((item) => item.trim().startsWith(name + ":"));
  if (!line) throw new Error(`Missing design color token ${name}`);
  const value = line.split(":")[1]?.trim().replace(/;$/, "");
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid hex color for ${name}: ${value}`);
  return value;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("design tokens meet the WCAG AA contrast ratio for regular text", () => {
  const pairs: [string, string, string, number][] = [
    ["primary copy", "--ink", "--canvas", 4.5],
    ["secondary copy", "--ink-2", "--canvas", 4.5],
    ["tertiary copy", "--ink-3", "--canvas", 4.5],
    ["tertiary copy on soft surfaces", "--ink-3", "--surface-soft", 4.5],
    ["positive trading values", "--green", "--canvas", 4.5],
    ["negative trading values", "--red", "--canvas", 4.5],
    ["black pill action label", "--canvas", "--brand", 4.5],
    ["editorial copy on rose cards", "--ink", "--op-rose", 4.5],
    ["editorial copy on teal cards", "--ink", "--op-teal", 4.5],
    ["editorial copy on coral cards", "--ink", "--op-coral", 4.5]
  ];
  for (const [purpose, foreground, background, minimum] of pairs) {
    const ratio = contrast(token(foreground), token(background));
    expect(ratio, `${purpose}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
  }
  expect(stylesheet).toContain(".site-footer nav > a { color: #c5c6cd");
  expect(contrast("#c5c6cd", token("--op-footer"))).toBeGreaterThanOrEqual(4.5);
});

test("focus indication maintains at least 3:1 contrast on the white canvas", () => {
  const ratio = contrast(token("--accent"), token("--canvas"));
  expect(ratio).toBeGreaterThanOrEqual(3);
  expect(stylesheet).toContain("outline: 3px solid var(--accent) !important");
});

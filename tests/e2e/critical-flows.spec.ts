import { expect, test, type Page, type TestInfo } from "@playwright/test";

function isMobileProject(testInfo: TestInfo) {
  return testInfo.project.name.includes("mobile");
}

function watchRuntimeIssues(page: Page) {
  const issues: string[] = [];
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`console: ${message.text()}`);
  });
  return issues;
}

async function waitForStablePage(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    if ("fonts" in document) await document.fonts.ready;
  });
}

async function expectNoPageOverflow(page: Page, route: string) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        if (!element.getClientRects().length) return false;
        const rect = element.getBoundingClientRect();
        return rect.right > viewportWidth + 1 || rect.left < -1;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth
        };
      })
      .sort((a, b) => Math.max(b.right - viewportWidth, -b.left) - Math.max(a.right - viewportWidth, -a.left))
      .slice(0, 8);
    return { overflow: pageWidth - viewportWidth, offenders };
  });
  expect(result.overflow, `${route} should not create page-level horizontal overflow. Offenders: ${JSON.stringify(result.offenders)}`).toBeLessThanOrEqual(1);
}

async function connectReferenceWallet(page: Page) {
  const trigger = page.getByRole("button", { name: "Connect wallet" }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Connect your wallet" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Browser wallet/ }).click();
  await expect(dialog).toBeHidden();
}

const criticalRoutes = [
  { path: "/markets/", heading: "Markets" },
  { path: "/settings/", heading: "Settings" },
  { path: "/admin/", heading: "Overview" }
] as const;

for (const route of criticalRoutes) {
  test(`critical route ${route.path} renders without runtime errors or page overflow`, async ({ page }) => {
    const issues = watchRuntimeIssues(page);
    await page.goto(route.path);
    await waitForStablePage(page);
    await expect(page.getByRole("heading", { name: route.heading, exact: true }).first()).toBeVisible();
    await expectNoPageOverflow(page, route.path);
    expect(issues, `${route.path} should not emit browser runtime errors`).toEqual([]);
  });
}

test("wallet dialog traps focus, restores the opener, and reconnects after reload", async ({ page }) => {
  const issues = watchRuntimeIssues(page);
  await page.goto("/portfolio/");
  await waitForStablePage(page);

  const trigger = page.getByRole("button", { name: "Connect wallet" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Connect your wallet" });
  await expect(dialog).toBeVisible();

  const close = dialog.getByRole("button", { name: "Close wallet dialog" });
  const lastWallet = dialog.getByRole("button", { name: /Safe/ });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastWallet).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("button", { name: /Browser wallet/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Portfolio value", { exact: true })).toBeVisible();

  await page.reload();
  await waitForStablePage(page);
  await expect(page.getByText("Portfolio value", { exact: true })).toBeVisible();
  expect(issues, "wallet flow should not emit browser runtime errors").toEqual([]);
});

test("reference wallet can prepare a trade from the authoritative preview", async ({ page }, testInfo) => {
  const issues = watchRuntimeIssues(page);
  await page.goto("/market/bitcoin-above-150k-before-2027/");
  await waitForStablePage(page);
  await connectReferenceWallet(page);
  await expectNoPageOverflow(page, "/market/bitcoin-above-150k-before-2027/");

  if (isMobileProject(testInfo)) {
    await page.locator(".mobile-trade-button:visible").click();
    await expect(page.getByRole("dialog", { name: /Trade Bitcoin above \$150K before 2027\?/ })).toBeVisible();
  }

  const ticket = page.locator(".ticket-content:visible");
  await expect(ticket.getByText("Order preview ready", { exact: true })).toBeVisible();
  const submit = ticket.getByRole("button", { name: "Buy Yes", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText("Order request ready", { exact: true })).toBeVisible();

  expect(issues, "trade preparation should not emit browser runtime errors").toEqual([]);
});

test("account trading preferences survive a reload", async ({ page }) => {
  const issues = watchRuntimeIssues(page);
  await page.goto("/settings/");
  await waitForStablePage(page);

  const orderType = page.getByLabel("Default order type");
  await expect(orderType).toBeEnabled();
  await orderType.selectOption("limit");
  const save = page.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeEnabled();
  await save.click();

  await page.reload();
  await waitForStablePage(page);
  await expect(page.getByLabel("Default order type")).toHaveValue("limit");
  expect(issues, "settings persistence should not emit browser runtime errors").toEqual([]);
});

test("desktop market search exposes combobox state and opens the active result", async ({ page }, testInfo) => {
  test.skip(isMobileProject(testInfo), "Desktop command-search behavior is covered by desktop browser projects.");
  const issues = watchRuntimeIssues(page);
  await page.goto("/markets/");
  await waitForStablePage(page);

  await page.getByRole("button", { name: "Search markets" }).click();
  const search = page.getByRole("combobox", { name: "Search markets" });
  await expect(search).toBeFocused();
  await search.fill("bitcoin");
  await expect(search).toHaveAttribute("aria-activedescendant", "market-search-option-mkt-001");
  await expect(page.locator("#market-search-option-mkt-001")).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/market\/bitcoin-above-150k-before-2027\/?$/);
  await expect(page.getByRole("heading", { name: "Will Bitcoin trade above $150,000 before January 1, 2027?" })).toBeVisible();

  expect(issues, "keyboard search should not emit browser runtime errors").toEqual([]);
});

test("mobile navigation behaves as a modal and restores focus", async ({ page }, testInfo) => {
  test.skip(!isMobileProject(testInfo), "Mobile drawer behavior is covered by the mobile Chromium project.");
  const issues = watchRuntimeIssues(page);
  await page.goto("/markets/");
  await waitForStablePage(page);

  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Mobile menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Opinny home" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  expect(issues, "mobile navigation should not emit browser runtime errors").toEqual([]);
});

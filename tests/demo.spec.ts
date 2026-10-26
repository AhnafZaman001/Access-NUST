import { test, expect } from "@playwright/test";
test("filters, search, saved places, preferences, route and admin demo work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000");
  await expect(
    page.getByRole("heading", { name: "Your campus. More possibilities." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Medical", exact: true }).click();
  await expect(page.getByText("1 places to explore")).toBeVisible();
  await page.getByRole("button", { name: "All places", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search campus places" })
    .fill("library");
  await expect(page.getByText("1 places to explore")).toBeVisible();
  await page
    .getByRole("button", { name: "Save Central Library", exact: true })
    .click();
  await page.getByRole("button", { name: /Saved places/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your saved places" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview a sample route" }).click();
  await expect(page.getByText(/Path continuity, gradients/)).toBeVisible();
  await page.getByRole("button", { name: "Your preferences" }).click();
  await page.getByLabel("Avoid steps", { exact: true }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Your preferences" }).click();
  await expect(page.getByLabel("Avoid steps", { exact: true })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Admin demo" }).click();
  await page
    .getByRole("textbox", { name: "Edit Central Library", exact: true })
    .fill("Library demo edit");
  await page.getByRole("button", { name: "Apply demo changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Library demo edit" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "/tmp/access-nust-desktop.png",
    fullPage: true,
  });
});
test("mobile layout and empty search remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("textbox", { name: "Search campus places" })
    .fill("no-such-place");
  await expect(
    page.getByRole("heading", { name: "No matching places" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore all places" }).click();
  await expect(page.getByText("6 places to explore")).toBeVisible();
  await page.screenshot({
    path: "/tmp/access-nust-mobile.png",
    fullPage: true,
  });
});

import { test, expect } from "@playwright/test";
test("researched directory, sources, guest saved places and preferences", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000");
  await expect(page.getByText("65 places to explore")).toBeVisible();
  await page.getByRole("button", { name: "Medical", exact: true }).click();
  await expect(page.getByText("1 places to explore")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "NUST Medical Centre", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("CAMPUS GUIDE · #44")).toBeVisible();
  await page.getByText("Sources & limitations", { exact: false }).click();
  await expect(
    page.getByText("Guide legend marker 44 is labeled NUST Medical Centre.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save NUST Medical Centre", exact: true })
    .click();
  await page.getByRole("button", { name: /Saved places/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your saved places" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Your preferences" }).click();
  await page.getByLabel("Avoid steps", { exact: true }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Saved places/ }).click();
  await expect(page.getByText("1 places to explore")).toBeVisible();
  await page.getByRole("button", { name: "Your preferences" }).click();
  await expect(page.getByLabel("Avoid steps", { exact: true })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".custom-pin")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("mobile search and missing categories remain honest", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Washrooms", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No matching places" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore all places" }).click();
  await page
    .getByRole("textbox", { name: "Search campus places" })
    .fill("SADA");
  await expect(page.getByText("1 places to explore")).toBeVisible();
  await page.screenshot({
    path: "/tmp/access-nust-directory-mobile.png",
    fullPage: true,
  });
});
test("account and admin do not pretend to authenticate without Supabase", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3000/account");
  await expect(
    page.getByRole("heading", { name: "Account service is not connected yet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveCount(0);
  await page.goto("http://127.0.0.1:3000/admin");
  await expect(
    page.getByRole("heading", {
      name: "Connect the database to manage records",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save record", exact: true }),
  ).toHaveCount(0);
});
test("public API excludes uncertain coordinates and unresolved entities", async ({
  request,
}) => {
  const response = await request.get("http://127.0.0.1:3000/api/places");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.source).toBe("research");
  expect(body.places).toHaveLength(65);
  expect(
    body.places.every(
      (p: {
        lat: number | null;
        lng: number | null;
        location_verified: boolean;
      }) => p.lat === null && p.lng === null && !p.location_verified,
    ),
  ).toBeTruthy();
  expect(
    body.places.some((p: { id: string }) =>
      ["nust-gate-16-poi", "nust-reception-area"].includes(p.id),
    ),
  ).toBeFalsy();
  const health = await request.get("http://127.0.0.1:3000/api/health");
  expect((await health.json()).backend).toBe("not_configured");
});

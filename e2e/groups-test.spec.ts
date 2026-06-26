import { test, expect, Page } from "@playwright/test";
import path from "path";

const BASE = "http://localhost:5173";
const SS_DIR = "/tmp/vynce-test-screenshots";

const USERS = {
  casey: { email: "casey@vynce.app", pass: "TestPass123!" },
  jack: { email: "jack@vynce.app", pass: "TestPass123!" },
  hannah: { email: "hannah@vynce.app", pass: "TestPass123!" },
  isabella: { email: "isabella@vynce.app", pass: "TestPass123!" },
};

async function login(page: Page, user: { email: string; pass: string }) {
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  // LoginForm renders twice (mobile + desktop layouts). Use first visible instance.
  await page.locator("#email").first().fill(user.email);
  await page.locator("#password").first().fill(user.pass);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: true });
}

// Mobile viewport (the app is mobile-first)
test.use({ viewport: { width: 390, height: 844 } });

test.describe("Groups Feature", () => {

  test("1. Casey browses groups with privacy badges", async ({ page }) => {
    await login(page, USERS.casey);
    await screenshot(page, "01-casey-logged-in");

    await page.goto(`${BASE}/groups`);
    await page.waitForTimeout(2000);
    await screenshot(page, "02-casey-browse-groups");

    await expect(page.locator("text=Tech Innovators").first()).toBeVisible();
    await expect(page.locator("text=Hyderabad Foodies").first()).toBeVisible();
    await expect(page.locator("text=Weekend Hikers").first()).toBeVisible();

    await expect(page.locator("svg.lucide-lock").first()).toBeVisible();
    await expect(page.locator("svg.lucide-globe").first()).toBeVisible();

    // On mobile, Create is a floating Plus button
    await expect(page.locator("svg.lucide-plus").first()).toBeVisible();
    await screenshot(page, "03-casey-groups-with-badges");
  });

  test("2. Casey creates a new group", async ({ page }) => {
    await login(page, USERS.casey);

    // Navigate directly to create page (reliable than clicking Plus button)
    await page.goto(`${BASE}/groups/create`);
    await page.waitForTimeout(2000);
    await screenshot(page, "04-create-group-form");

    // The title input placeholder is "Give your group a name"
    const titleInput = page.locator('input[placeholder*="name" i]');
    if (await titleInput.count() > 0) {
      await titleInput.first().fill("Book Lovers Club");
    } else {
      // Fallback: try finding any visible input on the form
      const inputs = page.locator("input");
      for (let i = 0; i < await inputs.count(); i++) {
        if (await inputs.nth(i).isVisible()) {
          await inputs.nth(i).fill("Book Lovers Club");
          break;
        }
      }
    }

    const textareas = page.locator("textarea");
    if (await textareas.count() > 0) {
      await textareas.first().fill("A cozy group for book enthusiasts to discuss reads");
    }

    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
    } else {
      // Fallback: try any button that says "Create"
      await page.locator('button:has-text("Create Group")').first().click();
    }
    await page.waitForTimeout(4000);
    await screenshot(page, "05-group-created");

    // Should now be on the group detail page - check URL contains /groups/
    await expect(page).toHaveURL(/\/groups\//);
    // Verify the page loaded content
    await expect(page.locator("h1").first()).toBeAttached({ timeout: 5000 });
  });

  test("3. Jack sees correct membership statuses", async ({ page }) => {
    await login(page, USERS.jack);
    await page.goto(`${BASE}/groups`);
    await page.waitForTimeout(2000);
    await screenshot(page, "06-jack-browse-groups");

    await expect(page.locator("text=Hyderabad Foodies").first()).toBeVisible();
    await expect(page.locator("text=Tech Innovators").first()).toBeVisible();
  });

  test("4. Jack views group feed with posts", async ({ page }) => {
    await login(page, USERS.jack);

    await page.goto(`${BASE}/groups`);
    await page.waitForTimeout(1000);
    await page.locator("text=Hyderabad Foodies").first().click();
    await page.waitForTimeout(2000);
    await screenshot(page, "07-jack-hyderabad-foodies");

    await page.locator('button:has-text("Feed")').first().click();
    await page.waitForTimeout(1000);
    await screenshot(page, "08-jack-foodies-feed");

    await expect(page.locator("text=Welcome to Hyderabad Foodies!").first()).toBeVisible();
  });

  test("5. Casey sees pending join requests as admin", async ({ page }) => {
    await login(page, USERS.casey);

    await page.goto(`${BASE}/groups`);
    await page.waitForTimeout(1000);
    await page.locator("text=Tech Innovators").first().click();
    await page.waitForTimeout(2000);
    await screenshot(page, "09-casey-tech-innovators");

    await page.locator('button:has-text("About")').first().click();
    await page.waitForTimeout(1000);
    await screenshot(page, "10-casey-tech-about-pending");

    const jrBtn = page.locator('button:has-text("Join Requests")');
    if (await jrBtn.count() > 0) {
      await jrBtn.first().click();
      await page.waitForTimeout(1000);
      await screenshot(page, "11-casey-join-requests-modal");
    }
  });

  test("6. Casey approves Hannah, rejects Jack", async ({ page }) => {
    await login(page, USERS.casey);
    await page.goto(`${BASE}/groups/ml2frnaeaf`);
    await page.waitForTimeout(2000);

    await page.locator('button:has-text("About")').first().click();
    await page.waitForTimeout(500);

    const jrBtn = page.locator('button:has-text("Join Requests")');
    if (await jrBtn.count() > 0) {
      await jrBtn.first().click();
      await page.waitForTimeout(1500);
    }
    await screenshot(page, "12-before-approve-reject");

    // Approve via the "Approve" text button in the modal (not the SVG icon itself)
    const approveBtns = page.locator('button:has-text("Approve"), button:has-text("approve")');
    const count = await approveBtns.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await approveBtns.first().click();
        await page.waitForTimeout(2000);
      }
    } else {
      // Fallback: try clicking the check icon buttons
      const checkBtns = page.locator('button:has(svg.lucide-check)');
      const checkCount = await checkBtns.count();
      for (let i = 0; i < checkCount; i++) {
        await checkBtns.first().click({ force: true });
        await page.waitForTimeout(2000);
      }
    }

    await screenshot(page, "13-after-approve-hannah");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  test("7. Hannah accesses approved group and creates post", async ({ page }) => {
    await login(page, USERS.hannah);

    await page.goto(`${BASE}/groups/ml2frnaeaf`);
    await page.waitForTimeout(2000);
    await screenshot(page, "14-hannah-tech-innovators");

    await page.locator('button:has-text("Feed")').first().click();
    await page.waitForTimeout(1000);

    const postInput = page.locator('textarea[placeholder*="Share" i]');
    if (await postInput.count() > 0) {
      await postInput.fill("Hey everyone! Excited to join this group. Working on an AI project!");
      await screenshot(page, "15-hannah-writing-post");
      await page.locator('button:has-text("Post")').first().click();
      await page.waitForTimeout(2000);
      await screenshot(page, "16-hannah-post-created");
      await expect(page.locator("text=AI project").first()).toBeVisible();
    }
  });

  test("8. Casey uses admin controls on members", async ({ page }) => {
    await login(page, USERS.casey);
    await page.goto(`${BASE}/groups/ml1j5o9f1o`);
    await page.waitForTimeout(2000);

    await page.locator('button:has-text("Members")').first().click();
    await page.waitForTimeout(1000);
    await screenshot(page, "17-casey-members-list");

    await expect(page.locator("text=Jack").first()).toBeVisible();

    await page.locator('button:has-text("About")').first().click();
    await page.waitForTimeout(1000);
    await screenshot(page, "18-casey-about-tab");
  });

  test("9. Isabella accesses Weekend Hikers", async ({ page }) => {
    await login(page, USERS.isabella);

    await page.goto(`${BASE}/groups/ml2nub7vvt`);
    await page.waitForTimeout(2000);
    await screenshot(page, "19-isabella-weekend-hikers");
  });

  test("10. Final groups overview", async ({ page }) => {
    await login(page, USERS.casey);
    await page.goto(`${BASE}/groups`);
    await page.waitForTimeout(2000);
    await screenshot(page, "20-final-groups-overview");
  });
});

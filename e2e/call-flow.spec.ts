import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import * as fs from "fs";

const CALLER_EMAIL = process.env.CALLER_EMAIL || "";
const CALLER_PASS = process.env.CALLER_PASS || "";
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || "";
const RECEIVER_PASS = process.env.RECEIVER_PASS || "";

const LOG_PATH = "/tmp/vynce-call-test.log";
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

async function login(page: Page, email: string, password: string) {
  log(`Logging in as ${email}`);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const loginBtn = page.locator('button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")');
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.fill('input[type="email"], input[name="usr"], input[placeholder*="email"]', email);
    await page.fill('input[type="password"], input[name="pwd"]', password);
    await loginBtn.click();
    await page.waitForLoadState("networkidle");
    log("Login form submitted");
  } else {
    log("Already logged in or no login form");
  }

  await page.waitForTimeout(3000);
}

async function captureLogs(page: Page, label: string) {
  const logs: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[call]") || text.includes("[CallProvider]") || text.includes("[useChat]") || text.includes("[extractMessages]")) {
      logs.push(`[${label}] ${text}`);
      log(`[${label}] ${text}`);
    }
  });
  page.on("pageerror", (err) => {
    log(`[${label}] PAGE ERROR: ${err.message}`);
  });
  return logs;
}

async function screenshot(page: Page, prefix: string) {
  await page.screenshot({ path: `/tmp/vynce-${prefix}-${Date.now()}.png`, fullPage: true });
}

test.describe("Call Flow", () => {
  let alexCtx: BrowserContext;
  let caseyCtx: BrowserContext;
  let alexPage: Page;
  let caseyPage: Page;
  let alexLogs: string[];
  let caseyLogs: string[];

  test.beforeAll(async ({ browser }) => {
    if (!CALLER_EMAIL || !CALLER_PASS || !RECEIVER_EMAIL || !RECEIVER_PASS) {
      test.skip(true, "Set CALLER_EMAIL, CALLER_PASS, RECEIVER_EMAIL, RECEIVER_PASS env vars");
    }

    fs.writeFileSync(LOG_PATH, "");
    log("=== Call Flow Test Starting ===");

    alexCtx = await browser.newContext({
      storageState: undefined,
      permissions: ["camera", "microphone"],
    });
    caseyCtx = await browser.newContext({
      storageState: undefined,
      permissions: ["camera", "microphone"],
    });

    alexPage = await alexCtx.newPage();
    caseyPage = await caseyCtx.newPage();

    alexLogs = await captureLogs(alexPage, "Alex");
    caseyLogs = await captureLogs(caseyPage, "Casey");

    await login(alexPage, CALLER_EMAIL, CALLER_PASS);
    await screenshot(alexPage, "alex-after-login");

    await login(caseyPage, RECEIVER_EMAIL, RECEIVER_PASS);
    await screenshot(caseyPage, "casey-after-login");
  });

  test.afterAll(async () => {
    await alexCtx?.close().catch(() => {});
    await caseyCtx?.close().catch(() => {});

    log("=== FINAL SUMMARY ===");
    if (alexLogs) {
      const alexInviteSent = alexLogs.some((l) => l.includes("Invite sent") || l.includes("m.call.invite"));
      const alexCallEvents = alexLogs.filter((l) => l.includes("[call]") || l.includes("[CallProvider]") || l.includes("[extractMessages]"));
      log(`Alex invite sent: ${alexInviteSent}`);
      log(`Alex call events (${alexCallEvents.length}):`);
      alexCallEvents.forEach((l) => log(`  ${l}`));
    }
    if (caseyLogs) {
      const caseyInviteReceived = caseyLogs.some((l) => l.includes("INVITE received") || l.includes("invite received"));
      const caseyCallEvent = caseyLogs.some((l) => l.includes("m.call.invite"));
      const caseyCallEvents = caseyLogs.filter((l) => l.includes("[call]") || l.includes("[CallProvider]") || l.includes("[extractMessages]"));
      log(`Casey invite received: ${caseyInviteReceived}`);
      log(`Casey any call event: ${caseyCallEvent}`);
      log(`Casey call events (${caseyCallEvents.length}):`);
      caseyCallEvents.forEach((l) => log(`  ${l}`));
    }
    log("=== Call Flow Test Complete ===");
  });

  test("Both users navigate to chat and Matrix clients initialize", async () => {
    log("=== Test: Navigate to chat ===");

    await alexPage.goto("/chat");
    await alexPage.waitForLoadState("networkidle");
    await alexPage.waitForTimeout(5000);
    await screenshot(alexPage, "alex-chat-loaded");

    await caseyPage.goto("/chat");
    await caseyPage.waitForLoadState("networkidle");
    await caseyPage.waitForTimeout(5000);
    await screenshot(caseyPage, "casey-chat-loaded");

    expect(alexLogs.some((l) => l.includes("Matrix client ready"))).toBeTruthy();
    expect(caseyLogs.some((l) => l.includes("Matrix client ready"))).toBeTruthy();
    log("Both Matrix clients ready");
  });

  test("Alex initiates a voice call", async () => {
    log("=== Test: Alex calls Casey ===");

    const phoneButtons = alexPage.locator('button[title="Voice call"]');
    await expect(phoneButtons.first()).toBeVisible({ timeout: 10000 });
    await phoneButtons.first().click();
    log("Alex clicked call button");

    await alexPage.waitForTimeout(3000);
    await screenshot(alexPage, "alex-calling");

    const callingText = alexPage.locator("text=Calling...");
    const isCallingVisible = await callingText.isVisible().catch(() => false);
    log(`Alex sees Calling UI: ${isCallingVisible}`);

    const inviteSent = alexLogs.some((l) => l.includes("Invite sent") || l.includes("m.call.invite"));
    log(`Alex invite sent log: ${inviteSent}`);

    expect(isCallingVisible || inviteSent).toBeTruthy();
  });

  test("Casey receives incoming call notification", async () => {
    log("=== Test: Casey receives call ===");

    await caseyPage.waitForTimeout(15000);
    await screenshot(caseyPage, "casey-after-call");

    const inviteReceived = caseyLogs.some(
      (l) => l.includes("INVITE received") || l.includes("invite received") || l.includes("m.call.invite")
    );
    log(`Casey invite received log: ${inviteReceived}`);

    const overlay = caseyPage.locator(".fixed.inset-0.z-50");
    const overlayVisible = await overlay.isVisible().catch(() => false);
    log(`Casey call overlay visible: ${overlayVisible}`);

    const incomingTextVisible = await caseyPage.locator("text=Incoming").isVisible().catch(() => false);
    log(`Casey sees 'Incoming' text: ${incomingTextVisible}`);

    const caseyCallLogs = caseyLogs.filter((l) => l.includes("[CallProvider]"));
    log(`Casey CallProvider logs (${caseyCallLogs.length}):`);
    caseyCallLogs.forEach((l) => log(`  ${l}`));
  });

  test("Call event appears in chat timeline for both users", async () => {
    log("=== Test: Call logs in chat ===");

    await alexPage.waitForTimeout(5000);
    await caseyPage.waitForTimeout(5000);
    await screenshot(alexPage, "alex-call-log");
    await screenshot(caseyPage, "casey-call-log");

    const alexMissedCall = await alexPage.locator("text=Missed call").isVisible().catch(() => false);
    const alexCallIcon = await alexPage.locator("text=📞").isVisible().catch(() => false);
    log(`Alex 'Missed call' in chat: ${alexMissedCall}`);
    log(`Alex 📞 in room list: ${alexCallIcon}`);

    const caseyMissedCall = await caseyPage.locator("text=Missed call").isVisible().catch(() => false);
    const caseyCallIcon = await caseyPage.locator("text=📞").isVisible().catch(() => false);
    log(`Casey 'Missed call' in chat: ${caseyMissedCall}`);
    log(`Casey 📞 in room list: ${caseyCallIcon}`);

    const alexExtractLogs = alexLogs.filter((l) => l.includes("[extractMessages]"));
    const caseyExtractLogs = caseyLogs.filter((l) => l.includes("[extractMessages]"));
    log(`Alex extractMessages logs (${alexExtractLogs.length}):`);
    alexExtractLogs.forEach((l) => log(`  ${l}`));
    log(`Casey extractMessages logs (${caseyExtractLogs.length}):`);
    caseyExtractLogs.forEach((l) => log(`  ${l}`));
  });
});

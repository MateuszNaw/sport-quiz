import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3460";
const shots = "/tmp/shots";
await import("fs/promises").then((fs) => fs.mkdir(shots, { recursive: true }));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

function log(msg) {
  console.log(`[verify] ${msg}`);
}

// 1. Home page — difficulty section
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: `${shots}/01-home.png`, fullPage: true });
log("home captured");

// 2. Register a new user
const username = `tester_${Date.now().toString(36)}`;
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.click("text=Register");
await page.fill('input[placeholder*="goal_machine"]', username);
await page.fill('input[placeholder="Anything works"]', "password123");
await page.screenshot({ path: `${shots}/02-register-form.png` });
await page.click('button:has-text("Create account")');
await page.waitForURL(`${BASE}/profile`, { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/03-profile-fresh.png`, fullPage: true });
log(`registered as ${username}, profile captured`);

// 3. Set favorites
await page.selectOption("select", "football");
await page.fill('input[placeholder="e.g. Real Madrid"]', "Arsenal");
await page.fill('input[placeholder="e.g. Serena Williams"]', "Bukayo Saka");
await page.click('button:has-text("Save favorites")');
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/04-profile-favorites-saved.png`, fullPage: true });
log("favorites saved");

// 4. Play a quiz round (easy, 3 questions via URL) and finish it
await page.goto(`${BASE}/quiz?difficulty=easy&length=2`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/05-quiz-pick-category.png`, fullPage: true });

for (let round = 0; round < 2; round++) {
  await page.locator(".card-interactive").first().click();
  await page.waitForSelector("text=Press Enter to continue", { timeout: 15000 });
  if (round === 0) await page.screenshot({ path: `${shots}/06-quiz-question.png`, fullPage: true });
  // Try to answer correctly-ish: just click first selectable option / button, or press submit paths
  const mcOption = page.locator("button", { hasText: /^[A-D]\)/ });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/07-quiz-finished.png`, fullPage: true });
log("quiz finished captured");

// 5. Leagues: create one
await page.goto(`${BASE}/leagues`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.fill('input[placeholder="e.g. Office Champions"]', "Verify League");
await page.click('button:has-text("Create league")');
await page.waitForURL(/\/leagues\/[A-Z0-9]+/, { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/08-league-detail.png`, fullPage: true });
log("league created + detail captured");

// Post comment
await page.fill('input[placeholder="Say something to the league…"]', "Great round everyone!");
await page.click('button:has-text("Post")');
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/09-league-comment.png`, fullPage: true });
log("comment posted");

// React
const reactionButtons = page.locator("button", { hasText: "🔥" });
if (await reactionButtons.count()) {
  await reactionButtons.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shots}/10-league-reaction.png`, fullPage: true });
  log("reaction toggled");
}

await browser.close();
log("done");

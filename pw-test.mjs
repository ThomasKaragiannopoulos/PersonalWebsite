import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const QUERY = "Which wineries in Naoussa are known for Xinomavro?";
const TIMEOUT = 60_000;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[browser error]", msg.text());
});
page.on("pageerror", (err) => console.log("[page error]", err.message));

console.log("→ navigating to /pp2/query");
await page.goto(`${BASE}/pp2/query`, { waitUntil: "networkidle" });

console.log("→ filling query");
await page.fill("textarea", QUERY);

console.log("→ clicking Ask");
await page.click("button:has-text('Ask')");

console.log("→ waiting for agent trace to complete (evaluate node done)...");
try {
  // Wait for the evaluate node to turn done (accent colour border appears)
  await page.waitForSelector(
    "text=Evaluate",
    { timeout: TIMEOUT }
  );

  // Wait for "Running…" to disappear
  await page.waitForFunction(
    () => !document.body.innerText.includes("Running…"),
    { timeout: TIMEOUT }
  );

  console.log("→ done. capturing state...");

  const answerText = await page.locator("text=Answer").locator("..").locator("p").first().textContent();
  console.log("[answer snippet]", answerText?.slice(0, 120));

  const evalSection = await page.locator("text=Eval scores").count();
  console.log("[eval scores visible]", evalSection > 0);

  const chunksSection = await page.locator("text=Retrieved chunks").count();
  console.log("[chunks visible]", chunksSection > 0);

  const errorVisible = await page.locator("text=error").count();
  console.log("[error visible]", errorVisible > 0);

  // Screenshot
  await page.screenshot({ path: "pw-screenshot.png", fullPage: true });
  console.log("→ screenshot saved: pw-screenshot.png");
} catch (err) {
  console.log("[TIMEOUT/ERROR]", err.message);
  await page.screenshot({ path: "pw-screenshot-error.png", fullPage: true });

  // Dump page text for debugging
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("[page text]\n", bodyText.slice(0, 2000));
}

await browser.close();

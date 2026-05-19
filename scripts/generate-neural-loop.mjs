import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "public", "neural-loop.mp4");
const htmlPath = path.join(__dirname, "neural-loop-renderer.html");

const width = 1280;
const height = 720;
const fps = 30;
const durationSeconds = 30;
const totalFrames = fps * durationSeconds;

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

async function main() {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const html = await readFile(htmlPath, "utf8");
  const framesDir = await mkdtemp(path.join(tmpdir(), "neural-loop-frames-"));

  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--use-angle=swiftshader",
        "--use-gl=angle",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
      ],
    });
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    page.on("pageerror", (error) => {
      console.error("Page error:", error.message);
    });

    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() => typeof window.drawFrame === "function");

    for (let frame = 0; frame < totalFrames; frame += 1) {
      await page.evaluate((frameNumber) => {
        window.drawFrame(frameNumber);
      }, frame);

      const framePath = path.join(framesDir, `frame-${String(frame).padStart(4, "0")}.png`);
      await page.screenshot({ path: framePath });

      if ((frame + 1) % 60 === 0) {
        console.log(`Captured ${frame + 1}/${totalFrames} frames`);
      }
    }

    await browser.close();

    await runFfmpeg([
      "-y",
      "-framerate",
      String(fps),
      "-i",
      path.join(framesDir, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    console.log(`Generated ${outputPath}`);
  } finally {
    await rm(framesDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

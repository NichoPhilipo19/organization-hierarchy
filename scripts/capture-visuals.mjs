/**
 * Capture visuals for the README: docs/demo.png (hero), docs/demo-dirty.png,
 * and interaction GIF frames → docs/frames/*.png (assembled into a GIF via ffmpeg).
 * Run `vite build --base=./` first, then `node scripts/capture-visuals.mjs`.
 */

import { mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
mkdirSync(resolve(root, 'docs/frames'), { recursive: true });
const out = (f) => resolve(root, 'docs', f);

// Tiny static server — ES modules don't work via file://
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const path = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const body = readFileSync(resolve(root, `dist${path}`));
    res.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();

// ---- Hero PNG (retina) ----
{
  const page = await browser.newPage({
    viewport: { width: 2360, height: 980 },
    deviceScaleFactor: 1.5,
  });
  await page.goto(url);
  await page.waitForSelector('[role="tree"]');
  await page.screenshot({ path: out('demo.png') });

  // Dirty data PNG
  await page.getByRole('button', { name: /dataset kotor/i }).click();
  await page
    .getByRole('button', { name: /expand all$/i })
    .first()
    .click();
  await page.waitForSelector('[role="alert"]');
  await page.screenshot({ path: out('demo-dirty.png') });
  await page.close();
}

// ---- Interaction GIF frames ----
{
  const page = await browser.newPage({
    viewport: { width: 1100, height: 660 },
    deviceScaleFactor: 1,
  });
  await page.goto(url);
  await page.waitForSelector('[role="tree"]');
  let i = 0;
  const snap = async (times = 1) => {
    for (let t = 0; t < times; t++) {
      await page.screenshot({
        path: out(`frames/f${String(i++).padStart(2, '0')}.png`),
      });
    }
  };

  await snap(2); // initial: depth 2
  // expand one branch via the toggle badge (programmatic click — the chart is wide,
  // the element may be outside the viewport)
  const clickToggle = () =>
    page
      .locator('button[aria-label^="Expand"]')
      .first()
      .evaluate((el) => el.click());
  await clickToggle();
  await snap();
  await clickToggle();
  await snap();
  // expand all
  await page.getByRole('button', { name: /^expand all$/i }).click();
  await snap(2);
  // search + highlight — scroll to the first hit so the ring is visible
  await page.getByPlaceholder(/cari nama/i).fill('lead');
  await page
    .locator('[aria-selected="true"]')
    .first()
    .evaluate((el) => {
      // manually scroll the chart's overflow:auto container so the highlighted node
      // ends up centered, without scrolling the control bar out of view
      let c = el.parentElement;
      while (
        c &&
        !(c.scrollWidth > c.clientWidth && /(auto|scroll)/.test(getComputedStyle(c).overflowX))
      )
        c = c.parentElement;
      if (c) {
        const r = el.getBoundingClientRect();
        const cr = c.getBoundingClientRect();
        c.scrollLeft += r.left - cr.left - cr.width / 2 + r.width / 2;
      }
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
  await snap(2);
  await page.getByPlaceholder(/cari nama/i).fill('');
  // zoom & pan
  await page.getByLabel(/zoom & pan/i).check();
  await snap();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await snap(2);
  // pan drag — use the viewport's center point (the chart can be wider than the screen)
  const size = page.viewportSize();
  const cx = size.width / 2;
  const cy = size.height / 2 + 100; // in the chart area, not the control bar
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 140, cy + 60, { steps: 8 });
  await page.mouse.up();
  await snap(2);
  await page.close();
}

await browser.close();
server.close();
console.log('OK — visuals captured');

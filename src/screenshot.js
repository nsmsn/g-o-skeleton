// import puppeteer from "puppeteer";
// Instead of importing puppeteer directly, it seems that for Netlify we need to
// use Puppeteer via chrome-aws-lambda. See
// https://levelup.gitconnected.com/using-puppeteer-on-netlify-e2d3801893c2
import chromium from "chrome-aws-lambda";
const puppeteer = chromium.puppeteer;

let browserPromise;
let instanceCount = 0;

export default async function screenshot(html, options = {}) {
  // Try to share browser instances across multiple calls.
  instanceCount++;
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: "new",
    });
  }
  const browser = await browserPromise;

  // Create the page for the screenshot.
  const page = await browser.newPage();
  const pageHeight = options.height || 768;
  const pageWidth = options.width || 1024;
  await page.setContent(html);
  await page.setViewport({
    deviceScaleFactor: 2, // To render retina images
    height: pageHeight,
    width: pageWidth,
  });

  // Get the height and width of the body.
  const { bodyHeight, bodyWidth } = await page.evaluate(() => {
    return {
      bodyHeight: document.body.offsetHeight,
      bodyWidth: document.body.offsetWidth,
    };
  });

  // Take the screenshot.
  const buffer = await page.screenshot({
    clip: {
      height: bodyHeight,
      width: bodyWidth,
      x: 0,
      y: 0,
    },
  });

  // If we're the last active instance, close the browser.
  instanceCount--;
  if (instanceCount === 0) {
    browserPromise = null;
    try {
      await browser.close();
    } catch (e) {
      // Another instance may have closed the browser before we could.
    }
  }

  return buffer;
}

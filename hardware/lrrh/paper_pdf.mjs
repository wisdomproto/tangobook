// out/paper_sheet.html → out/paper_sheet.pdf (A4, 실제 크기). 크롬은 packages/client 의 puppeteer 로 띄운다.
import { createRequire } from 'node:module'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(HERE, '../../packages/client/package.json'));
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer')).href)).default;
const browser = await puppeteer.launch({ headless: true, channel: 'chrome' }).catch(() => puppeteer.launch({ headless: true }));
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(HERE, 'out', 'paper_sheet.html')).href, { waitUntil: 'load' });
await page.pdf({ path: path.join(HERE, 'out', 'paper_sheet.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close(); console.log('pdf → out/paper_sheet.pdf');

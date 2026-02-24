#!/usr/bin/env node
// Generate brochure PDFs using puppeteer-core + system Chrome
// Prerequisites: npm install puppeteer-core
// Usage: npx http-server . -p 8080 & node generate-pdf.js

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:8080';

const PORTRAIT = { paperWidth: 8.27, paperHeight: 11.69, marginTop: 0.35, marginBottom: 0.35, marginLeft: 0.43, marginRight: 0.43 };
const LANDSCAPE = { landscape: true, paperWidth: 11.69, paperHeight: 8.27, marginTop: 0.31, marginBottom: 0.31, marginLeft: 0.39, marginRight: 0.39 };

const TARGETS = [
    // Standard brochure
    { url: '/brochure.html',            out: 'asset',           name: 'brochure-ja.pdf',                    opts: PORTRAIT },
    { url: '/brochure.html?landscape=1', out: 'asset',          name: 'brochure-ja-landscape.pdf',          opts: LANDSCAPE },
    { url: '/brochure-en.html',          out: 'asset',          name: 'brochure-en.pdf',                    opts: PORTRAIT },
    { url: '/brochure-en.html?landscape=1', out: 'asset',       name: 'brochure-en-landscape.pdf',          opts: LANDSCAPE },
    // Wedding brochure
    { url: '/alliance/brochure-wedding.html',            out: 'alliance/asset', name: 'brochure-wedding.pdf',               opts: PORTRAIT },
    { url: '/alliance/brochure-wedding.html?landscape=1', out: 'alliance/asset', name: 'brochure-wedding-landscape.pdf',     opts: LANDSCAPE },
    { url: '/alliance/brochure-wedding-en.html',          out: 'alliance/asset', name: 'brochure-wedding-en.pdf',            opts: PORTRAIT },
    { url: '/alliance/brochure-wedding-en.html?landscape=1', out: 'alliance/asset', name: 'brochure-wedding-en-landscape.pdf', opts: LANDSCAPE },
];

async function generatePDF(page, url, outDir, filename, opts) {
    await page.goto(url, { waitUntil: 'networkidle0' });
    var client = await page.createCDPSession();
    var result = await client.send('Page.printToPDF', Object.assign({ printBackground: true }, opts));
    var outPath = path.join(__dirname, outDir, filename);
    fs.writeFileSync(outPath, Buffer.from(result.data, 'base64'));
    console.log('Generated:', outDir + '/' + filename, '(' + fs.statSync(outPath).size + ' bytes)');
}

(async () => {
    var browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
    var page = await browser.newPage();

    for (var t of TARGETS) {
        await generatePDF(page, BASE + t.url, t.out, t.name, t.opts);
    }

    await browser.close();
    console.log('Done — ' + TARGETS.length + ' PDFs generated');
})();

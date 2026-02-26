#!/usr/bin/env node
// Generate brochure PDFs using puppeteer-core + system Chrome
// Prerequisites: npm install puppeteer-core
// Usage: npx http-server . -p 8080 & node generate-pdf.js

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:8080';

async function generatePDF(page, url, outDir, filename, opts) {
    await page.goto(url, { waitUntil: 'networkidle0' });
    if (opts.landscape) {
        await page.evaluate(() => {
            var s = document.getElementById('landscape-page-style');
            if (s) s.media = 'all';
            document.body.classList.add('landscape-mode');
        });
    }
    var client = await page.createCDPSession();
    var result = await client.send('Page.printToPDF', Object.assign({ printBackground: true }, opts));
    await client.detach();
    var outPath = path.join(__dirname, outDir, filename);
    fs.writeFileSync(outPath, Buffer.from(result.data, 'base64'));
    console.log('Generated:', outDir + '/' + filename, '(' + fs.statSync(outPath).size + ' bytes)');
}

(async () => {
    var browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
    var page = await browser.newPage();

    // Standard brochure — JA
    await generatePDF(page, BASE + '/brochure.html', 'asset', 'brochure-ja.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0.35, marginBottom: 0.35, marginLeft: 0.43, marginRight: 0.43,
    });
    await generatePDF(page, BASE + '/brochure.html?landscape=1', 'asset', 'brochure-ja-landscape.pdf', {
        landscape: true,
        paperWidth: 11.69, paperHeight: 8.27,
        marginTop: 0.31, marginBottom: 0.31, marginLeft: 0.39, marginRight: 0.39,
    });

    // Standard brochure — EN
    await generatePDF(page, BASE + '/brochure-en.html', 'asset', 'brochure-en.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0.35, marginBottom: 0.35, marginLeft: 0.43, marginRight: 0.43,
    });
    await generatePDF(page, BASE + '/brochure-en.html?landscape=1', 'asset', 'brochure-en-landscape.pdf', {
        landscape: true,
        paperWidth: 11.69, paperHeight: 8.27,
        marginTop: 0.31, marginBottom: 0.31, marginLeft: 0.39, marginRight: 0.39,
    });

    // Wedding brochure — JA
    await generatePDF(page, BASE + '/alliance/brochure-wedding.html', 'alliance/asset', 'brochure-wedding.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0.35, marginBottom: 0.35, marginLeft: 0.43, marginRight: 0.43,
    });
    await generatePDF(page, BASE + '/alliance/brochure-wedding.html?landscape=1', 'alliance/asset', 'brochure-wedding-landscape.pdf', {
        landscape: true,
        paperWidth: 11.69, paperHeight: 8.27,
        marginTop: 0.31, marginBottom: 0.31, marginLeft: 0.39, marginRight: 0.39,
    });

    // Wedding brochure — EN
    await generatePDF(page, BASE + '/alliance/brochure-wedding-en.html', 'alliance/asset', 'brochure-wedding-en.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0.35, marginBottom: 0.35, marginLeft: 0.43, marginRight: 0.43,
    });
    await generatePDF(page, BASE + '/alliance/brochure-wedding-en.html?landscape=1', 'alliance/asset', 'brochure-wedding-en-landscape.pdf', {
        landscape: true,
        paperWidth: 11.69, paperHeight: 8.27,
        marginTop: 0.31, marginBottom: 0.31, marginLeft: 0.39, marginRight: 0.39,
    });

    // Partnership proposal — JA
    await generatePDF(page, BASE + '/partnership.html', '.', 'tokistorage-partnership-deck.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    // Partnership proposal — EN
    await generatePDF(page, BASE + '/partnership-en.html', '.', 'tokistorage-partnership-deck-en.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    // Government proposal — JA
    await generatePDF(page, BASE + '/government-proposal.html', '.', 'government-proposal.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    // Government proposal — EN
    await generatePDF(page, BASE + '/government-proposal-en.html', '.', 'government-proposal-en.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    // Government templates
    await generatePDF(page, BASE + '/government-template-overview.html', '.', 'government-template-overview.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });
    await generatePDF(page, BASE + '/government-template-estimate.html', '.', 'government-template-estimate.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });
    await generatePDF(page, BASE + '/government-template-specification.html', '.', 'government-template-specification.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });
    await generatePDF(page, BASE + '/government-template-proposal.html', '.', 'government-template-proposal.pdf', {
        paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    // Tech deck — JA
    await generatePDF(page, BASE + '/tech-deck.html', 'asset', 'tech-deck-ja.pdf', {
        landscape: true,
        paperWidth: 11.69, paperHeight: 8.27,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    // Tech deck — EN
    await generatePDF(page, BASE + '/tech-deck-en.html', 'asset', 'tech-deck-en.pdf', {
        landscape: true,
        paperWidth: 11.69, paperHeight: 8.27,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });

    await browser.close();
    console.log('Done — 18 PDFs generated');
})();

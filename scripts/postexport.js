#!/usr/bin/env node
/**
 * Post-export script: injects favicon + PWA meta tags into dist/index.html
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');
const faviconSrc = path.join(__dirname, '..', 'assets', 'favicon.svg');
const faviconDest = path.join(distDir, 'favicon.svg');

// 1. Copy favicon.svg to dist/
fs.copyFileSync(faviconSrc, faviconDest);

// 2. Inject <link> tags into index.html
let html = fs.readFileSync(htmlPath, 'utf8');

const inject = `
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    <meta name="theme-color" content="#059669" />
    <meta name="description" content="개인 수입 활동 트래커" />
    <meta property="og:title" content="CashNote" />
    <meta property="og:description" content="수입 활동을 기록하고 분석하세요" />`;

html = html.replace('</head>', inject + '\n  </head>');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ postexport: favicon + meta tags injected');

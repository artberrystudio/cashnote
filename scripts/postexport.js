#!/usr/bin/env node
/**
 * Post-export script
 * 1. dist/index.html 에 favicon + meta tags 주입
 * 2. dist/ → .vercel/output/static/ 전체 복사
 * 3. .vercel/output/config.json 에 SPA fallback rewrite 작성
 */
const fs   = require('fs');
const path = require('path');

const root            = path.join(__dirname, '..');
const distDir         = path.join(root, 'dist');
const vercelStaticDir = path.join(root, '.vercel', 'output', 'static');
const vercelConfigPath= path.join(root, '.vercel', 'output', 'config.json');
const htmlPath        = path.join(distDir, 'index.html');
const faviconSrc      = path.join(root, 'assets', 'favicon.svg');
const faviconDest     = path.join(distDir, 'favicon.svg');

// ── 1. favicon 복사 + meta 주입 ──────────────────────────────
fs.copyFileSync(faviconSrc, faviconDest);

let html = fs.readFileSync(htmlPath, 'utf8');
const inject = `
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    <meta name="theme-color" content="#059669" />
    <meta name="description" content="개인 수입 활동 트래커" />
    <meta property="og:title" content="CashNote" />
    <meta property="og:description" content="수입 활동을 기록하고 분석하세요" />`;

// 이미 주입된 경우 중복 방지
if (!html.includes('favicon.svg')) {
  html = html.replace('</head>', inject + '\n  </head>');
}
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ [1/3] favicon + meta tags injected');

// ── 2. dist/ → .vercel/output/static/ 전체 복사 ───────────────
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
// 기존 static 디렉토리 초기화 후 복사
if (fs.existsSync(vercelStaticDir)) {
  fs.rmSync(vercelStaticDir, { recursive: true, force: true });
}
copyDir(distDir, vercelStaticDir);
console.log('✅ [2/3] dist/ → .vercel/output/static/ copied');

// ── 3. Vercel config (SPA fallback) 작성 ──────────────────────
fs.mkdirSync(path.join(root, '.vercel', 'output'), { recursive: true });
fs.writeFileSync(
  vercelConfigPath,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2
  ),
  'utf8'
);
console.log('✅ [3/3] .vercel/output/config.json written');
console.log('\n🚀 Ready to deploy with: npx vercel deploy --prebuilt --prod --yes');

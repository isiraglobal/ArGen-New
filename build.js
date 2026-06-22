#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ArGen Extension Build Script
// Usage:
//   node build.js chrome    → dist/argen-chrome/  + dist/argen-chrome.zip
//   node build.js firefox   → dist/argen-firefox/ + dist/argen-firefox.zip
//   node build.js all       → both
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC = path.join(__dirname, 'extension');
const DIST = path.join(__dirname, 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildChrome() {
  const outDir = path.join(DIST, 'argen-chrome');
  console.log(`\n📦 Building Chrome/Edge/Brave (MV3) → ${outDir}`);

  // Clean & copy
  fs.rmSync(outDir, { recursive: true, force: true });
  copyDir(SRC, outDir);

  // Remove Firefox-only manifest
  fs.rmSync(path.join(outDir, 'manifest.firefox.json'), { force: true });

  // Verify manifest.json is MV3
  const mf = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  if (mf.manifest_version !== 3) {
    throw new Error('manifest.json must be MV3 for Chrome build');
  }

  console.log(`  ✅ manifest_version: ${mf.manifest_version}`);
  console.log(`  ✅ name: ${mf.name} v${mf.version}`);
  console.log(`  ✅ permissions: ${mf.permissions.join(', ')}`);

  // Zip
  const zipPath = path.join(DIST, 'argen-chrome.zip');
  try {
    execSync(`cd "${outDir}" && zip -rq "${zipPath}" .`);
    console.log(`  📦 Zipped → ${zipPath}`);
  } catch (e) {
    console.log(`  ⚠️  zip not available — skipping zip (load unpacked from ${outDir})`);
  }

  console.log(`  ✅ Chrome build complete!`);
}

function buildFirefox() {
  const outDir = path.join(DIST, 'argen-firefox');
  console.log(`\n🦊 Building Firefox (MV2) → ${outDir}`);

  // Clean & copy
  fs.rmSync(outDir, { recursive: true, force: true });
  copyDir(SRC, outDir);

  // Replace manifest.json with Firefox variant
  const ffManifest = path.join(outDir, 'manifest.firefox.json');
  const mainManifest = path.join(outDir, 'manifest.json');
  if (!fs.existsSync(ffManifest)) {
    throw new Error('manifest.firefox.json not found in extension/');
  }
  fs.copyFileSync(ffManifest, mainManifest);
  fs.rmSync(ffManifest);

  const mf = JSON.parse(fs.readFileSync(mainManifest, 'utf8'));
  console.log(`  ✅ manifest_version: ${mf.manifest_version}`);
  console.log(`  ✅ name: ${mf.name} v${mf.version}`);

  // Add Firefox browser_specific_settings if not present
  if (!mf.browser_specific_settings) {
    mf.browser_specific_settings = {
      gecko: {
        id: 'argen-tracker@argen.ai',
        strict_min_version: '89.0'
      }
    };
    fs.writeFileSync(mainManifest, JSON.stringify(mf, null, 2));
    console.log(`  ✅ Added browser_specific_settings (gecko)`);
  }

  // Zip
  const zipPath = path.join(DIST, 'argen-firefox.zip');
  try {
    execSync(`cd "${outDir}" && zip -rq "${zipPath}" .`);
    console.log(`  📦 Zipped → ${zipPath}`);
  } catch (e) {
    console.log(`  ⚠️  zip not available — skipping zip (load unpacked from ${outDir})`);
  }

  console.log(`  ✅ Firefox build complete!`);
}

// ── Entrypoint ────────────────────────────────────────────────────────────────
const target = process.argv[2] || 'chrome';

if (!fs.existsSync(SRC)) {
  console.error(`❌ extension/ directory not found at ${SRC}`);
  process.exit(1);
}

if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

console.log('🚀 ArGen Extension Builder');
console.log('──────────────────────────');

if (target === 'all') {
  buildChrome();
  buildFirefox();
} else if (target === 'chrome') {
  buildChrome();
} else if (target === 'firefox') {
  buildFirefox();
} else {
  console.error(`❌ Unknown target "${target}". Use: chrome, firefox, or all`);
  process.exit(1);
}

console.log('\n✅ Build complete! To load in browser:');
if (target === 'chrome' || target === 'all') {
  console.log('  Chrome: chrome://extensions → Developer mode → Load unpacked → dist/argen-chrome/');
}
if (target === 'firefox' || target === 'all') {
  console.log('  Firefox: about:debugging → This Firefox → Load Temporary Add-on → dist/argen-firefox/manifest.json');
}

// Copies non-TypeScript renderer assets (html, css) into dist/ after tsc runs,
// since tsc only emits compiled .js files.
const fs = require("node:fs");
const path = require("node:path");

const srcDir = path.join(__dirname, "..", "src", "renderer");
const outDir = path.join(__dirname, "..", "dist", "renderer");

fs.mkdirSync(outDir, { recursive: true });

for (const file of fs.readdirSync(srcDir)) {
  if (file.endsWith(".ts")) continue;
  fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
}

console.log("[copy-assets] renderer assets copied to dist/renderer");

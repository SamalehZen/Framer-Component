#!/usr/bin/env node
// Build a component demo: bundles demo/main.tsx, copies index.html and assets.
// Usage: node scripts/build-demo.mjs fan-carousel
import { build } from "esbuild";
import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const name = process.argv[2];
if (!name) {
  console.error("usage: node scripts/build-demo.mjs <component-name>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "components", name, "demo");
const dist = path.join(dir, "dist");

if (!existsSync(path.join(dir, "main.tsx"))) {
  console.error("demo introuvable:", dir);
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [path.join(dir, "main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  external: ["assets/*"],
  define: { "process.env.NODE_ENV": "'production'" },
  outfile: path.join(dist, "app.js"),
  logLevel: "warning",
});

copyFileSync(path.join(dir, "index.html"), path.join(dist, "index.html"));
const assets = path.join(dir, "assets");
if (existsSync(assets)) cpSync(assets, path.join(dist, "assets"), { recursive: true });

console.log("demo construite -> " + path.relative(root, dist));

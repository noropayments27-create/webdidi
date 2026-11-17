#!/usr/bin/env node
/**
 * Nitro's Vercel output externalizes PGlite into the function's _libs folder.
 * Its Emscripten payloads are resolved relative to that package at runtime.
 * Ensure the binary payloads are physically present in the function bundle.
 */
import { copyFile, mkdir, readdir, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryUrl = import.meta.resolve("@electric-sql/pglite");
const packageDist = dirname(fileURLToPath(entryUrl));
const assets = ["pglite.data", "pglite.wasm", "initdb.wasm"];

const outputFunctions = join(root, ".vercel", "output", "functions");
const functionEntries = await readdir(outputFunctions, { withFileTypes: true });
const serverFunction = functionEntries.find(
  (entry) => entry.isDirectory() && entry.name.endsWith(".func"),
);
if (!serverFunction) {
  throw new Error("Vercel server function output was not found under .vercel/output/functions");
}

const libsDir = join(outputFunctions, serverFunction.name, "_libs");
await mkdir(libsDir, { recursive: true });

for (const asset of assets) {
  const source = join(packageDist, asset);
  const destination = join(libsDir, asset);
  await copyFile(source, destination);
  console.log(`[pglite-assets] copied ${asset} -> ${destination}`);
}

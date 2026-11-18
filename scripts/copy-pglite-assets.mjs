#!/usr/bin/env node
/**
 * Nitro externalizes PGlite into one or more Vercel function bundles.
 * Copy the WASM payloads into EVERY function bundle, not just the first one:
 * Vercel may split server handlers into multiple .func directories.
 */
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryUrl = import.meta.resolve("@electric-sql/pglite");
const packageDist = dirname(fileURLToPath(entryUrl));
const assets = ["pglite.data", "pglite.wasm", "initdb.wasm"];
const outputFunctions = join(root, ".vercel", "output", "functions");
const functionEntries = await readdir(outputFunctions, { withFileTypes: true });
const serverFunctions = functionEntries.filter(
  (entry) => entry.isDirectory() && entry.name.endsWith(".func"),
);

if (serverFunctions.length === 0) {
  throw new Error("Vercel server function output was not found under .vercel/output/functions");
}

for (const serverFunction of serverFunctions) {
  const libsDir = join(outputFunctions, serverFunction.name, "_libs");
  await mkdir(libsDir, { recursive: true });
  for (const asset of assets) {
    const source = join(packageDist, asset);
    const destination = join(libsDir, asset);
    await copyFile(source, destination);
    console.log(`[pglite-assets] copied ${asset} -> ${destination}`);
  }
}

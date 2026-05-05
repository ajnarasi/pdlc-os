#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const tsxBin = resolve(here, "..", "node_modules", ".bin", "tsx");
const entry = resolve(here, "..", "src", "index.ts");

const result = spawnSync(tsxBin, [entry, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);

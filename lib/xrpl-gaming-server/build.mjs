// esbuild bundle for the CLI binary (src/cli.ts -> dist/cli.js).
//
// Why bundle the CLI when tsc already emits dist/cli.js?
//   The CLI uses pino with the pino-pretty transport, which pino spawns in a
//   worker thread by dynamic require at runtime. esbuild-plugin-pino rewrites
//   those requires so the transport entry points are co-located with the
//   bundled output, and bundling lets us inline pino-pretty so consumers
//   running `npx xrpl-gaming-server` don't need it as a runtime dep.
//
// This script must run AFTER `tsc -p tsconfig.json`. tsc populates dist/ with
// the lib surface (`createServer`, schemas, routers, .d.ts files). esbuild
// then overwrites dist/cli.js with a self-contained bundle. Both worlds
// coexist: programmatic users get the tsc-emitted dist/index.js, CLI users
// get the bundled dist/cli.js.

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";

globalThis.require = createRequire(import.meta.url);

const pkgDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(pkgDir, "dist");

await esbuild({
  entryPoints: [path.resolve(pkgDir, "src/cli.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: distDir,
  allowOverwrite: true,
  logLevel: "info",
  external: [
    "*.node",
    "pg-native",
    "bufferutil",
    "utf-8-validate",
  ],
  sourcemap: "linked",
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __cr } from 'node:module';
import __p from 'node:path';
import __u from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __u.fileURLToPath(import.meta.url);
globalThis.__dirname = __p.dirname(globalThis.__filename);
`,
  },
});

// Ensure the bin is executable when packed (npm preserves the mode).
import { chmodSync } from "node:fs";
chmodSync(path.resolve(distDir, "cli.js"), 0o755);

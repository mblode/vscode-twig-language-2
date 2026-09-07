import * as esbuild from "esbuild";
const options = {
  entryPoints: {
    index: "src/extension.js",
    formatter: "src/formatter/worker.js",
  },
  outdir: "extension",
  bundle: true,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  target: "node18",
  external: ["vscode"],
  legalComments: "linked",
  logLevel: "info",
};
if (process.argv.includes("--watch")) {
  const context = await esbuild.context(options);
  await context.watch();
} else await esbuild.build(options);

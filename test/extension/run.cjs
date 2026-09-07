const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { runTests } = require("@vscode/test-electron");
const workspace = fs.mkdtempSync(
  path.join(os.tmpdir(), "twig-extension-test-"),
);
runTests({
  version: process.env.VSCODE_VERSION || "1.85.2",
  extensionDevelopmentPath:
    process.env.TWIG_EXTENSION_PATH || path.resolve(__dirname, "../.."),
  extensionTestsPath: path.resolve(__dirname, "suite.cjs"),
  launchArgs: [
    workspace,
    "--disable-extensions",
    "--disable-workspace-trust",
    "--skip-welcome",
    "--skip-release-notes",
    "--no-sandbox",
  ],
}).then(
  () => fs.rmSync(workspace, { recursive: true, force: true }),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);

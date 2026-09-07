"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
test("provider discards stale results, cancels superseded requests and releases workers", async () => {
  let provider;
  const requests = [];
  const settings = { formatting: true };
  const vscode = {
    workspace: {
      getConfiguration: () => ({
        get: (key, fallback) => settings[key] ?? fallback,
      }),
      asRelativePath: () => "test.twig",
    },
    window: {
      createOutputChannel: () => ({ appendLine() {}, dispose() {} }),
      setStatusBarMessage() {},
    },
    languages: {
      registerDocumentFormattingEditProvider: (_, p) => {
        provider = p;
        return { dispose() {} };
      },
      registerDocumentRangeFormattingEditProvider: () => ({ dispose() {} }),
      registerHoverProvider: () => ({ dispose() {} }),
    },
    EndOfLine: { CRLF: 2 },
    Position: class {
      constructor(line, character) {
        this.line = line;
        this.character = character;
      }
    },
    Range: class {
      constructor(start, end) {
        this.start = start;
        this.end = end;
      }
    },
    TextEdit: { replace: (range, text) => ({ range, text }) },
  };
  const service = {
    runFormatter() {
      let resolve;
      const request = {
        promise: new Promise((r) => {
          resolve = r;
        }),
        dispose() {
          request.cancelled = true;
          resolve([]);
        },
        resolve: (edits) => resolve(edits),
      };
      requests.push(request);
      return request;
    },
  };
  const context = { subscriptions: [], asAbsolutePath: (value) => value };
  const exports = {};
  const base = path.join(__dirname, "../src");
  vm.runInNewContext(fs.readFileSync(path.join(base, "extension.js"), "utf8"), {
    exports,
    require: (name) =>
      name === "./html"
        ? { registerHTML() {} }
        : name === "vscode"
          ? vscode
          : name === "./formatter/service"
            ? service
            : name.startsWith(".")
              ? require(path.join(base, name))
              : require(name),
  });
  exports.activate(context);
  const document = {
    uri: { fsPath: "/test.twig", toString: () => "file:///test.twig" },
    languageId: "twig",
    version: 1,
    eol: 1,
    getText: () => "{{x}}",
    positionAt: (x) => new vscode.Position(0, x),
  };
  const token = { isCancellationRequested: false };
  const options = { tabSize: 2, insertSpaces: true };
  const stale = provider.provideDocumentFormattingEdits(
    document,
    options,
    token,
  );
  document.version++;
  requests[0].resolve([{ start: 2, end: 3, text: " x " }]);
  assert.equal((await stale).length, 0);
  const previous = provider.provideDocumentFormattingEdits(
    document,
    options,
    token,
  );
  const latest = provider.provideDocumentFormattingEdits(
    document,
    options,
    token,
  );
  assert(requests[1].cancelled);
  assert.equal((await previous).length, 0);
  requests[2].resolve([{ start: 2, end: 3, text: " x " }]);
  assert.equal((await latest).length, 1);
  const closing = provider.provideDocumentFormattingEdits(
    document,
    options,
    token,
  );
  for (const subscription of context.subscriptions) subscription.dispose();
  assert.equal((await closing).length, 0);
  assert(requests[3].cancelled);
});

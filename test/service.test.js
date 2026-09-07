"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { runFormatter } = require("../src/formatter/service");
const { readOptions, matchesIgnore } = require("../src/formatter/settings");
const worker = path.resolve(__dirname, "../src/formatter/worker.js");
function cancellation() {
  let callback;
  return {
    isCancellationRequested: false,
    onCancellationRequested(fn) {
      callback = fn;
      return {
        dispose() {
          callback = null;
        },
      };
    },
    cancel() {
      this.isCancellationRequested = true;
      callback?.();
    },
  };
}
test("worker returns source edits and propagates lexical errors", async () => {
  assert((await runFormatter(worker, "{{value}}", {}).promise).length);
  await assert.rejects(
    runFormatter(worker, "{{unfinished", {}).promise,
    /Unclosed/,
  );
});
test("worker cancellation and disposal complete without edits", async () => {
  const token = cancellation();
  const request = runFormatter(
    worker,
    "<div>".repeat(10000),
    {},
    undefined,
    token,
  );
  token.cancel();
  assert.deepEqual(await request.promise, []);
  const second = runFormatter(worker, "{{x}}", {});
  second.dispose();
  assert.deepEqual(await second.promise, []);
  const already = cancellation();
  already.cancel();
  assert.deepEqual(
    await runFormatter(worker, "{{x}}", {}, undefined, already).promise,
    [],
  );
});
test("worker has a real timeout and preflight size limit", async () => {
  await assert.rejects(
    runFormatter(
      worker,
      "<script>" + "console.log(1);".repeat(10000) + "</script>",
      {},
      undefined,
      undefined,
      1,
    ).promise,
    /exceeded/,
  );
  await assert.rejects(
    runFormatter(worker, "x".repeat(2 * 1024 * 1024 + 1), {}).promise,
    /2 MiB/,
  );
});
test("editor indentation and explicit overrides are distinct", () => {
  const config = (values) => ({
    get: (key, fallback) => values[key] ?? fallback,
  });
  assert.equal(
    readOptions(config({}), { tabSize: 2, insertSpaces: true }).insertSpaces,
    true,
  );
  assert.equal(
    readOptions(config({ indentStyle: "tab", tabSize: 3 }), {
      tabSize: 2,
      insertSpaces: true,
    }).insertSpaces,
    false,
  );
  assert.equal(
    readOptions(config({ tabSize: 3 }), { tabSize: 2, insertSpaces: true })
      .tabSize,
    3,
  );
});
test("ignore globs match directories and normalized Windows paths without regex injection", () => {
  assert(matchesIgnore(["**/vendor/**"], ["vendor/a.twig"]));
  assert(matchesIgnore(["**/vendor/**"], ["C:\\project\\vendor\\a.twig"]));
  assert(matchesIgnore(["*.twig"], ["file.twig"]));
  assert(matchesIgnore(["a?.twig"], ["ab.twig"]));
  assert(!matchesIgnore(["a[1].twig"], ["a1.twig"]));
  assert(matchesIgnore(["a[1].twig"], ["a[1].twig"]));
  assert(!matchesIgnore(["*.twig"], ["nested/file.twig"]));
});

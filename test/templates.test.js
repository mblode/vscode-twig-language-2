"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  configEntries,
  registerTemplateCompletions,
  templateCandidates,
  templateReference,
  templateReferences,
  templateStringContext,
} = require("../src/templates");
test("template references cover tags, functions and arrays but not dynamic names", () => {
  const source = [
    '{% include("partials/_section_header.html.twig") %}',
    '{% extends request.ajax ? "base_ajax.html" : "base.html" %}',
    '{%- include ["a.twig", \'b.twig\'] ignore missing with {x: "hash.twig"} only -%}',
    '{{ include("fn.twig", {y: "arg.twig"}) }}{{ source("src.twig") }}{{ x.include("method.twig") }}',
    '{% from "macros.twig" import "macro" %}{% import "forms.html" as forms %}{% use "blocks.twig" with a as b %}',
    '{# {% include "comment.twig" %} #}{% verbatim %}{% include "raw.twig" %}{% endverbatim %}',
    '{% embed "embed.twig" %}{% endembed %}{% set y = include("dir/" ~ z) %}{{ include("#{z}.twig") }}',
    '<a href="plain.twig">{% include "@App/ns.twig" %}{% include "unclosed.twig"',
  ].join("\n");
  const refs = templateReferences(source);
  assert.deepEqual(
    refs.map((r) => r.name),
    [
      "partials/_section_header.html.twig",
      "base_ajax.html",
      "base.html",
      "a.twig",
      "b.twig",
      "fn.twig",
      "src.twig",
      "macros.twig",
      "forms.html",
      "blocks.twig",
      "embed.twig",
      "@App/ns.twig",
      "unclosed.twig",
    ],
  );
  for (const r of refs) assert.equal(source.slice(r.start, r.end), r.name);
});
test("template names resolve against roots, namespaces and Craft extensionless names", () => {
  const join = (base, name) => `${base}/${name}`;
  assert.deepEqual(
    templateCandidates("base.html.twig", ["/w/templates", "/w/doc"], {}, join),
    ["/w/templates/base.html.twig", "/w/doc/base.html.twig"],
  );
  assert.deepEqual(templateCandidates("_layout", ["/t"], {}, join), [
    "/t/_layout",
    "/t/_layout.twig",
    "/t/_layout.html.twig",
    "/t/_layout.html",
    "/t/_layout/index.twig",
    "/t/_layout/index.html",
  ]);
  assert.deepEqual(templateCandidates("./partials/x.twig", ["/t"], {}, join), [
    "/t/partials/x.twig",
  ]);
  assert.deepEqual(
    templateCandidates("@App/x.twig", ["/t"], { App: ["/ns", "/ns2"] }, join),
    ["/ns/x.twig", "/ns2/x.twig"],
  );
  assert.deepEqual(templateCandidates("@Unknown/x.twig", ["/t"], {}, join), []);
  assert.deepEqual(templateCandidates("", ["/t"], {}, join), []);
});
test("ide-twig namespace entries are filtered and references preserve nested paths", () => {
  assert.deepEqual(
    configEntries({
      namespaces: [
        { namespace: "Example", path: "templates" },
        { namespace: "", path: "templates/plain" },
        { path: "templates/default" },
        { namespace: null, path: "invalid" },
        { namespace: 1, path: "invalid" },
        { path: "" },
        null,
        { namespace: "Broken" },
      ],
    }),
    [
      { namespace: "Example", path: "templates" },
      { namespace: "", path: "templates/plain" },
      { path: "templates/default" },
    ],
  );
  assert.equal(
    templateReference(
      "Example",
      { path: "/project/templates" },
      { path: "/project/templates/content/card.html.twig" },
    ),
    "@Example/content/card.html.twig",
  );
  for (const namespace of [undefined, ""])
    assert.equal(
      templateReference(
        namespace,
        { path: "/project/templates" },
        { path: "/project/templates/content/card.html.twig" },
      ),
      "content/card.html.twig",
    );
});

test("template contexts cover Twig tags and functions", () => {
  for (const source of [
    '{% extends "@Example/la',
    "{% include '@Example/in",
    '{% embed "@Example/em',
    '{% import "@Example/im',
    '{% from "@Example/fr',
    '{% use "@Example/us',
    '{{ include("@Example/in',
    "{{ source('@Example/so",
    '{% set content = include("@Example/in',
    "{% if source('@Example/so",
  ]) {
    const context = templateStringContext(source, source.length);
    assert(context, source);
    assert.equal(
      source.slice(context.start, context.end),
      source.slice(source.lastIndexOf("@")),
    );
  }
});

test("template context rejects closed strings and arbitrary strings", () => {
  const closed = '{% include "@Example/x" %}';
  assert.equal(templateStringContext(closed, closed.length), undefined);
  const arbitrary = '{{ value("@Example/x';
  assert.equal(templateStringContext(arbitrary, arbitrary.length), undefined);
  for (const source of [
    '{# include("@Example/x',
    '{% include template %}<div class="@Example/x',
    '{% raw %}{% include "@Example/x',
    '{% verbatim %}{% include "@Example/x',
  ])
    assert.equal(
      templateStringContext(source, source.length),
      undefined,
      source,
    );
});

test("template replacement covers the whole path when the cursor is mid-string", () => {
  const source = '{% include "@Example/card.html.twig" %}';
  const offset = source.indexOf("card") + 2;
  const context = templateStringContext(source, offset);
  assert(context);
  assert.equal(
    source.slice(context.start, context.end),
    "@Example/card.html.twig",
  );
});

test("completion and navigation share fallback array and expression contexts", () => {
  for (const source of [
    '{% include ["@App/card.twig", "@App/default.twig"] %}',
    '{{ include(["@App/card.twig", "@App/default.twig"], {x: "ignored.twig"}) }}',
    '{% extends ajax ? "@App/card.twig" : "@App/default.twig" %}',
  ]) {
    const refs = templateReferences(source);
    assert.deepEqual(
      refs.map((ref) => ref.name),
      ["@App/card.twig", "@App/default.twig"],
    );
    for (const { start, end } of refs)
      assert.deepEqual(templateStringContext(source, start + 5), {
        start,
        end,
      });
  }
  for (const source of [
    '{% include ["@App/card.twig", "@App/de',
    '{{ include(["@App/card.twig", "@App/de',
  ]) {
    assert.deepEqual(templateStringContext(source, source.length), {
      start: source.lastIndexOf('"') + 1,
      end: source.length,
    });
  }
});

test("template parsing excludes dynamic strings, methods, comments and other arguments", () => {
  for (const source of [
    '{% include "@App/#{vars["name"]}.twig" %}',
    '{{ include("@App/#{vars["name"]}.twig") }}',
    '{% include "@App/#{vars["na',
    '{% include "@App/#{vars["name"]',
    '{% include "@App/" ~ name %}',
    '{{ object.include("@App/card.twig") }}',
    '{{ object.source("@App/card.twig") }}',
    '{{ $include("@App/card.twig") }}',
    "{{ \"include('@App/card.twig')\" }}",
    '{{ value # include("@App/card.twig")\n }}',
    '{% raw %}{% include "@App/card.twig" %}{% endraw %}',
    '{{ include(template, "@App/card.twig") }}',
    '{% include(template, "@App/card.twig") %}',
    '{% include template with {x: "@App/card.twig"} %}',
  ]) {
    assert.deepEqual(templateReferences(source), [], source);
    assert.equal(
      templateStringContext(source, source.indexOf("@App/") + 5),
      undefined,
      source,
    );
  }
});

test("unfinished strings never replace following markup or another Twig island", () => {
  for (const source of [
    '{% include "@App/ca %}<div class="example">',
    '{{ include("@App/ca }}<div class="example">',
    '{% include "@App/ca %}{% include "next.twig" %}',
  ]) {
    const offset = source.indexOf("@App/ca") + "@App/ca".length;
    const context = templateStringContext(source, offset);
    assert.deepEqual(context, {
      start: source.indexOf("@App/ca"),
      end: offset,
    });
    if (source.includes("example"))
      assert.equal(
        templateStringContext(source, source.indexOf("example") + 3),
        undefined,
      );
  }
});

function templateHarness(readFile, options = {}, testContext) {
  const folderUri = makeUri("/workspace");
  const folder = { uri: folderUri };
  const watchers = [];
  const subscriptions = [];
  const logs = [];
  let configured = "prod/ide-twig.json";
  let configurationChanged;
  let provider;
  const disposable = () => ({ dispose() {} });
  const vscode = {
    Uri: {
      joinPath: (base, child) => makeUri(path.posix.join(base.path, child)),
    },
    RelativePattern: class {
      constructor(base, pattern) {
        this.base = base;
        this.pattern = pattern;
      }
    },
    Range: class {
      constructor(start, end) {
        this.start = start;
        this.end = end;
      }
    },
    CompletionItem: class {
      constructor(label) {
        this.label = label;
      }
    },
    CompletionItemKind: { File: 0 },
    CompletionList: class {
      constructor(items) {
        this.items = items;
      }
    },
    workspace: {
      workspaceFolders: [folder],
      getConfiguration: (namespace) => {
        assert.equal(namespace, "test-extension");
        return {
          get: (_key, fallback) => configured ?? fallback,
        };
      },
      getWorkspaceFolder: () => folder,
      asRelativePath: (uri) => uri.path,
      fs: { readFile },
      findFiles:
        options.findFiles ||
        (async (pattern, exclude) => {
          assert.equal(exclude, null);
          return [makeUri(path.posix.join(pattern.base.path, "card.twig"))];
        }),
      createFileSystemWatcher(pattern) {
        const callbacks = { create: [], change: [], delete: [] };
        const watcher = {
          pattern,
          disposed: false,
          onDidCreate: (callback) => callbacks.create.push(callback),
          onDidChange: (callback) => callbacks.change.push(callback),
          onDidDelete: (callback) => callbacks.delete.push(callback),
          dispose() {
            this.disposed = true;
          },
          fire(event) {
            for (const callback of callbacks[event]) callback();
          },
        };
        watchers.push(watcher);
        return watcher;
      },
      onDidChangeConfiguration: (callback) => {
        configurationChanged = callback;
        return disposable();
      },
      onDidChangeWorkspaceFolders: disposable,
    },
    languages: {
      registerCompletionItemProvider: (_language, value) => {
        provider = value;
        return disposable();
      },
    },
  };
  const context = { subscriptions };
  registerTemplateCompletions(
    vscode,
    context,
    { appendLine: (line) => logs.push(line) },
    "test-extension",
  );
  const settle = async () => {
    for (let i = 0; i < 5; i++)
      await new Promise((resolve) => setImmediate(resolve));
  };
  let disposed = false;
  const harness = {
    watchers,
    logs,
    settle,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const subscription of subscriptions) subscription.dispose();
    },
    setConfig(value) {
      configured = value;
      configurationChanged({ affectsConfiguration: () => true });
    },
    complete() {
      const source = '{% include "';
      const document = {
        uri: makeUri("/workspace/test.twig"),
        getText: () => source,
        offsetAt: () => source.length,
        positionAt: (offset) => ({ offset }),
      };
      return provider
        .provideCompletionItems(
          document,
          { offset: source.length },
          { isCancellationRequested: false },
        )
        .items.map((item) => item.label);
    },
  };
  testContext?.after(harness.dispose);
  return harness;
}

function makeUri(uriPath) {
  return {
    path: uriPath,
    toString: () => `file://${uriPath}`,
    with: (changes) => makeUri(changes.path),
  };
}

test("configuration path changes replace its watcher and reload completions", async (t) => {
  const harness = templateHarness(
    async (uri) => {
      const namespace = uri.path.includes("dev") ? "Dev" : "Prod";
      return Buffer.from(
        JSON.stringify({
          namespaces: [{ namespace, path: "../templates" }],
        }),
      );
    },
    {},
    t,
  );
  await harness.settle();
  assert.deepEqual(harness.complete(), ["@Prod/card.twig"]);
  const prodWatcher = harness.watchers.find(
    (watcher) => watcher.pattern.pattern === "prod/ide-twig.json",
  );

  harness.setConfig("dev/ide-twig.json");
  await harness.settle();
  assert(prodWatcher.disposed);
  assert.deepEqual(harness.complete(), ["@Dev/card.twig"]);
  const devWatcher = harness.watchers.find(
    (watcher) => watcher.pattern.pattern === "dev/ide-twig.json",
  );

  harness.setConfig("");
  await harness.settle();
  assert(devWatcher.disposed);
  assert.deepEqual(harness.complete(), []);
});

test("path-only entries resolve relative to the config and share root watchers", async (t) => {
  let scans = 0;
  const harness = templateHarness(
    async () =>
      Buffer.from(
        JSON.stringify({
          namespaces: [
            { path: "../templates" },
            { namespace: "", path: "../templates" },
            { namespace: "App", path: "../templates" },
          ],
        }),
      ),
    {
      findFiles: async (pattern, exclude) => {
        scans++;
        assert.equal(exclude, null);
        return [makeUri(path.posix.join(pattern.base.path, "card.twig"))];
      },
    },
    t,
  );
  await harness.settle();
  assert.deepEqual(harness.complete(), ["card.twig", "@App/card.twig"]);
  assert.equal(scans, 1, "the shared template directory is scanned once");
  const roots = harness.watchers.filter(
    (watcher) => watcher.pattern.pattern === "**/*.twig",
  );
  assert.equal(roots.length, 1);
  assert.equal(roots[0].pattern.base.path, "/workspace/templates");
});

test("root watcher is replaced when its directory changes", async (t) => {
  let root = "../templates-one";
  const harness = templateHarness(
    async () =>
      Buffer.from(
        JSON.stringify({ namespaces: [{ namespace: "App", path: root }] }),
      ),
    {},
    t,
  );
  await harness.settle();
  const first = harness.watchers.find(
    (watcher) => watcher.pattern.pattern === "**/*.twig",
  );
  assert.equal(first.pattern.base.path, "/workspace/templates-one");

  root = "../templates-two";
  harness.watchers
    .find((watcher) => watcher.pattern.pattern === "prod/ide-twig.json")
    .fire("change");
  await harness.settle();

  const roots = harness.watchers.filter(
    (watcher) => watcher.pattern.pattern === "**/*.twig",
  );
  assert.equal(first.disposed, true);
  assert.equal(roots.filter((watcher) => !watcher.disposed).length, 1);
  assert.equal(roots.at(-1).pattern.base.path, "/workspace/templates-two");
});

test("failed directory scans are deduplicated without hiding readable roots", async (t) => {
  let scans = 0;
  const harness = templateHarness(
    async () =>
      Buffer.from(
        JSON.stringify({
          namespaces: [
            { path: "../unreadable" },
            { namespace: "Other", path: "../unreadable" },
            { namespace: "App", path: "../templates" },
          ],
        }),
      ),
    {
      findFiles: async (pattern) => {
        scans++;
        if (pattern.base.path.endsWith("/unreadable"))
          throw new Error("unreadable directory");
        return [makeUri(path.posix.join(pattern.base.path, "card.twig"))];
      },
    },
    t,
  );
  await harness.settle();
  assert.equal(scans, 2, "the failed shared directory is scanned only once");
  assert.deepEqual(harness.complete(), ["@App/card.twig"]);
  assert.equal(harness.logs.length, 1);
  assert.match(harness.logs[0], /unreadable directory/);
});

test("template scans preserve current completions and watchers across file events", async (t) => {
  const files = [makeUri("/workspace/templates/card.twig")];
  let blockNextScan = false;
  let releaseScan;
  const harness = templateHarness(
    async () =>
      Buffer.from(
        JSON.stringify({
          namespaces: [{ namespace: "Example", path: "../templates" }],
        }),
      ),
    {
      findFiles: async (pattern, exclude) => {
        assert.equal(exclude, null);
        const snapshot = files.filter((file) =>
          file.path.startsWith(`${pattern.base.path}/`),
        );
        if (blockNextScan) {
          blockNextScan = false;
          await new Promise((resolve) => (releaseScan = resolve));
        }
        return snapshot;
      },
    },
    t,
  );
  await harness.settle();
  assert.deepEqual(harness.complete(), ["@Example/card.twig"]);
  const rootWatchers = harness.watchers.filter(
    (watcher) => watcher.pattern.pattern === "**/*.twig",
  );
  assert.equal(rootWatchers.length, 1);
  const watcher = rootWatchers[0];

  blockNextScan = true;
  files.push(makeUri("/workspace/templates/first.twig"));
  watcher.fire("create");
  for (let i = 0; i < 5 && !releaseScan; i++)
    await new Promise((resolve) => setImmediate(resolve));
  assert(releaseScan, "the first refresh is waiting on its directory scan");
  assert.deepEqual(harness.complete(), ["@Example/card.twig"]);
  assert.equal(watcher.disposed, false);

  files.push(makeUri("/workspace/templates/second.twig"));
  watcher.fire("create");
  await harness.settle();
  releaseScan();
  await harness.settle();
  assert.deepEqual(harness.complete(), [
    "@Example/card.twig",
    "@Example/first.twig",
    "@Example/second.twig",
  ]);
  assert.equal(
    harness.watchers.filter(
      (entry) => entry.pattern.pattern === "**/*.twig" && !entry.disposed,
    ).length,
    1,
  );
});

test("stale configuration loads cannot publish results or create watchers", async (t) => {
  let resolveConfig;
  const harness = templateHarness(
    () => new Promise((resolve) => (resolveConfig = resolve)),
    {},
    t,
  );
  harness.setConfig("");
  resolveConfig(
    Buffer.from(
      JSON.stringify({
        namespaces: [{ namespace: "Stale", path: "../templates" }],
      }),
    ),
  );
  await harness.settle();
  assert.deepEqual(harness.complete(), []);
  assert.equal(
    harness.watchers.filter(
      (watcher) => watcher.pattern.pattern === "**/*.twig",
    ).length,
    0,
  );
});

test("disposing during a configuration read cannot recreate root watchers", async (t) => {
  let resolveConfig;
  const harness = templateHarness(
    () => new Promise((resolve) => (resolveConfig = resolve)),
    {},
    t,
  );
  harness.dispose();
  resolveConfig(
    Buffer.from(
      JSON.stringify({
        namespaces: [{ namespace: "Disposed", path: "../templates" }],
      }),
    ),
  );
  await harness.settle();
  assert.equal(
    harness.watchers.filter((watcher) => !watcher.disposed).length,
    0,
  );
});

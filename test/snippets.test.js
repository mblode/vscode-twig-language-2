"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../package.json");
const snippets = require("../src/snippets/snippets.json");
const {
  snippetList,
  customDefinitions,
  insideTwig,
} = require("../src/completions");
test("default snippets keep every prefix and body", () => {
  assert.deepEqual(
    snippetList(),
    Object.values(snippets).map(({ prefix, body, description }) => ({
      prefix,
      body,
      description,
    })),
  );
  assert(
    !manifest.contributes.snippets,
    "static snippets cannot honour settings",
  );
  for (const key of [
    "craftSnippets",
    "snippetQuotes",
    "templatePaths",
    "templateNamespaces",
    "customTests",
    "customFilters",
    "customFunctions",
  ])
    assert(
      manifest.contributes.configuration.properties[`${manifest.name}.${key}`],
      key,
    );
});
test("Twig 2 #80 / Twig 1 #19 Craft snippets can be disabled", () => {
  const core = snippetList(false).map((s) => s.prefix);
  for (const prefix of [
    "switch",
    "entries",
    "nav",
    "cache",
    "formlogin",
    "csrf",
    "paginate",
  ])
    assert(!core.includes(prefix), prefix);
  for (const prefix of [
    "if",
    "for",
    "include",
    "extends",
    "block",
    "macro",
    "with",
    "apply",
    "dump",
  ])
    assert(core.includes(prefix), prefix);
});
test("Twig 2 #63 / Twig 1 #50 single-quote snippets change Twig strings only", () => {
  const single = Object.fromEntries(
    snippetList(true, "single").map((s) => [s.prefix, s.body]),
  );
  assert.equal(single.inc, "{% include '${1:template}' %}$0");
  assert.equal(single.extends, "{% extends '${1:template}' %}$0");
  assert.equal(single.url, "url('${1:path}')$0");
  assert.match(
    single.asset,
    /<img src="\{\{ asset\.getUrl\('\$\{2:thumb\}'\) \}\}"/,
  );
  assert.match(single.inckv, /\$\{3:'\$\{4:value\}'\}/);
  for (const { prefix, body } of snippetList())
    assert(
      !/\{[{%][^}]*'/.test(body),
      `${prefix} uses double-quoted Twig strings by default`,
    );
});
test("custom definitions and Twig cursor context", () => {
  const settings = {
    customTests: { numeric: "Numeric value" },
    customFilters: { price: 1 },
  };
  assert.deepEqual(
    customDefinitions({ get: (key, fallback) => settings[key] ?? fallback }),
    [
      { name: "numeric", kind: "test", description: "Numeric value" },
      { name: "price", kind: "filter", description: "" },
    ],
  );
  assert(insideTwig("<p>{% if event.show_thumb"));
  assert(insideTwig("{{ a }}{{ b"));
  assert(!insideTwig("{% if a %}event.show_thumb"));
  assert(!insideTwig("<div>event.show_thumb"));
});

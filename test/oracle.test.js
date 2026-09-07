"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { format } = require("../src/formatter/format");
const fixtures = [
  ...require("./fixtures/regressions.json"),
  ...require("./fixtures/history.json"),
];
const available = fs.existsSync(
  path.join(__dirname, "php/vendor/autoload.php"),
);
if (process.env.TWIG_ORACLE_REQUIRED && !available)
  throw new Error(
    "Run composer install --working-dir=test/php before the required Twig oracle check",
  );
test(
  "official Twig lexer independently verifies every supported named fixture",
  { skip: !available },
  async () => {
    const cases = [];
    for (const f of fixtures.filter(
      (f) => !f.reject && !f.id.includes("ignore-region"),
    ))
      cases.push({
        ...f,
        formatted: await format(f.source, { tabSize: 2, newLine: false }),
      });
    const result = spawnSync("php", [path.join(__dirname, "php/oracle.php")], {
      input: JSON.stringify(cases),
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    for (const entry of JSON.parse(result.stdout)) {
      assert(!entry.error, entry.id + ": " + entry.error);
      assert.deepEqual(entry.after, entry.before, entry.id);
    }
  },
);
test(
  "official Twig renders match byte for byte, including both conditional branches",
  { skip: !available },
  async () => {
    const examples = [
      {
        id: "conditional-wrapper",
        source:
          '<main>{% if label %}<div>{% endif %}<input value="{{value}}">{% if label %}<label>{{label}}</label></div>{% endif %}</main>',
        contexts: [
          { label: "Search", value: "A" },
          { label: "", value: "B" },
        ],
      },
      {
        id: "inline-text",
        source: "<p>A{{name|upper}}B<strong>C</strong>D {{value}} E</p>",
        contexts: [
          { name: "a", value: "v" },
          { name: "", value: "" },
        ],
      },
      {
        id: "nested-quotes",
        source: '<input value="{{ data["key"] }}" title="{{ "a    b" }}">',
        contexts: [{ data: { key: "<value>" } }],
      },
      {
        id: "trim-controls",
        source: '{% set x = " a " %}A  {{- x -}} B\n{{~ x ~}}\nEnd',
        contexts: [{}],
      },
      {
        id: "verbatim",
        source: "{% verbatim %}{{  literal }}\n    <unclosed>{% endverbatim %}",
        contexts: [{}],
      },
      {
        id: "modern-expressions",
        source: '{{ [1,2,3]|map((x)=>x*2)|join(",") }} {{ 3 b-and 1 }}',
        contexts: [{}],
      },
      {
        id: "pre-textarea",
        source: "<pre> a\n   b {{x}}</pre><textarea> x\n y </textarea>",
        contexts: [{ x: "value" }],
      },
    ];
    for (const f of examples)
      f.formatted = await format(f.source, { tabSize: 2, newLine: false });
    const result = spawnSync("php", [path.join(__dirname, "php/oracle.php")], {
      input: JSON.stringify(examples),
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    for (const entry of JSON.parse(result.stdout)) {
      assert(!entry.error, entry.id + ": " + entry.error);
      for (const [before, after] of entry.renders)
        assert.equal(after, before, entry.id);
    }
  },
);

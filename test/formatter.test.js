"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { format, formatEdits, applyEdits } = require("../src/formatter/format");
const { preservationKey } = require("../src/formatter/preservation");
const fixtures = require("./fixtures/regressions.json");
for (const fixture of fixtures) {
  test(fixture.id, async () => {
    if (fixture.reject)
      return assert.rejects(format(fixture.source), /Unclosed|Unbalanced/);
    for (const insertSpaces of [true, false])
      for (const eol of ["\n", "\r\n"]) {
        const source = fixture.source.replace(/\n/g, eol);
        const options = { insertSpaces, tabSize: 2, newLine: false, eol };
        const result = await format(source, options);
        assert.equal(
          await format(result, options),
          result,
          "second format must be a no-op",
        );
        assert.equal(
          await format(result, options),
          result,
          "third format must be a no-op",
        );
        assert.deepEqual(
          preservationKey(result, true),
          preservationKey(source, true),
          "source-bearing spans must survive",
        );
        if (eol === "\r\n")
          assert(
            !/(?<!\r)\n/.test(result),
            "generated line breaks must be CRLF",
          );
      }
  });
}
test("expected nested HTML and Twig layout, including void elements", async () => {
  const source =
    "<div>\n{% if item %}\n<input disabled>\n<span>{{item.name| upper}}</span>\n{% else %}\n<p>None</p>\n{% endif %}\n</div>";
  assert.equal(
    await format(source, { tabSize: 2 }),
    "<div>\n  {% if item %}\n    <input disabled>\n    <span>{{ item.name|upper }}</span>\n  {% else %}\n    <p>None</p>\n  {% endif %}\n</div>\n",
  );
});
test("for else and shorthand set/block do not accumulate nesting", async () => {
  const source =
    '{% block head "" %}\n{% for x in xs %}\n{% set name = x.name %}\n{{name}}\n{% else %}\nNone\n{% endfor %}\n<p>Tail</p>';
  assert.equal(
    await format(source, { tabSize: 2 }),
    '{% block head "" %}\n{% for x in xs %}\n  {% set name = x.name %}\n  {{ name }}\n{% else %}\n  None\n{% endfor %}\n<p>Tail</p>\n',
  );
});
test("case indentation is stable and endswitch resets it", async () => {
  const source =
    '{% switch x %}\n{% case "a" %}\nA\n{% default %}\nB\n{% endswitch %}\n<p>Tail</p>';
  assert.equal(
    await format(source, { tabSize: 2 }),
    '{% switch x %}\n  {% case "a" %}\n    A\n  {% default %}\n    B\n{% endswitch %}\n<p>Tail</p>\n',
  );
});
test("attributes wrap without changing values, order, case or self-closing semantics", async () => {
  assert.equal(
    await format('<div>\n<input dataValue="a b" disabled/>\n</div>', {
      tabSize: 2,
      forceAttribute: true,
      spaceClose: true,
    }),
    '<div>\n  <input\n    dataValue="a b"\n    disabled\n  />\n</div>\n',
  );
});
test("script statements and CSS media queries receive real language formatting", async () => {
  const result = await format(
    '<div>\n<script>function test(){return "{{ id }}";}</script>\n<style>@media screen and (max-width:780px){.a{color:red;}}</style>\n</div>',
    { tabSize: 2 },
  );
  assert.match(
    result,
    /    function test\(\) \{\n      return "\{\{ id \}\}";\n    \}/,
  );
  assert.match(result, /@media screen and \(max-width: 780px\)/);
  assert.match(result, /      \.a \{\n        color: red;/);
});
test("embedded template literal contents survive container indentation", async () => {
  const source =
    "<div>\n<script>const message = `first\n  second\nthird`; console.log(message);</script>\n</div>";
  const result = await format(source, { tabSize: 2 });
  assert(result.includes("`first\n  second\nthird`"));
});
test("literal spaces, raw regions and inline boundaries are exact", async () => {
  for (const id of [
    "literal-spaces",
    "inline-boundary",
    "raw-verbatim",
    "pre-textarea",
    "twig-string-interpolation",
  ]) {
    const source = fixtures.find((f) => f.id === id).source;
    const result = await format(source, { newLine: false });
    if (!source.includes("\n"))
      assert.equal(result, source.replace("{{x}}", "{{ x }}"));
  }
});
test("range formats complete selected source spans with full document context", async () => {
  const source =
    "<div>\n{% if item %}\n<span>{{item}}</span>\n{% endif %}\n</div>";
  const start = source.indexOf("<span>"),
    end = source.indexOf("\n{% endif");
  const edits = await formatEdits(source, { tabSize: 2 }, { start, end });
  assert(edits.length > 0);
  assert(edits.every((e) => e.start >= start && e.end <= end));
  assert.equal(
    applyEdits(source, edits),
    "<div>\n{% if item %}\n    <span>{{ item }}</span>\n{% endif %}\n</div>",
  );
});
test("partial token range is preserved; no edits escape the selection", async () => {
  const source = '<div title="{{value}}">Text</div>';
  assert.deepEqual(await formatEdits(source, {}, { start: 14, end: 17 }), []);
});
test("unchanged documents return no edits", async () => {
  assert.deepEqual(await formatEdits("<p>{{ value }}</p>\n", {}), []);
});
test("input and nesting limits reject before returning edits", async () => {
  await assert.rejects(format("x".repeat(2 * 1024 * 1024 + 1)), /2 MiB/);
  await assert.rejects(format("<div>".repeat(257)), /256/);
});
test("fuzzed Twig literals and comparisons retain their exact payloads", async () => {
  let seed = 1729;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  const chars = [
    "<",
    ">",
    "=",
    "'",
    '"',
    "{{",
    "}}",
    "{%",
    "%}",
    "#",
    " ",
    "\\",
    "😀",
    "&amp;",
  ];
  for (let i = 0; i < 250; i++) {
    let value = "";
    for (let j = 0; j < 12; j++)
      value += chars[Math.floor(random() * chars.length)];
    const literal =
      "'" + value.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    const source =
      '<div title="{{ ' +
      literal +
      ' }}">{% if x<3 %}{{ ' +
      literal +
      " }}{% endif %}</div>";
    const result = await format(source, { newLine: false });
    assert(result.includes(literal));
    assert.equal(await format(result, { newLine: false }), result);
  }
});

test("HTML wrapping counts the visual width of tabs", async () => {
  const result = await format('<div>\n<input title="abcd">\n</div>', {
    insertSpaces: false,
    tabSize: 4,
    wrap: 21,
  });
  assert(result.includes('<input\n\t\ttitle="abcd"'));
});

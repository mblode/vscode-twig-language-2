"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { parse, isOpaque } = require("../src/formatter/parser");
const { format, formatEdits } = require("../src/formatter/format");
const fixtures = [
  ...require("./fixtures/regressions.json"),
  ...require("./fixtures/history.json"),
];

test("parser leaves cover every historical source exactly, including malformed input", () => {
  for (const { source, id } of fixtures) {
    const tree = parse(source);
    assert.equal(tree.tokens.map((t) => t.raw).join(""), source, id);
    let offset = 0;
    for (const token of tree.tokens) {
      assert.equal(token.start, offset, id);
      assert.equal(source.slice(token.start, token.end), token.raw, id);
      offset = token.end;
    }
    assert.equal(offset, source.length, id);
  }
});

test("Twig tree supports HTML wrappers crossing separate conditionals", () => {
  const source =
    "{% if ok %}<div>{% endif %}😀\r\n{% if ok %}</div>{% endif %}";
  const tree = parse(source);
  assert.deepEqual(tree.diagnostics, []);
  assert.equal(tree.children[0].type, "block");
  assert.equal(tree.children[0].children[0].raw, "<div>");
  assert.equal(tree.children[2].children[0].raw, "</div>");
  assert.equal(tree.children[2].end, source.length);
});

test("branches belong to their immediate Twig block", () => {
  const tree = parse(
    "{% if x %}{% for y in z %}a{% else %}b{% endfor %}{% elseif y %}c{% else %}d{% endif %}",
  );
  assert.deepEqual(tree.diagnostics, []);
  assert.equal(tree.children[0].branches.length, 2);
  assert.equal(tree.children[0].children[0].branches.length, 1);
});

for (const source of [
  '{% if x %}\n<div  a = "b">\n{% endfor %}',
  "{% for x in xs %}{% elseif a %}{{a+b}}{% endfor %}",
  "{% if x %}{% else %}{% elseif y %}x{% endif %}",
  "{% if x %}{% else %}{% else %}x{% endif %}",
  "{% else %}{{a+b}}",
  "{% if x %}{{a+b}}",
  "{% if x %}{% for a in b %}{% endif %}{% endfor %}",
])
  test(`malformed block structure produces no edits: ${source}`, async () => {
    assert(parse(source).diagnostics.length);
    assert.deepEqual(await formatEdits(source), []);
  });

test("unknown block bodies remain exact while surrounding known syntax formats", async () => {
  const opaque =
    '{% custom   foo %}\n     {{a+b}}\n <p   x = "y">x</p>\n{% endcustom %}';
  const source = "{{a+b}}\n" + opaque + "\n{{c+d}}";
  assert.equal(
    await format(source, { newLine: false }),
    "{{ a + b }}\n" + opaque + "\n{{ c + d }}",
  );
  assert.equal(await format(opaque), opaque);
});

test("standalone unknown tags and their indentation are preserved", async () => {
  const source = "   {% extension_specific   a+b %}";
  assert.equal(await format(source), source);
});

test("nested unknown regions collapse without losing protection", () => {
  const source = "{% a %}{% b %}x{% endb %}{% c %}y{% endc %}{% enda %}";
  assert.deepEqual(parse(source).opaque, [{ start: 0, end: source.length }]);
  const regions = [
    { start: 3, end: 8 },
    { start: 10, end: 12 },
  ];
  for (let start = 0; start < 14; start++)
    for (let end = start; end < 14; end++)
      assert.equal(
        isOpaque(regions, start, end),
        regions.some(
          (r) =>
            start < r.end && (end === start ? start >= r.start : end > r.start),
        ),
      );
});

test("literal blocks do not contribute fake Twig structure", () => {
  assert.deepEqual(
    parse("{% verbatim %}{% else %}{% endif %}{% endverbatim %}").diagnostics,
    [],
  );
});

test("set assignments and shorthand blocks do not require closing tags", () => {
  assert.deepEqual(
    parse('{% set a = 1 %}{% block title "Hello" %}').diagnostics,
    [],
  );
});

test("bounded nesting fails before stack exhaustion", () => {
  assert.throws(() => parse("{% if x %}".repeat(257)), /256/);
});

test("deterministic generated nesting retains leaves and formats idempotently", async () => {
  for (let depth = 1; depth <= 32; depth++) {
    const source =
      "{% if x %}\r\n".repeat(depth) +
      "<p>😀 {{a+b}}</p>\r\n" +
      "{% endif %}\r\n".repeat(depth);
    const tree = parse(source);
    assert.deepEqual(tree.diagnostics, []);
    assert.equal(tree.tokens.map((t) => t.raw).join(""), source);
    const result = await format(source, { tabSize: 2 });
    assert.equal(await format(result, { tabSize: 2 }), result);
  }
});

test("HTML inside unknown bodies cannot affect surrounding indentation", async () => {
  const source =
    "<main>\n{% custom %}<div>{% endcustom %}\n<p>{{x}}</p>\n</main>";
  assert.equal(
    await format(source, { tabSize: 2, newLine: false }),
    "<main>\n{% custom %}<div>{% endcustom %}\n  <p>{{ x }}</p>\n</main>",
  );
});

"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { emmetSyntax } = require("../src/emmet");
// "|" marks the cursor.
const at = (marked) => {
  const offset = marked.indexOf("|");
  return emmetSyntax(
    marked.slice(0, offset) + marked.slice(offset + 1),
    offset,
  );
};
test("Emmet is never offered inside Twig delimiters", () => {
  for (const [open, close] of [
    ["{{", "}}"],
    ["{%", "%}"],
    ["{#", "#}"],
  ]) {
    assert.equal(
      at(`<div>${open} event.show_thumb| ${close}</div>`),
      undefined,
    );
    assert.equal(
      at(`<div>${open}| event ${close}</div>`),
      undefined,
      `after ${open}`,
    );
    assert.equal(at(`<div>${open[0]}|${open[1]} x ${close}</div>`), undefined);
    assert.equal(at(`<div>${open} x ${close[0]}|${close[1]}</div>`), undefined);
    assert.equal(
      at(`<div>${open} x |${close}</div>`),
      undefined,
      `before ${close}`,
    );
    assert.equal(
      at(`<div>${open} event.show_thumb|`),
      undefined,
      `unclosed ${open}`,
    );
    assert.equal(
      at(`<div>${open} x ${close}|</div>`),
      "html",
      `after ${close}`,
    );
    assert.equal(
      at(`<div>div|${open} x ${close}</div>`),
      "html",
      `before ${open}`,
    );
    assert.equal(at(`${open} x ${close}\nul>li|`), "html");
  }
  assert.equal(at("{% if event.show_thumb| %}{% endif %}"), undefined);
  assert.equal(at("{% verbatim %}<p>div.x|</p>{% endverbatim %}"), undefined);
  assert.equal(at('{% set x = "}}" %}div|'), "html");
});
test("Emmet is offered in HTML text only", () => {
  assert.equal(at("div.foo|"), "html");
  assert.equal(at("|"), "html");
  assert.equal(at("<div>ul>li*3|</div>"), "html");
  assert.equal(at("<p>text</p>\n  section|"), "html");
  assert.equal(at("<br/>a|"), "html");
  assert.equal(at("<!doctype html>html:5|"), "html");
  assert.equal(at("<div|"), undefined, "tag name");
  assert.equal(at("<div cl|"), undefined, "attribute name");
  assert.equal(at("<div |>"), undefined, "inside a tag");
  assert.equal(at('<div class="a|"'), undefined, "attribute value");
  assert.equal(at('<div class="a"|>'), undefined, "after an attribute value");
  assert.equal(
    at("<div class={{ x }}|>"),
    undefined,
    "after a Twig attribute value",
  );
  assert.equal(at('<a href="{{ url }}">a.b|</a>'), "html");
  assert.equal(at("</div|>"), undefined, "closing tag");
  assert.equal(at("<!-- div.x| -->"), undefined, "comment");
  assert.equal(at("<!-- div.x|"), undefined, "unclosed comment");
  assert.equal(at("<!-- x -->div|"), "html", "after a comment");
  assert.equal(at("<script>div.x|</script>"), undefined, "script");
  assert.equal(at('<script type="text/javascript">a.b|</script>'), undefined);
  assert.equal(at('<script type="text/x-template">div.x|</script>'), "html");
  assert.equal(at("<script>x</script>div|"), "html");
});
test("Emmet uses CSS in style elements and attributes", () => {
  assert.equal(at("<style>m10|</style>"), "css");
  assert.equal(at("<style>\n  .a { m10| }\n</style>"), "css");
  assert.equal(at("<style>|"), "css");
  assert.equal(at("<style>{{ x }} m10|</style>"), "css");
  assert.equal(at("<style>{{ m10| }}</style>"), undefined);
  assert.equal(at('<div style="m10|">'), "css");
  assert.equal(at("<div style='p5|'>"), "css");
  assert.equal(at('<div style="m10|'), "css", "unclosed style value");
  assert.equal(at('<div style="m10"|>'), undefined);
  assert.equal(at('<div style="{{ m10| }}">'), undefined);
  assert.equal(at("<style>a{}</style>div|"), "html");
});
